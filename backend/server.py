from dotenv import load_dotenv
from pathlib import Path
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import asyncio
import io
import base64
import logging
import secrets
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Literal, Annotated

import bcrypt
import jwt
import qrcode
import re
import ipaddress
import httpx
import secrets as pysecrets
import hashlib
import hmac
from html import escape
from html.parser import HTMLParser
from urllib.parse import urlparse
from bson import ObjectId
from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, Header
from fastapi.responses import StreamingResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, BeforeValidator, EmailStr, ConfigDict, field_validator
from reportlab.lib.pagesizes import A5
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.units import mm
from whatsapp_integration import reminder_loop

# =========================================================
# Setup
# =========================================================
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'dukaan')]

JWT_ALGORITHM = "HS256"
JWT_SECRET = os.environ.get("JWT_SECRET", "").strip()
if not JWT_SECRET:
    raise RuntimeError("JWT_SECRET must be configured in the environment; refusing to start with a default secret.")

# Email Configuration (Supports Resend API, SMTP, or Emergent Relay)
EMAIL_BASE_URL = os.environ.get("EMAIL_BASE_URL", "https://integrations.emergentagent.com")
EMAIL_KEY = os.environ.get("EMERGENT_EMAIL_KEY", "")
RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
EMAIL_FROM_NAME = os.environ.get("EMAIL_FROM_NAME", "Dukaan")
SMTP_HOST = os.environ.get("SMTP_HOST", "")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587") if os.environ.get("SMTP_PORT") else "587")
SMTP_USER = os.environ.get("SMTP_USER", "")
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD", "")
OWNER_NOTIFY_EMAIL = os.environ.get("OWNER_NOTIFY_EMAIL", "").strip()
FRONTEND_URL_ENV = os.environ.get("FRONTEND_URL", "https://officialdukaan.in").strip().rstrip("/")
RAZORPAY_KEY_ID = os.environ.get("RAZORPAY_KEY_ID", "").strip()
RAZORPAY_KEY_SECRET = os.environ.get("RAZORPAY_KEY_SECRET", "").strip()
RAZORPAY_WEBHOOK_SECRET = os.environ.get("RAZORPAY_WEBHOOK_SECRET", "").strip()
SUBSCRIPTION_CRON_SECRET = os.environ.get("SUBSCRIPTION_CRON_SECRET", "").strip()
origins = [origin.strip().rstrip("/") for origin in os.environ.get("CORS_ORIGINS", "").split(",") if origin.strip()]
if not origins or "*" in origins:
    raise RuntimeError("CORS_ORIGINS must explicitly list trusted frontend origins when credentials are enabled.")

app = FastAPI(title="Kivo API")
api = APIRouter(prefix="/api")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("kivo")


# =========================================================
# Lightweight per-process abuse protection
# =========================================================
async def _rate_limit(key: str, limit: int, window_seconds: int = 60):
    # Fixed-window Mongo counter: shared across all API instances/processes.
    now = datetime.now(timezone.utc)
    bucket_number = int(now.timestamp() // window_seconds)
    bucket_id = hashlib.sha256(f"{key}:{bucket_number}".encode()).hexdigest()
    expires_at = now + timedelta(seconds=window_seconds * 2)
    result = await db.rate_limits.find_one_and_update(
        {"_id": bucket_id},
        {"$inc": {"count": 1}, "$setOnInsert": {"expires_at": expires_at}},
        upsert=True,
        return_document=True,
    )
    count = int(result.get("count", 0))
    if count > limit:
        retry_after = max(1, int((bucket_number + 1) * window_seconds - now.timestamp()))
        raise HTTPException(429, "Too many requests. Please try again later.", headers={"Retry-After": str(retry_after)})


def _client_key(request: Request, scope: str):
    forwarded = request.headers.get("x-forwarded-for", "")
    ip = forwarded.split(",")[0].strip() if forwarded else (request.client.host if request.client else "unknown")
    return f"{scope}:{ip}"


# =========================================================
# Helpers
# =========================================================
def _oid(v):
    if isinstance(v, ObjectId):
        return str(v)
    if isinstance(v, str) and ObjectId.is_valid(v):
        return v
    raise ValueError("Invalid ObjectId")

PyObjectId = Annotated[str, BeforeValidator(_oid)]


def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()


def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except Exception:
        return False


def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "access",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def _set_cookie(resp: Response, token: str):
    resp.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=7 * 24 * 3600,
        path="/",
    )


ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "contact@officialdukaan.in").strip().lower()

async def get_admin_user(request: Request) -> dict:
    user = await _get_current_user(request)
    if not user.get("is_admin") or (user.get("email") or "").lower() != ADMIN_EMAIL:
        raise HTTPException(status_code=403, detail="Admin access required.")
    return user


async def _get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user["id"] = str(user.pop("_id"))
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


async def get_current_user(request: Request) -> dict:
    return await _get_current_user(request)


PLAN_TIER = {"starter": 1, "business": 2, "cafe": 2.5, "premium": 3, "pro": 4}


async def _active_sub(user_id: str) -> Optional[dict]:
    now_iso_str = datetime.now(timezone.utc).isoformat()
    return await db.subscriptions.find_one({
        "user_id": user_id,
        "status": "active",
        "$or": [{"expires_at": None}, {"expires_at": {"$gt": now_iso_str}}],
    }, sort=[("activated_at", -1)])


async def require_active_subscription(user: dict = Depends(get_current_user)) -> dict:
    if user.get("is_admin"):
        return user
    sub = await _active_sub(user["id"])
    if not sub:
        raise HTTPException(status_code=402, detail="Subscription required")
    return {**user, "subscription": clean(sub) if sub else None}


def require_plan(min_plan: str):
    """Dependency factory: user must have active subscription with tier >= min_plan."""
    async def _dep(user: dict = Depends(require_active_subscription)) -> dict:
        if user.get("is_admin"):
            return user
        current = user.get("subscription", {}).get("plan", "")
        if PLAN_TIER.get(current, 0) < PLAN_TIER.get(min_plan, 0):
            raise HTTPException(status_code=402, detail=f"Upgrade required: {min_plan}")
        return user
    return _dep


async def get_shop(
    request: Request,
    user: dict = Depends(get_current_user),
    x_shop_id: Optional[str] = Header(None, alias="X-Shop-Id"),
) -> dict:
    shop_id = x_shop_id or request.query_params.get("shop_id")
    if not shop_id or not ObjectId.is_valid(shop_id):
        raise HTTPException(status_code=400, detail="Shop id required")
    shop = await db.shops.find_one({"_id": ObjectId(shop_id), "owner_id": user["id"]})
    if not shop:
        raise HTTPException(status_code=403, detail="Shop not found or not owned")
    shop["id"] = str(shop.pop("_id"))
    return shop


async def get_shop_paid(
    request: Request,
    user: dict = Depends(get_current_user),
    x_shop_id: Optional[str] = Header(None, alias="X-Shop-Id"),
) -> dict:
    """Same as get_shop, but also requires an active subscription (or admin)."""
    shop_id = x_shop_id or request.query_params.get("shop_id")
    if not shop_id or not ObjectId.is_valid(shop_id):
        raise HTTPException(status_code=400, detail="Shop id required")
    shop = await db.shops.find_one({"_id": ObjectId(shop_id), "owner_id": user["id"]})
    if not shop:
        raise HTTPException(status_code=403, detail="Shop not found or not owned")
    if not user.get("is_admin"):
        sub = await _active_sub(user["id"])
        if not sub:
            raise HTTPException(status_code=402, detail="Subscription required")
    shop["id"] = str(shop.pop("_id"))
    return shop


def get_shop_plan(min_plan: str):
    async def _dep(
        request: Request,
        user: dict = Depends(get_current_user),
        x_shop_id: Optional[str] = Header(None, alias="X-Shop-Id"),
    ) -> dict:
        shop_id = x_shop_id or request.query_params.get("shop_id")
        if not shop_id or not ObjectId.is_valid(shop_id):
            raise HTTPException(status_code=400, detail="Shop id required")
        shop = await db.shops.find_one({"_id": ObjectId(shop_id), "owner_id": user["id"]})
        if not shop:
            raise HTTPException(status_code=403, detail="Shop not found or not owned")
        if not user.get("is_admin"):
            sub = await _active_sub(user["id"])
            if not sub:
                raise HTTPException(status_code=402, detail="Subscription required")
            if PLAN_TIER.get(sub.get("plan",""), 0) < PLAN_TIER.get(min_plan, 0):
                raise HTTPException(status_code=402, detail=f"Upgrade to {min_plan} required")
        shop["id"] = str(shop.pop("_id"))
        return shop
    return _dep


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def clean(doc: dict) -> dict:
    if not doc:
        return doc
    if "_id" in doc:
        doc["id"] = str(doc.pop("_id"))
    return doc


# =========================================================
# Schemas
# =========================================================
# Schemas & Validation
# =========================================================
SPECIAL_PASSWORD_CHARS = set("!@#$%^&*(),.?\":{}|<>-=_+[]\\/`~")

def validate_strong_password(pw: str) -> str:
    if len(pw) < 8:
        raise ValueError("Password must be at least 8 characters long")
    if not any(c.isupper() for c in pw):
        raise ValueError("Password must contain at least one capital letter (A-Z)")
    if not any(c.isdigit() for c in pw):
        raise ValueError("Password must contain at least one number (0-9)")
    if not any(c in SPECIAL_PASSWORD_CHARS for c in pw):
        raise ValueError("Password must contain at least one special symbol (!@#$%^&*...)")
    return pw

class RegisterIn(BaseModel):
    name: str
    email: EmailStr
    password: str

    @field_validator("password")
    @classmethod
    def check_password(cls, v: str) -> str:
        return validate_strong_password(v)

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class ShopIn(BaseModel):
    name: str
    owner_name: Optional[str] = ""
    phone: Optional[str] = ""
    address: Optional[str] = ""
    upi_id: Optional[str] = ""
    upi_qr_data_url: Optional[str] = ""
    logo_data_url: Optional[str] = ""
    invoice_footer: Optional[str] = "Thank you for shopping with us!"
    min_stock_default: int = 5
    contact_email: Optional[str] = ""
    store_category: Optional[str] = ""
    gst_number: Optional[str] = ""
    gst_status: Optional[str] = "not_submitted"
    gst_review_note: Optional[str] = ""
    gst_verified_at: Optional[str] = None
    gst_verified_by: Optional[str] = ""
    gst_enabled: bool = False
    gst_rate: float = 0
    financial_year: Optional[str] = "2026-27"
    store_active: bool = True
    invoice_settings: Optional[dict] = None
    pro_settings: Optional[dict] = None

class ProductIn(BaseModel):
    name: str
    category: Optional[str] = "General"
    selling_price: float
    purchase_price: Optional[float] = 0
    stock: int = 0
    min_stock: int = 5
    unlimited_stock: bool = False
    image_data_url: Optional[str] = ""
    barcode: Optional[str] = ""
    hsn: Optional[str] = ""
    gst_rate: Optional[float] = Field(default=0, ge=0, le=100)
    batch_number: Optional[str] = ""
    expiry_date: Optional[str] = ""

class CustomerIn(BaseModel):
    name: str
    phone: Optional[str] = ""
    notes: Optional[str] = ""

class OrderItemIn(BaseModel):
    product_id: str
    name: str
    price: float
    qty: int

class OrderIn(BaseModel):
    items: List[OrderItemIn]
    discount: float = 0
    customer_id: Optional[str] = None
    payment_method: Literal["cash", "upi", "udhaar"]
    amount_received: Optional[float] = None
    note: Optional[str] = ""

class StockAdjustIn(BaseModel):
    qty: int
    reason: str = "restock"

class UdhaarPaymentIn(BaseModel):
    customer_id: str
    amount: float
    note: Optional[str] = ""

class SubscriptionSubmitIn(BaseModel):
    plan: Literal["starter", "business", "cafe", "premium", "pro"]
    upi_ref: str = Field(min_length=3)
    payer_name: Optional[str] = ""
    screenshot_data_url: Optional[str] = ""

class RazorpayOrderIn(BaseModel):
    plan: Literal["starter", "business", "cafe", "premium", "pro"]
    renew: bool = False

class RazorpayVerifyIn(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str

class PremiumProfileIn(BaseModel):
    owner_name: str = ""
    phone: str = ""
    contact_email: EmailStr
    name: str
    store_category: str

class GSTSubmitIn(BaseModel):
    gst_number: str = Field(min_length=5, max_length=20)

class GSTReviewIn(BaseModel):
    note: Optional[str] = ""


class TrialStartIn(BaseModel):
    plan: Literal["starter", "business", "cafe", "premium", "pro"]

class PremiumSettingsIn(BaseModel):
    gst_enabled: bool = False
    gst_rate: float = Field(default=0, ge=0, le=100)
    financial_year: str = "2026-27"
    store_active: bool = True

PLANS = {
    "starter":  {"name": "Starter",   "setup": 299, "monthly": 79,  "trial_days": 90},
    "business": {"name": "Business",  "setup": 499, "monthly": 119, "trial_days": 60},
    "cafe":     {"name": "Cafe Plan", "setup": 0,   "monthly": 149, "trial_days": 30},
    "premium":  {"name": "Premium",   "setup": 999, "monthly": 239, "trial_days": 30},
    "pro":      {"name": "Dukaan Pro","setup": 0,   "monthly": 499, "trial_days": 14},
}


# =========================================================
# EMAIL (Emergent-managed Resend) with G1-G5 guardrails
# =========================================================
_SHORTENERS = ("bit.ly", "tinyurl.com", "t.co", "is.gd", "cutt.ly", "goo.gl", "rebrand.ly")
_CRED_ASK = ("reply with your password", "reply with the code", "send your password", "cvv",
             "send us your password", "enter your password below", "confirm your card number",
             "your full card number", "seed phrase", "recovery phrase", "verify your card",
             "social security number", "confirm your bank details")
_HOSTISH = re.compile(r"\b(?:https?://)?((?:[a-z0-9-]+\.)+[a-z]{2,})", re.I)


def _host_ok(host: str) -> bool:
    if not host or "xn--" in host:
        return False
    try:
        ipaddress.ip_address(host)
        return False
    except ValueError:
        pass
    return not any(host == s or host.endswith("." + s) for s in _SHORTENERS)


def _same_site(shown: str, real: str) -> bool:
    return shown == real or real.endswith("." + shown) or shown.endswith("." + real)


class _EmailScan(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tags, self.urls, self.anchors = set(), [], []
        self._href, self._text = None, []
    def handle_starttag(self, tag, attrs):
        self.tags.add(tag.lower())
        self.urls += [v for k, v in attrs if k.lower() in ("href", "src") and v]
        if tag.lower() == "a":
            self._href = dict((k.lower(), v) for k, v in attrs).get("href")
            self._text = []
    def handle_data(self, data):
        if self._href is not None:
            self._text.append(data)
    def handle_endtag(self, tag):
        if tag.lower() == "a" and self._href is not None:
            self.anchors.append((self._href, "".join(self._text)))
            self._href, self._text = None, []


def _assert_safe_email(subject: str, html: str) -> None:
    scan = _EmailScan(); scan.feed(html)
    if scan.tags & {"form", "input", "textarea", "select"}:
        raise ValueError("No forms in email (G2)")
    body = f"{subject}\n{html}".lower()
    for p in _CRED_ASK:
        if p in body:
            raise ValueError(f"Email asks for credentials: {p!r} (G2)")
    for url in scan.urls:
        low = url.strip().lower()
        if low.startswith(("mailto:", "tel:", "cid:", "#")):
            continue
        if not low.startswith("https://"):
            raise ValueError(f"Email links must be https: {url!r} (G3)")
        host = urlparse(low).hostname or ""
        if not _host_ok(host) or urlparse(low).username is not None:
            raise ValueError(f"Unsafe URL: {url!r} (G3)")
    for href, text in scan.anchors:
        real = urlparse(href.strip().lower()).hostname or ""
        if not real:
            continue
        for m in _HOSTISH.finditer(text):
            if not _same_site(m.group(1).lower(), real):
                raise ValueError("Visible link text does not match destination (G4)")


async def send_email(to: str, subject: str, html: str):
    if not to:
        return False
    try:
        _assert_safe_email(subject, html)
    except Exception as e:
        logger.warning(f"Email safety check: {e}")

    # 1. Try Direct Resend API
    if RESEND_API_KEY:
        try:
            from_header = f"{EMAIL_FROM_NAME} <onboarding@resend.dev>" if "<" not in EMAIL_FROM_NAME else EMAIL_FROM_NAME
            async with httpx.AsyncClient(timeout=15) as c:
                r = await c.post(
                    "https://api.resend.com/emails",
                    headers={"Authorization": f"Bearer {RESEND_API_KEY}", "Content-Type": "application/json"},
                    json={"from": from_header, "to": [to], "subject": subject, "html": html}
                )
                if r.status_code in (200, 201):
                    logger.info(f"Verification email dispatched via Resend to {to}")
                    return True
                else:
                    logger.warning(f"Resend returned status {r.status_code}: {r.text}")
        except Exception as e:
            logger.warning(f"Resend sending error: {e}")

    # 2. Try Standard SMTP (Gmail, Hostinger, Brevo, AWS SES, etc.)
    if SMTP_HOST and SMTP_USER and SMTP_PASSWORD:
        try:
            import smtplib
            from email.mime.multipart import MIMEMultipart
            from email.mime.text import MIMEText

            def _send_smtp():
                msg = MIMEMultipart("alternative")
                msg["Subject"] = subject
                from_addr = f"{EMAIL_FROM_NAME} <{SMTP_USER}>" if "<" not in EMAIL_FROM_NAME else EMAIL_FROM_NAME
                msg["From"] = from_addr
                msg["To"] = to
                msg.attach(MIMEText(html, "html"))
                
                port = int(SMTP_PORT or 465)
                # Try primary host first, then alternative host as fallback
                candidate_hosts = [SMTP_HOST]
                if "secureserver.net" in SMTP_HOST:
                    candidate_hosts.append("smtp.titan.email")
                elif "titan.email" in SMTP_HOST:
                    candidate_hosts.append("smtpout.secureserver.net")

                last_err = None
                for host in candidate_hosts:
                    try:
                        if port == 465:
                            with smtplib.SMTP_SSL(host, port, timeout=15) as server:
                                server.login(SMTP_USER, SMTP_PASSWORD)
                                server.sendmail(SMTP_USER, [to], msg.as_string())
                        else:
                            with smtplib.SMTP(host, port, timeout=15) as server:
                                server.starttls()
                                server.login(SMTP_USER, SMTP_PASSWORD)
                                server.sendmail(SMTP_USER, [to], msg.as_string())
                        return True
                    except Exception as err:
                        last_err = err
                        logger.warning(f"SMTP attempt on {host}:{port} failed: {err}")
                if last_err:
                    raise last_err

            await asyncio.to_thread(_send_smtp)
            logger.info(f"Verification email dispatched via SMTP to {to}")
            return True
        except Exception as e:
            logger.warning(f"SMTP sending error: {e}")

    # 3. Try Emergent Managed Email
    if EMAIL_KEY:
        try:
            payload = {"to": [to], "subject": subject, "html": html, "from": EMAIL_FROM_NAME}
            async with httpx.AsyncClient(timeout=15) as c:
                r = await c.post(f"{EMAIL_BASE_URL}/resend/send-email", headers={"Authorization": f"Bearer {EMAIL_KEY}"}, json=payload)
                if r.status_code in (200, 201):
                    logger.info(f"Verification email dispatched via Emergent to {to}")
                    return True
        except Exception as e:
            logger.warning(f"Emergent email error: {e}")

    logger.info(f"[EMAIL SERVICE] Notice: No active email provider key configured in env. Code logged on server for {to}.")
    return False


# =========================================================
# Auth
# =========================================================
@api.post("/auth/register")
async def register(body: RegisterIn, response: Response, request: Request):\n    await _rate_limit(_client_key(request, "register"), 5, 300)
    email = body.email.lower().strip()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(409, "An account with this email already exists. Please sign in.")
    now = now_iso()

    verification_code = str(secrets.randbelow(900000) + 100000)
    verification_token = pysecrets.token_urlsafe(32)
    verification_expires = (datetime.now(timezone.utc) + timedelta(hours=24)).isoformat()

    doc = {
        "name": body.name.strip(),
        "email": email,
        "password_hash": hash_password(body.password),
        "created_at": now,
        "is_admin": False,
        "is_verified": False,
        "verification_code": verification_code,
        "verification_token": verification_token,
        "verification_expires_at": verification_expires
    }
    res = await db.users.insert_one(doc)
    uid = str(res.inserted_id)

    shop_doc = {
        'name': body.name.strip() + "'s Shop",
        'owner_id': uid,
        'owner_name': body.name.strip(),
        'phone': '',
        'address': '',
        'upi_id': '',
        'upi_qr_data_url': '',
        'logo_data_url': '',
        'invoice_footer': 'Thank you for shopping with us!',
        'min_stock_default': 5,
        'contact_email': email,
        'store_category': '',
        'gst_number': '',
        'gst_status': 'not_submitted',
        'gst_enabled': False,
        'gst_rate': 0,
        'financial_year': '2026-27',
        'store_active': True,
        'created_at': now
    }
    shop_res = await db.shops.insert_one(shop_doc)

    # Send verification email
    verify_link = f"{FRONTEND_URL_ENV}/verify-email?token={verification_token}&email={email}"
    html = f"""<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #E8E5DF; border-radius: 16px; background-color: #FAF6F0;">
    <h2 style="color: #1B1464; margin-bottom: 8px;">Welcome to Dukaan!</h2>
    <p style="color: #4A4A4A; font-size: 14px; line-height: 1.5;">Thank you for registering. Please verify your email address to activate your account and select your subscription plan.</p>
    <div style="margin: 24px 0; text-align: center;">
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #D4623B; background: #FFFFFF; padding: 14px 28px; border-radius: 12px; border: 2px dashed #D4623B; display: inline-block;">{verification_code}</div>
    </div>
    <div style="text-align: center; margin: 24px 0;">
        <a href="{verify_link}" style="background-color: #D4623B; color: #FFFFFF; padding: 12px 28px; text-decoration: none; border-radius: 9999px; font-weight: bold; display: inline-block; font-size: 14px;">Verify Email Address</a>
    </div>
    <p style="color: #888888; font-size: 12px; text-align: center; margin-top: 16px;">This verification code and link will expire in 24 hours.</p>
</div>"""
    try:
        await send_email(to=email, subject="Verify your Dukaan account", html=html)
    except Exception as e:
        logger.warning(f"Failed to send verification email: {e}")

    return {
        "ok": True,
        "need_verification": True,
        "email": email,
        "message": "Account created! A verification code has been sent to your email.",
        "user": {
            "id": uid,
            "name": doc["name"],
            "email": email,
            "is_admin": False,
            "is_verified": False
        },
        "shop_id": str(shop_res.inserted_id)
    }

@api.post("/auth/social-login")
async def social_login(body: dict, response: Response):
    provider = str(body.get("provider", "google")).lower().strip()
    if provider != "google":
        raise HTTPException(status_code=501, detail="This social provider is not configured for verified sign-in.")

    id_token = str(body.get("id_token") or body.get("credential") or "").strip()
    google_client_id = os.environ.get("GOOGLE_CLIENT_ID", "").strip()
    if not id_token or not google_client_id:
        raise HTTPException(status_code=503, detail="Google sign-in is not configured.")

    try:
        async with httpx.AsyncClient(timeout=5) as http:
            r = await http.get(
                "https://oauth2.googleapis.com/tokeninfo",
                params={"id_token": id_token},
            )
        if r.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid Google identity token.")
        claims = r.json()
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=502, detail="Unable to verify Google identity.")

    if (
        claims.get("aud") != google_client_id
        or claims.get("iss") != "https://accounts.google.com"
        or str(claims.get("email_verified", "")).lower() != "true"
    ):
        raise HTTPException(status_code=401, detail="Google identity verification failed.")

    email = str(claims.get("email", "")).strip().lower()
    if not email:
        raise HTTPException(status_code=400, detail="Google account email is unavailable.")

    name = str(claims.get("name") or body.get("name") or email.split("@")[0]).strip()
    avatar = str(claims.get("picture") or "").strip()
    user = await db.users.find_one({"email": email})
    now = now_iso()

    if not user:
        doc = {
            "name": name,
            "email": email,
            "password_hash": "",
            "is_admin": email == ADMIN_EMAIL,
            "is_verified": True,
            "email_verified": True,
            "phone_verified": False,
            "provider": "google",
            "avatar": avatar,
            "created_at": now,
        }
        res = await db.users.insert_one(doc)
        user = await db.users.find_one({"_id": res.inserted_id})
        await db.shops.insert_one({
            "name": name + "'s Shop",
            "owner_id": str(res.inserted_id),
            "owner_name": name,
            "phone": "",
            "address": "",
            "contact_email": email,
            "store_category": "",
            "gst_status": "not_submitted",
            "gst_enabled": False,
            "gst_rate": 0,
            "financial_year": "2026-27",
            "store_active": True,
            "created_at": now,
        })
    else:
        await db.users.update_one(
            {"_id": user["_id"]},
            {"$set": {"is_verified": True, "email_verified": True, "provider": "google", "avatar": avatar or user.get("avatar", "")}},
        )
        user = await db.users.find_one({"_id": user["_id"]})

    uid = str(user["_id"])
    token = create_access_token(uid, email)
    _set_cookie(response, token)
    return {
        "ok": True,
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": uid,
            "name": user.get("name", name),
            "email": email,
            "avatar": user.get("avatar", avatar),
            "is_verified": True,
            "email_verified": True,
            "is_admin": bool(user.get("is_admin")) and email == ADMIN_EMAIL,
        },
    }

@api.post("/auth/verify-email")
async def verify_email(body: dict, response: Response, request: Request):\n    await _rate_limit(_client_key(request, "verify-email"), 10, 300)
    email = body.get("email", "").lower().strip()
    code = str(body.get("code", "")).strip()
    token = str(body.get("token", "")).strip()

    if not email or (not code and not token):
        raise HTTPException(400, "Email and verification code or link are required.")

    user = await db.users.find_one({"email": email})
    if not user:
        raise HTTPException(404, "No account found with this email.")

    if user.get("is_verified"):
        uid = str(user["_id"])
        jwt_token = create_access_token(uid, email)
        _set_cookie(response, jwt_token)
        return {
            "ok": True,
            "message": "Email is already verified.",
            "access_token": jwt_token,
            "token_type": "bearer",
            "user": {
                "id": uid,
                "name": user.get("name", ""),
                "email": email,
                "is_admin": bool(user.get("is_admin")),
                "is_verified": True
            }
        }

    is_valid = False
    if code and str(user.get("verification_code", "")).strip() == code:
        is_valid = True
    elif token and str(user.get("verification_token", "")).strip() == token:
        is_valid = True

    if not is_valid:
        raise HTTPException(400, "Invalid or expired verification code. Please check and try again.")

    uid = str(user["_id"])
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"is_verified": True, "verification_code": None, "verification_token": None}}
    )

    jwt_token = create_access_token(uid, email)
    _set_cookie(response, jwt_token)
    return {
        "ok": True,
        "message": "Email verified successfully!",
        "access_token": jwt_token,
        "token_type": "bearer",
        "user": {
            "id": uid,
            "name": user.get("name", ""),
            "email": email,
            "is_admin": bool(user.get("is_admin")),
            "is_verified": True
        }
    }

@api.post("/auth/resend-verification")
async def resend_verification(body: dict, request: Request):\n    await _rate_limit(_client_key(request, "resend-verification"), 3, 300)
    email = body.get("email", "").lower().strip()
    user = await db.users.find_one({"email": email})
    if not user:
        raise HTTPException(404, "No account found with this email.")
    if user.get("is_verified"):
        return {"ok": True, "message": "Account is already verified."}

    verification_code = str(secrets.randbelow(900000) + 100000)
    verification_token = pysecrets.token_urlsafe(32)
    verification_expires = (datetime.now(timezone.utc) + timedelta(hours=24)).isoformat()

    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {
            "verification_code": verification_code,
            "verification_token": verification_token,
            "verification_expires_at": verification_expires
        }}
    )

    verify_link = f"{FRONTEND_URL_ENV}/verify-email?token={verification_token}&email={email}"
    html = f"""<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #E8E5DF; border-radius: 16px; background-color: #FAF6F0;">
    <h2 style="color: #1B1464; margin-bottom: 8px;">Dukaan Email Verification</h2>
    <p style="color: #4A4A4A; font-size: 14px;">Here is your fresh verification code:</p>
    <div style="margin: 24px 0; text-align: center;">
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #D4623B; background: #FFFFFF; padding: 14px 28px; border-radius: 12px; border: 2px dashed #D4623B; display: inline-block;">{verification_code}</div>
    </div>
    <div style="text-align: center; margin: 24px 0;">
        <a href="{verify_link}" style="background-color: #D4623B; color: #FFFFFF; padding: 12px 28px; text-decoration: none; border-radius: 9999px; font-weight: bold; display: inline-block; font-size: 14px;">Verify Email Address</a>
    </div>
    <p style="color: #888888; font-size: 12px; text-align: center;">Expires in 24 hours.</p>
</div>"""
    try:
        await send_email(to=email, subject="Your new Dukaan verification code", html=html)
    except Exception as e:
        logger.warning(f"Failed to resend verification email: {e}")

    return {
        "ok": True,
        "message": "Verification code resent successfully."
    }

@api.post("/auth/login")
async def login(body: LoginIn, response: Response, request: Request):\n    await _rate_limit(_client_key(request, "login"), 10, 60)
    email = body.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user:
        raise HTTPException(404, "No account found with this email. Please create an account.")

    if not verify_password(body.password, user.get("password_hash", "")):
        raise HTTPException(401, "Incorrect password. Please try again.")

    is_verified = bool(user.get("is_verified", True))
    if not is_verified and not user.get("is_admin"):
        raise HTTPException(
            403, 
            detail={
                "message": "Please verify your email address to activate your account.",
                "need_verification": True,
                "email": email
            }
        )

    uid = str(user["_id"])
    token = create_access_token(uid, email)
    _set_cookie(response, token)
    return {
        "ok": True,
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": uid,
            "name": user.get("name", ""),
            "email": email,
            "is_admin": email.lower() == ADMIN_EMAIL,
            "is_verified": is_verified
        }
    }

@api.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    return {"ok": True}

@api.post("/auth/forgot-password")
async def forgot_password(body: dict, request: Request):\n    await _rate_limit(_client_key(request, "forgot-password"), 5, 300)
    email = body.get("email", "").lower().strip()
    if not email:
        raise HTTPException(400, "Email address is required.")
    user = await db.users.find_one({"email": email})
    if not user:
        raise HTTPException(404, "No registered account found with this email address.")

    reset_code = str(secrets.randbelow(900000) + 100000)
    token = pysecrets.token_urlsafe(32)
    expires = datetime.now(timezone.utc) + timedelta(hours=1)
    
    await db.password_resets.delete_many({"user_id": str(user["_id"])})
    await db.password_resets.insert_one({
        "token": token,
        "code": reset_code,
        "email": email,
        "user_id": str(user["_id"]),
        "expires_at": expires
    })
    
    link = f"{FRONTEND_URL_ENV}/reset-password?token={token}&email={email}"
    html = f"""<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #E8E5DF; border-radius: 16px; background-color: #FAF6F0;">
    <h2 style="color: #1B1464; margin-bottom: 8px;">Reset Your Dukaan Password</h2>
    <p style="color: #4A4A4A; font-size: 14px; line-height: 1.5;">We received a request to reset your password. Use the 6-digit code below or click the button:</p>
    <div style="margin: 24px 0; text-align: center;">
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #D4623B; background: #FFFFFF; padding: 14px 28px; border-radius: 12px; border: 2px dashed #D4623B; display: inline-block;">{reset_code}</div>
    </div>
    <div style="text-align: center; margin: 24px 0;">
        <a href="{link}" style="background-color: #D4623B; color: #FFFFFF; padding: 12px 28px; text-decoration: none; border-radius: 9999px; font-weight: bold; display: inline-block; font-size: 14px;">Reset Password</a>
    </div>
    <p style="color: #888888; font-size: 12px; text-align: center; margin-top: 16px;">This link and code are valid for 1 hour. If you did not request this, please disregard.</p>
</div>"""
    try:
        await send_email(to=email, subject="Reset your Dukaan password", html=html)
    except Exception as e:
        logger.warning(f"Failed to send reset email: {e}")

    return {
        "ok": True,
        "email": email,
        "message": "Password reset instructions sent to your email."
    }

@api.post("/auth/reset-password")
async def reset_password(body: dict, request: Request):\n    await _rate_limit(_client_key(request, "reset-password"), 10, 300)
    token = body.get("token")
    code = body.get("code")
    email = body.get("email", "").lower().strip()
    new_password = body.get("new_password", "")

    if not new_password:
        raise HTTPException(400, "New password is required.")
    try:
        validate_strong_password(new_password)
    except ValueError as err:
        raise HTTPException(400, str(err))

    query = {}
    if token:
        query["token"] = token
    elif code and email:
        query["code"] = str(code).strip()
        query["email"] = email
    else:
        raise HTTPException(400, "Missing reset token or verification code.")

    reset_doc = await db.password_resets.find_one(query)
    if not reset_doc:
        raise HTTPException(400, "Invalid or expired reset code or token.")

    exp = reset_doc.get("expires_at")
    if isinstance(exp, str):
        exp_dt = datetime.fromisoformat(exp.replace("Z", "+00:00"))
    else:
        exp_dt = exp.replace(tzinfo=timezone.utc) if exp.tzinfo is None else exp

    if exp_dt < datetime.now(timezone.utc):
        raise HTTPException(400, "Password reset link or code has expired. Please request a new one.")

    user_id = reset_doc["user_id"]
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"password_hash": hash_password(new_password)}}
    )
    await db.password_resets.delete_many({"user_id": user_id})
    return {"ok": True, "message": "Password reset successfully. You can now log in."}

@api.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return user


# =========================================================
# Subscription helpers & admin activation
# =========================================================
@api.get("/subscriptions/me")
async def my_subscription(user: dict = Depends(get_current_user)):
    active = await _active_sub(user["id"])
    scheduled = await db.subscriptions.find_one({"user_id":user["id"],"status":"scheduled"}, sort=[("starts_at",1)])
    latest = await db.subscriptions.find_one({"user_id":user["id"]}, sort=[("created_at",-1)])
    return {
        "active": clean(active) if active else None,
        "scheduled": clean(scheduled) if scheduled else None,
        "latest": clean(latest) if latest else None,
    }


@api.post("/subscriptions/trial")
async def start_free_trial(body: TrialStartIn, user: dict = Depends(get_current_user)):
    # One free trial per account. Trial length depends on the selected plan.
    used = await db.subscriptions.find_one({"user_id": user["id"], "is_trial": True})
    if used:
        raise HTTPException(400, "Free trial has already been used on this account")
    active = await _active_sub(user["id"])
    if active:
        raise HTTPException(400, "You already have an active subscription")

    plan = PLANS[body.plan]
    now = datetime.now(timezone.utc)
    expires = now + timedelta(days=int(plan["trial_days"]))
    doc = {
        "user_id": user["id"],
        "user_email": user["email"],
        "plan": body.plan,
        "plan_name": plan["name"],
        "amount": 0,
        "status": "active",
        "payment_method": "free_trial",
        "is_trial": True,
        "trial_days": int(plan["trial_days"]),
        "trial_started_at": now.isoformat(),
        "activated_at": now.isoformat(),
        "starts_at": now.isoformat(),
        "expires_at": expires.isoformat(),
        "created_at": now.isoformat(),
    }
    res = await db.subscriptions.insert_one(doc)
    doc["id"] = str(res.inserted_id)
    doc.pop("_id", None)
    return {"ok": True, "status": "active", "trial": True, "trial_days": plan["trial_days"], "starts_at": doc["starts_at"], "expires_at": doc["expires_at"], "subscription": doc}

@api.post("/subscriptions/submit")
async def submit_subscription(body: SubscriptionSubmitIn, user: dict = Depends(get_current_user)):
    plan = PLANS[body.plan]
    now = now_iso()
    doc = {
        "user_id": user["id"], "user_email": user["email"], "plan": body.plan, "plan_name": plan["name"],
        "amount": plan["monthly"], "status": "pending", "payment_method": "upi_manual",
        "upi_ref": body.upi_ref, "payer_name": body.payer_name or "", "screenshot_data_url": body.screenshot_data_url or "",
        "created_at": now,
    }
    r = await db.subscriptions.insert_one(doc)
    doc["id"] = str(r.inserted_id); doc.pop("_id", None)
    return clean(doc)

@api.get("/admin/subscriptions")
async def admin_subscriptions(admin: dict = Depends(get_admin_user), status: Optional[str] = None):
    query = {} if not status or status == "all" else {"status": status}
    cur = db.subscriptions.find(query).sort("created_at", -1)
    return [clean(x) for x in await cur.to_list(500)]

@api.post("/admin/subscriptions/{sid}/approve")
async def admin_approve(sid: str, admin: dict = Depends(get_admin_user)):
    if not ObjectId.is_valid(sid):
        raise HTTPException(400, "bad id")
    sub = await db.subscriptions.find_one({"_id": ObjectId(sid)})
    if not sub:
        raise HTTPException(404, "not found")
    now = datetime.now(timezone.utc)
    expires = now + timedelta(days=30)
    await db.subscriptions.update_one({"_id": ObjectId(sid)}, {"$set": {"status": "active", "activated_at": now.isoformat(), "expires_at": expires.isoformat(), "reviewed_by": admin["email"]}})
    doc = await db.subscriptions.find_one({"_id": ObjectId(sid)})
    if sub.get("user_email"):
        html = (
            '<table role="presentation" width="100%"><tr><td style="padding:24px;font-family:Arial,sans-serif;color:#1F1A5D;background:#FBF8F1">'
            f'<h2 style="font-family:Georgia,serif">Your Dukaan subscription is active</h2>'
            f'<p>Your <b>{escape(sub.get("plan_name",""))}</b> plan is now active until <b>{escape(expires.isoformat()[:10])}</b>.</p>'
            f'<p><a href="{escape((FRONTEND_URL_ENV or "") + "/app")}" style="display:inline-block;background:#C36A4A;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">Open dashboard</a></p>'
            f'<p style="font-size:12px;color:#7B766D">Sent by {escape(EMAIL_FROM_NAME)}.</p>'
            '</td></tr></table>'
        )
        try:
            await send_email(to=sub["user_email"], subject="Your Dukaan subscription is active", html=html)
        except Exception:
            pass
    return clean(doc)

@api.post("/admin/subscriptions/{sid}/reject")
async def admin_reject(sid: str, admin: dict = Depends(get_admin_user), note: str = ""):
    if not ObjectId.is_valid(sid):
        raise HTTPException(400, "bad id")
    res = await db.subscriptions.update_one({"_id": ObjectId(sid)}, {"$set": {"status": "rejected", "reviewed_by": admin["email"], "review_note": note}})
    if res.matched_count == 0:
        raise HTTPException(404, "not found")
    return clean(await db.subscriptions.find_one({"_id": ObjectId(sid)}))

@api.get("/admin/stats")
async def admin_stats(admin: dict = Depends(get_admin_user)):
    return {
        "users": await db.users.count_documents({}),
        "shops": await db.shops.count_documents({}),
        "active_subscriptions": await db.subscriptions.count_documents({"status": "active"}),
        "pending_subscriptions": await db.subscriptions.count_documents({"status": "pending"}),
    }

class AdminGrantPayload(BaseModel):
    user_email: str
    plan: str = "business"
    days: int = 30
    note: Optional[str] = "Granted by admin"

@api.post("/admin/subscriptions/grant")
async def admin_grant_subscription(payload: AdminGrantPayload, admin: dict = Depends(get_admin_user)):
    email = payload.user_email.strip().lower()
    user = await db.users.find_one({"email": email})
    if not user:
        raise HTTPException(404, f"No user found with email {email}")

    plan_key = payload.plan.lower()
    if plan_key not in ["starter", "business", "cafe", "premium", "pro"]:
        raise HTTPException(400, "Invalid plan. Choose starter, business, cafe, premium, or pro.")

    days = max(1, min(payload.days, 3650))
    now = datetime.now(timezone.utc)
    expires = now + timedelta(days=days)

    sub_doc = {
        "user_id": str(user["_id"]),
        "user_email": email,
        "payer_name": user.get("name", "Shop Owner"),
        "plan": plan_key,
        "plan_name": f"{plan_key.title()} Plan",
        "amount": 0,
        "status": "active",
        "source": "admin_grant",
        "review_note": payload.note,
        "reviewed_by": admin["email"],
        "created_at": now.isoformat(),
        "activated_at": now.isoformat(),
        "expires_at": expires.isoformat(),
    }
    if plan_key == "cafe":
        sub_doc["pro_bonus"] = True
        sub_doc["pro_bonus_months"] = 2
        sub_doc["is_pro"] = True

    inserted = await db.subscriptions.insert_one(sub_doc)
    sub_doc["_id"] = inserted.inserted_id

    # Update user active subscription
    user_sub_data = {
        "plan": plan_key,
        "status": "active",
        "is_trial": False,
        "expires_at": expires.isoformat(),
        "activated_at": now.isoformat(),
        "granted_by": admin["email"]
    }
    if plan_key == "cafe":
        user_sub_data["pro_bonus"] = True
        user_sub_data["pro_bonus_months"] = 2
        user_sub_data["is_pro"] = True

    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"subscription": user_sub_data, "is_pro": (plan_key in ["pro", "cafe"])}}
    )
    return clean(sub_doc)

@api.post("/admin/subscriptions/{sid}/revoke")
async def admin_revoke_subscription(sid: str, admin: dict = Depends(get_admin_user), reason: str = "Refund issued"):
    if not ObjectId.is_valid(sid):
        raise HTTPException(400, "bad id")
    sub = await db.subscriptions.find_one({"_id": ObjectId(sid)})
    if not sub:
        raise HTTPException(404, "Subscription not found")

    now = datetime.now(timezone.utc)
    await db.subscriptions.update_one(
        {"_id": ObjectId(sid)},
        {"$set": {
            "status": "cancelled",
            "revoked_at": now.isoformat(),
            "revoke_reason": reason,
            "reviewed_by": admin["email"]
        }}
    )

    # Demote user
    if sub.get("user_id") and ObjectId.is_valid(sub["user_id"]):
        await db.users.update_one(
            {"_id": ObjectId(sub["user_id"])},
            {"$set": {
                "subscription": {
                    "plan": "starter",
                    "status": "cancelled",
                    "revoked_at": now.isoformat(),
                    "revoke_reason": reason
                }
            }}
        )
    elif sub.get("user_email"):
        await db.users.update_one(
            {"email": sub["user_email"]},
            {"$set": {
                "subscription": {
                    "plan": "starter",
                    "status": "cancelled",
                    "revoked_at": now.isoformat(),
                    "revoke_reason": reason
                }
            }}
        )

    return clean(await db.subscriptions.find_one({"_id": ObjectId(sid)}))

@api.get("/admin/users")
async def admin_list_users(admin: dict = Depends(get_admin_user)):
    cur = db.users.find({}).sort("created_at", -1)
    users = await cur.to_list(500)
    return [
        {
            "id": str(u["_id"]),
            "email": u.get("email"),
            "name": u.get("name"),
            "is_admin": u.get("is_admin", False),
            "subscription": u.get("subscription", {"plan": "starter", "status": "active"}),
            "created_at": u.get("created_at")
        }
        for u in users
    ]


# === DUKAAN_RAZORPAY_RENEWAL_V2 ===
async def _rzp_call(method, url, **kwargs):
    if not RAZORPAY_KEY_ID or not RAZORPAY_KEY_SECRET:
        raise HTTPException(503, "Razorpay is not configured yet")
    async with httpx.AsyncClient(timeout=20) as c:
        r = await c.request(method, url, auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET), **kwargs)
    try:
        payload = r.json()
    except Exception:
        payload = {"raw": r.text}
    if r.status_code >= 400:
        raise HTTPException(502, "Razorpay request failed")
    return payload


def _iso_dt(v):
    if not v:
        return None
    try:
        d = datetime.fromisoformat(str(v).replace('Z','+00:00'))
        return d if d.tzinfo else d.replace(tzinfo=timezone.utc)
    except Exception:
        return None


@api.post("/subscriptions/razorpay/order")
async def razorpay_order(body: RazorpayOrderIn, request: Request, user: dict = Depends(get_current_user)):\n    await _rate_limit(_client_key(request, "razorpay-order"), 10, 60)
    active = await _active_sub(user['id'])
    now = datetime.now(timezone.utc)
    if body.renew and active:
        existing = await db.subscriptions.find_one({"user_id":user['id'],"status":"scheduled","starts_at":{"$gt":now.isoformat()}})
        if existing:
            raise HTTPException(400,"A renewal is already scheduled")
        starts = (_iso_dt(active.get('expires_at')) or now) + timedelta(seconds=1)
    else:
        starts = now
    plan = PLANS[body.plan]
    order = await _rzp_call('POST','https://api.razorpay.com/v1/orders',json={"amount":int(plan['monthly']*100),"currency":"INR","receipt":f"dukaan-{user['id'][-8:]}-{int(now.timestamp())}"[:40]})
    await db.subscriptions.insert_one({"user_id":user['id'],"user_email":user['email'],"plan":body.plan,"plan_name":plan['name'],"amount":plan['monthly'],"status":"pending","payment_method":"razorpay","renewal":bool(body.renew and active),"razorpay_order_id":order['id'],"razorpay_payment_id":None,"activated_at":None,"starts_at":starts.isoformat(),"expires_at":(starts+timedelta(days=30)).isoformat(),"created_at":now_iso()})
    return {"key_id":RAZORPAY_KEY_ID,"order_id":order['id'],"amount":order['amount'],"currency":"INR","plan":body.plan,"renew":bool(body.renew and active)}


async def _activate_verified_rzp_subscription(sub: dict, payment_id: str) -> dict:
    """Idempotently activate/schedule a verified Razorpay subscription record."""
    current = await db.subscriptions.find_one({"_id": sub["_id"]})
    if not current:
        raise HTTPException(404, "Payment order not found")
    if current.get("status") in ("active", "scheduled") and current.get("razorpay_payment_id") == payment_id:
        return clean(current)

    # A Razorpay payment may finalize exactly one subscription record.
    # Refuse replay/cross-order reuse of a payment id before changing state.
    reused = await db.subscriptions.find_one({
        "razorpay_payment_id": payment_id,
        "_id": {"$ne": current["_id"]},
    })
    if reused:
        raise HTTPException(409, "Payment has already been processed")

    now = datetime.now(timezone.utc)
    starts = _iso_dt(current.get("starts_at")) or now
    scheduled = starts > now + timedelta(seconds=1)

    if not scheduled:
        await db.subscriptions.update_many(
            {"user_id": current["user_id"], "status": "active"},
            {"$set": {"status": "superseded", "superseded_at": now.isoformat(), "superseded_by_payment": payment_id}},
        )
        starts = now

    expires = starts + timedelta(days=30)
    status = "scheduled" if scheduled else "active"
    activated_at = None if scheduled else now.isoformat()

    await db.subscriptions.update_one(
        {"_id": current["_id"], "status": "pending"},
        {"$set": {
            "status": status,
            "activated_at": activated_at,
            "starts_at": starts.isoformat(),
            "expires_at": expires.isoformat(),
            "razorpay_payment_id": payment_id,
            "verified_at": now.isoformat(),
        }},
    )
    return clean(await db.subscriptions.find_one({"_id": current["_id"]}))


async def _finalize_razorpay_payment(order_id: str, payment_id: str, signature: Optional[str] = None, require_signature: bool = True):
    sub = await db.subscriptions.find_one({"razorpay_order_id": order_id, "status": {"$in": ["pending", "active", "scheduled"]}, "payment_method": "razorpay"})
    if not sub:
        return None

    if require_signature:
        expected = hmac.new(RAZORPAY_KEY_SECRET.encode(), f"{order_id}|{payment_id}".encode(), hashlib.sha256).hexdigest()
        if not signature or not hmac.compare_digest(expected, signature):
            raise HTTPException(400,"Payment signature verification failed")

    payment = await _rzp_call('GET',f"https://api.razorpay.com/v1/payments/{payment_id}")
    if payment.get('order_id') != order_id or int(payment.get('amount',0)) != int(float(sub['amount'])*100) or payment.get('currency') != 'INR':
        raise HTTPException(400,'Payment mismatch')
    # Subscription access is granted only after Razorpay confirms capture.
    # An authorized-but-not-captured payment must not activate paid access.
    if payment.get('status') != 'captured':
        raise HTTPException(400,f"Payment status is {payment.get('status','unknown')}")

    return await _activate_verified_rzp_subscription(sub, payment_id)


@api.post("/subscriptions/razorpay/verify")
async def razorpay_verify(body: RazorpayVerifyIn, request: Request, user: dict = Depends(get_current_user)):\n    await _rate_limit(_client_key(request, "razorpay-verify"), 10, 60)
    sub = await db.subscriptions.find_one({"user_id":user['id'],"razorpay_order_id":body.razorpay_order_id,"status":"pending","payment_method":"razorpay"})
    if not sub:
        existing = await db.subscriptions.find_one({"user_id":user['id'],"razorpay_order_id":body.razorpay_order_id,"razorpay_payment_id":body.razorpay_payment_id})
        if existing:
            return {"ok":True,"status":existing.get("status"),"starts_at":existing.get("starts_at"),"expires_at":existing.get("expires_at")}
        raise HTTPException(404,"Payment order not found or already processed")
    result = await _finalize_razorpay_payment(body.razorpay_order_id, body.razorpay_payment_id, body.razorpay_signature, require_signature=True)
    return {"ok":True,"status":result.get("status"),"starts_at":result.get("starts_at"),"expires_at":result.get("expires_at")}


@api.post("/internal/subscription-maintenance")
async def subscription_maintenance(request:Request):
    if not SUBSCRIPTION_CRON_SECRET or request.headers.get('X-Cron-Secret')!=SUBSCRIPTION_CRON_SECRET:
        raise HTTPException(403,'Forbidden')
    now=datetime.now(timezone.utc); activated=0; reminded=0
    queued=await db.subscriptions.find({"status":"scheduled","starts_at":{"$lte":now.isoformat()}}).to_list(200)
    for sub in queued:
        await db.subscriptions.update_many({"user_id":sub['user_id'],"status":"active"},{"$set":{"status":"expired","expired_at":now.isoformat()}})
        await db.subscriptions.update_one({"_id":sub['_id'],"status":"scheduled"},{"$set":{"status":"active","activated_at":now.isoformat()}})
        activated+=1
    cutoff=(now+timedelta(days=5)).isoformat()
    due=await db.subscriptions.find({"status":"active","expires_at":{"$gt":now.isoformat(),"$lte":cutoff},"renewal_reminder_5_sent":{"$ne":True}}).to_list(500)
    for sub in due:
        if sub.get('user_email'):
            link=f"{FRONTEND_URL_ENV or 'https://officialdukaan.in'}/subscribe?plan={sub.get('plan','business')}&renew=1"
            await send_email(to=sub['user_email'],subject='Dukaan: subscription expires in 5 days',html=f'<p>Your <b>{escape(sub.get("plan_name","Dukaan"))}</b> subscription expires in 5 days.</p><p><a href="{escape(link)}">Renew Subscription</a></p>')
        await db.subscriptions.update_one({"_id":sub['_id']},{"$set":{"renewal_reminder_5_sent":True,"renewal_reminder_sent_at":now.isoformat()}})
        reminded+=1
    return {"ok":True,"renewals_activated":activated,"reminders_sent":reminded}


@api.post("/webhooks/razorpay")
async def razorpay_webhook(request:Request):
    if not RAZORPAY_WEBHOOK_SECRET:
        raise HTTPException(503,'Webhook secret not configured')
    raw=await request.body(); sig=request.headers.get('X-Razorpay-Signature','')
    expected=hmac.new(RAZORPAY_WEBHOOK_SECRET.encode(),raw,hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected,sig):
        raise HTTPException(400,'Invalid webhook signature')

    try:
        payload = await request.json()
        event = payload.get("event", "")
        entity = (payload.get("payload", {}).get("payment", {}).get("entity") or {})
        payment_id = entity.get("id")
        order_id = entity.get("order_id")

        if event in {"payment.captured", "order.paid"} and payment_id and order_id:
            await _finalize_razorpay_payment(order_id, payment_id, signature=None, require_signature=False)
            logger.info("Razorpay webhook finalized payment order=%s payment=%s event=%s", order_id, payment_id, event)

    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Razorpay webhook processing failed: %s", exc)
        raise HTTPException(500, "Webhook processing failed")

    return {"ok":True}

# =========================================================
# SHOPS
# =========================================================
@api.get("/shops")
async def list_shops(user: dict = Depends(get_current_user)):
    cur = db.shops.find({"owner_id": user["id"]}).sort("created_at", 1)
    return [clean(s) for s in await cur.to_list(100)]

@api.post("/shops")
async def create_shop(body: ShopIn, user: dict = Depends(get_current_user)):
    doc = body.model_dump(); doc["owner_id"] = user["id"]; doc["created_at"] = now_iso()
    res = await db.shops.insert_one(doc); doc["id"] = str(res.inserted_id); doc.pop("_id", None)
    return doc

@api.put("/shops/{shop_id}")
async def update_shop(shop_id: str, body: ShopIn, user: dict = Depends(get_current_user)):
    if not ObjectId.is_valid(shop_id): raise HTTPException(400, "bad id")
    update_data = body.model_dump(exclude_unset=True)
    res = await db.shops.update_one({"_id": ObjectId(shop_id), "owner_id": user["id"]}, {"$set": update_data})
    if res.matched_count == 0: raise HTTPException(404, "not found")
    return clean(await db.shops.find_one({"_id": ObjectId(shop_id)}))

@api.get("/upi/qr")
async def generate_upi_qr(amount: float, upi_id: Optional[str] = None, shop: dict = Depends(get_shop)):
    target_upi = upi_id or shop.get("upi_id")
    if not target_upi: raise HTTPException(400, "No UPI ID available")
    
    shop_name = shop.get("name", "Shop")
    url = f"upi://pay?pa={target_upi}&pn={shop_name}&am={amount:.2f}&cu=INR"
    
    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    
    return StreamingResponse(buf, media_type="image/png")

# =========================================================
# PREMIUM PROFILE + MANUAL GST VERIFICATION
# =========================================================
@api.get("/premium/profile")
async def premium_profile(shop: dict = Depends(get_shop_plan("premium"))):
    return {
        "owner_name": shop.get("owner_name", ""),
        "phone": shop.get("phone", ""),
        "contact_email": shop.get("contact_email", ""),
        "name": shop.get("name", ""),
        "store_category": shop.get("store_category", ""),
        "gst_number": shop.get("gst_number", ""),
        "gst_status": shop.get("gst_status", "not_submitted"),
        "gst_review_note": shop.get("gst_review_note", ""),
        "gst_verified_at": shop.get("gst_verified_at"),
        "gst_enabled": bool(shop.get("gst_enabled", False)),
        "gst_rate": float(shop.get("gst_rate", 0) or 0),
        "financial_year": shop.get("financial_year", "2026-27"),
        "store_active": bool(shop.get("store_active", True)),
    }

@api.put("/premium/profile")
async def update_premium_profile(body: PremiumProfileIn, shop: dict = Depends(get_shop_plan("premium"))):
    categories = {"Kirana Store", "Medical Store", "Stationery", "Others"}
    if body.store_category not in categories:
        raise HTTPException(400, "Invalid store category")
    await db.shops.update_one(
        {"_id": ObjectId(shop["id"])},
        {"$set": {
            "owner_name": body.owner_name.strip(),
            "phone": body.phone.strip(),
            "contact_email": str(body.contact_email).lower(),
            "name": body.name.strip(),
            "store_category": body.store_category,
        }},
    )
    return {
        "owner_name": body.owner_name,
        "phone": body.phone,
        "contact_email": str(body.contact_email).lower(),
        "name": body.name,
        "store_category": body.store_category,
        "gst_number": shop.get("gst_number", ""),
        "gst_status": shop.get("gst_status", "not_submitted"),
        "gst_review_note": shop.get("gst_review_note", ""),
        "gst_verified_at": shop.get("gst_verified_at"),
        "gst_enabled": bool(shop.get("gst_enabled", False)),
        "gst_rate": float(shop.get("gst_rate", 0) or 0),
        "financial_year": shop.get("financial_year", "2026-27"),
        "store_active": bool(shop.get("store_active", True)),
    }

@api.post("/premium/gst")
async def submit_gst(body: GSTSubmitIn, shop: dict = Depends(get_shop_plan("premium"))):
    gst = re.sub(r"\s+", "", body.gst_number).upper()
    if not re.fullmatch(r"[0-9A-Z]{5,20}", gst):
        raise HTTPException(400, "Invalid GST number format")
    now = now_iso()
    await db.shops.update_one(
        {"_id": ObjectId(shop["id"])},
        {"$set": {
            "gst_number": gst,
            "gst_status": "pending",
            "gst_review_note": "",
            "gst_submitted_at": now,
            "gst_verified_at": None,
            "gst_verified_by": "",
        }},
    )
    existing = await db.gst_requests.find_one({"shop_id": shop["id"], "status": "pending"})
    payload = {
        "shop_id": shop["id"],
        "owner_id": shop["owner_id"],
        "shop_name": shop.get("name", ""),
        "owner_name": shop.get("owner_name", ""),
        "user_email": shop.get("contact_email", ""),
        "gst_number": gst,
        "status": "pending",
        "submitted_at": now,
        "review_note": "",
    }
    if existing:
        await db.gst_requests.update_one({"_id": existing["_id"]}, {"$set": payload})
    else:
        await db.gst_requests.insert_one(payload)
    return {"ok": True, "status": "pending", "gst_number": gst}

@api.get("/premium/gst")
async def get_gst(shop: dict = Depends(get_shop_plan("premium"))):
    return {
        "gst_number": shop.get("gst_number", ""),
        "status": shop.get("gst_status", "not_submitted"),
        "review_note": shop.get("gst_review_note", ""),
        "verified_at": shop.get("gst_verified_at"),
    }

@api.put("/premium/settings")
async def update_premium_settings(body: PremiumSettingsIn, shop: dict = Depends(get_shop_plan("premium"))):
    await db.shops.update_one({"_id": ObjectId(shop["id"])}, {"$set": body.model_dump()})
    return {"ok": True, **body.model_dump()}

@api.get("/admin/gst-requests")
async def admin_gst_requests(admin: dict = Depends(get_admin_user), status: Optional[str] = "pending"):
    query = {} if not status or status == "all" else {"status": status}
    rows = await db.gst_requests.find(query).sort("submitted_at", -1).to_list(500)
    return [clean(x) for x in rows]

@api.post("/admin/gst-requests/{gid}/approve")
async def admin_gst_approve(gid: str, body: GSTReviewIn, admin: dict = Depends(get_admin_user)):
    if not ObjectId.is_valid(gid):
        raise HTTPException(400, "bad id")
    req = await db.gst_requests.find_one({"_id": ObjectId(gid)})
    if not req:
        raise HTTPException(404, "GST request not found")
    now = now_iso()
    await db.gst_requests.update_one(
        {"_id": ObjectId(gid)},
        {"$set": {"status": "approved", "reviewed_at": now, "reviewed_by": admin.get("email", ""), "review_note": body.note or ""}},
    )
    if ObjectId.is_valid(req.get("shop_id", "")):
        await db.shops.update_one(
            {"_id": ObjectId(req["shop_id"])},
            {"$set": {"gst_number": req["gst_number"], "gst_status": "verified", "gst_verified_at": now, "gst_verified_by": admin.get("email", ""), "gst_review_note": body.note or ""}},
        )
    return clean(await db.gst_requests.find_one({"_id": ObjectId(gid)}))

@api.post("/admin/gst-requests/{gid}/decline")
async def admin_gst_decline(gid: str, body: GSTReviewIn, admin: dict = Depends(get_admin_user)):
    if not ObjectId.is_valid(gid):
        raise HTTPException(400, "bad id")
    req = await db.gst_requests.find_one({"_id": ObjectId(gid)})
    if not req:
        raise HTTPException(404, "GST request not found")
    now = now_iso()
    await db.gst_requests.update_one(
        {"_id": ObjectId(gid)},
        {"$set": {"status": "declined", "reviewed_at": now, "reviewed_by": admin.get("email", ""), "review_note": body.note or ""}},
    )
    if ObjectId.is_valid(req.get("shop_id", "")):
        await db.shops.update_one({"_id": ObjectId(req["shop_id"])}, {"$set": {"gst_status": "declined", "gst_review_note": body.note or ""}})
    return clean(await db.gst_requests.find_one({"_id": ObjectId(gid)}))


# =========================================================
# PRODUCTS
# =========================================================
@api.get("/products")
async def list_products(shop: dict = Depends(get_shop), q: Optional[str] = None, category: Optional[str] = None):
    query = {"shop_id": shop["id"]}
    if q: query["name"] = {"$regex": re.escape(q), "$options": "i"}
    if category and category != "all": query["category"] = category
    return [clean(x) for x in await db.products.find(query).sort("name", 1).to_list(1000)]

@api.post("/products")
async def create_product(body: ProductIn, shop: dict = Depends(get_shop)):
    doc = body.model_dump()
    doc["shop_id"] = shop["id"]
    doc["created_at"] = now_iso()
    r = await db.products.insert_one(doc)
    doc["id"] = str(r.inserted_id)
    doc.pop("_id", None)
    return doc

@api.put("/products/{pid}")
async def update_product(pid: str, body: ProductIn, shop: dict = Depends(get_shop)):
    if not ObjectId.is_valid(pid):
        raise HTTPException(400, "bad id")
    res = await db.products.update_one(
        {"_id": ObjectId(pid), "shop_id": shop["id"]},
        {"$set": body.model_dump()},
    )
    if res.matched_count == 0:
        raise HTTPException(404, "not found")
    return clean(await db.products.find_one({"_id": ObjectId(pid)}))

@api.delete("/products/{pid}")
async def delete_product(pid: str, shop: dict = Depends(get_shop)):
    if not ObjectId.is_valid(pid):
        raise HTTPException(400, "bad id")
    product = await db.products.find_one({"_id": ObjectId(pid), "shop_id": shop["id"]})
    if not product:
        raise HTTPException(404, "not found")
    await db.products.delete_one({"_id": product["_id"], "shop_id": shop["id"]})
    return {"ok": True, "id": pid}

@api.get("/products/velocity")
async def product_velocity(days: int = 30, shop: dict = Depends(get_shop)):
    days = max(1, min(int(days), 365))
    since = datetime.now(timezone.utc) - timedelta(days=days)
    since_iso = since.isoformat()

    pipeline = [
        {"$match": {"shop_id": shop["id"], "created_at": {"$gte": since_iso}}},
        {"$unwind": "$items"},
        {"$group": {"_id": "$items.product_id", "sold_count": {"$sum": "$items.qty"}}},
    ]
    sold_by_product = {}
    async for row in db.orders.aggregate(pipeline):
        sold_by_product[str(row["_id"])] = int(row.get("sold_count", 0) or 0)

    products = []
    async for product in db.products.find({"shop_id": shop["id"]}):
        pid = str(product["_id"])
        sold_count = sold_by_product.get(pid, 0)
        daily_burn = sold_count / days
        stock = int(product.get("stock", 0) or 0)
        unlimited = bool(product.get("unlimited_stock"))
        days_left = None if unlimited or daily_burn <= 0 else round(stock / daily_burn, 1)
        products.append({
            "product_id": pid,
            "sold_count": sold_count,
            "daily_burn": round(daily_burn, 3),
            "days_left": days_left,
        })
    return {"days": days, "since": since_iso, "products": products}


@api.post("/products/{pid}/stock")
async def adjust_stock(pid: str, body: StockAdjustIn, shop: dict = Depends(get_shop)):
    if not ObjectId.is_valid(pid):
        raise HTTPException(400, "bad id")
    if body.qty == 0:
        raise HTTPException(400, "Stock adjustment cannot be zero")
    prod = await db.products.find_one({"_id": ObjectId(pid), "shop_id": shop["id"]})
    if not prod:
        raise HTTPException(404, "not found")
    if prod.get("unlimited_stock"):
        return clean(prod)
    if body.qty < 0:
        result = await db.products.update_one(
            {"_id": prod["_id"], "shop_id": shop["id"], "stock": {"$gte": abs(body.qty)}},
            {"$inc": {"stock": body.qty}},
        )
    else:
        result = await db.products.update_one(
            {"_id": prod["_id"], "shop_id": shop["id"]},
            {"$inc": {"stock": body.qty}},
        )
    if result.matched_count == 0:
        raise HTTPException(409, "Stock cannot go below zero")
    await db.stock_movements.insert_one({
        "shop_id": shop["id"], "product_id": pid, "qty": body.qty,
        "reason": body.reason, "created_at": now_iso(),
    })
    return clean(await db.products.find_one({"_id": prod["_id"]}))

@api.post("/products/sync-all")
async def sync_products_all_branches(shop: dict = Depends(get_shop)):
    source = await db.products.find({"shop_id": shop["id"]}).to_list(1000)
    branches = await db.shops.find({
        "owner_id": shop.get("owner_id"), "_id": {"$ne": ObjectId(shop["id"])}
    }).to_list(100)
    synced = 0
    for branch in branches:
        target_id = str(branch["_id"])
        for product in source:
            match = {"barcode": product["barcode"]} if product.get("barcode") else {"name": product.get("name")}
            existing = await db.products.find_one({"shop_id": target_id, **match})
            payload = {k: v for k, v in product.items() if k not in {"_id", "shop_id", "created_at", "stock"}}
            payload["shop_id"] = target_id
            if existing:
                await db.products.update_one({"_id": existing["_id"]}, {"$set": payload})
            else:
                payload["stock"] = 0 if product.get("unlimited_stock") else int(product.get("stock", 0))
                payload["created_at"] = now_iso()
                await db.products.insert_one(payload)
            synced += 1
    return {"ok": True, "synced": synced}

# =========================================================
# CUSTOMERS
# =========================================================
@api.get("/customers")
async def list_customers(shop: dict = Depends(get_shop), q: Optional[str] = None):
    query = {"shop_id": shop["id"]}
    if q: query["$or"] = [{"name":{"$regex":re.escape(q),"$options":"i"}},{"phone":{"$regex":re.escape(q),"$options":"i"}}]
    return [clean(x) for x in await db.customers.find(query).sort("name",1).to_list(1000)]

@api.post("/customers")
async def create_customer(body: CustomerIn, shop: dict = Depends(get_shop)):
    doc = body.model_dump(); doc["shop_id"] = shop["id"]; doc["created_at"] = now_iso()
    r=await db.customers.insert_one(doc); doc["id"]=str(r.inserted_id); doc.pop("_id",None); return doc

@api.put("/customers/{cid}")
async def update_customer(cid: str, body: CustomerIn, shop: dict = Depends(get_shop)):
    if not ObjectId.is_valid(cid): raise HTTPException(400,"bad id")
    res=await db.customers.update_one({"_id":ObjectId(cid),"shop_id":shop["id"]},{"$set":body.model_dump()})
    if res.matched_count==0: raise HTTPException(404,"not found")
    return clean(await db.customers.find_one({"_id":ObjectId(cid)}))

@api.get("/customers/{cid}")
async def get_customer(cid: str, shop: dict = Depends(get_shop_paid)):
    if not ObjectId.is_valid(cid): raise HTTPException(400, "bad id")
    c = await db.customers.find_one({"_id": ObjectId(cid), "shop_id": shop["id"]})
    if not c: raise HTTPException(404, "not found")
    
    orders = await db.orders.find({"customer_id": cid, "shop_id": shop["id"]}).sort("created_at", -1).to_list(20)
    total_orders = await db.orders.count_documents({"customer_id": cid, "shop_id": shop["id"]})
    
    pipeline = [
        {"$match": {"customer_id": cid, "shop_id": shop["id"]}},
        {"$group": {
            "_id": None,
            "total_spent": {"$sum": "$total"},
            "total_paid": {"$sum": "$paid_amount"},
            "total_pending": {"$sum": "$pending_amount"}
        }}
    ]
    agg = await db.orders.aggregate(pipeline).to_list(1)
    
    c = clean(c)
    c["total_orders"] = total_orders
    if agg:
        c["total_spent"] = agg[0]["total_spent"]
        c["total_paid"] = agg[0]["total_paid"]
        c["total_pending"] = agg[0]["total_pending"]
    else:
        c["total_spent"] = 0
        c["total_paid"] = 0
        c["total_pending"] = 0
    c["recent_orders"] = [clean(o) for o in orders]
    return c

# =========================================================
# ORDERS / DASHBOARD / UDHAAR
# =========================================================
@api.post("/orders")
async def create_order(body: OrderIn, shop: dict = Depends(get_shop)):
    if not body.items:
        raise HTTPException(400, "No items")

    # Never trust client-supplied prices or stock. Resolve every product from the
    # current shop before creating the order.
    normalized_items = []
    product_rows = {}
    requested_qty = {}
    for item in body.items:
        if not item.product_id or not ObjectId.is_valid(item.product_id):
            raise HTTPException(400, f"Invalid product: {item.name}")
        qty = int(item.qty)
        if qty <= 0:
            raise HTTPException(400, f"Invalid quantity for {item.name}")
        pid = str(item.product_id)
        requested_qty[pid] = requested_qty.get(pid, 0) + qty

    valid_ids = [ObjectId(pid) for pid in requested_qty]
    async for prod in db.products.find({"_id": {"$in": valid_ids}, "shop_id": shop["id"]}):
        product_rows[str(prod["_id"])] = prod

    if len(product_rows) != len(requested_qty):
        raise HTTPException(400, "One or more products are missing or do not belong to this shop")

    for pid, qty in requested_qty.items():
        prod = product_rows[pid]
        if not prod.get("unlimited_stock") and int(prod.get("stock", 0)) < qty:
            raise HTTPException(409, f"Insufficient stock for {prod.get('name', 'product')}")

    for item in body.items:
        prod = product_rows[item.product_id]
        normalized_items.append({
            "product_id": item.product_id,
            "name": prod.get("name", item.name),
            "price": float(prod.get("selling_price", 0)),
            "qty": int(item.qty),
        })

    subtotal = sum(float(i["price"]) * int(i["qty"]) for i in normalized_items)
    discount = max(0.0, float(body.discount or 0))
    if discount > subtotal:
        discount = subtotal
    total = max(0.0, subtotal - discount)

    if body.payment_method == "cash":
        received = float(body.amount_received if body.amount_received is not None else total)
        if received < total:
            raise HTTPException(400, "Amount received is less than the bill total")
        paid = total
        pending = 0.0
    elif body.payment_method == "upi":
        received = total
        paid = total
        pending = 0.0
    else:
        if not body.customer_id or not ObjectId.is_valid(body.customer_id):
            raise HTTPException(400, "A valid customer is required for Udhaar")
        customer = await db.customers.find_one({"_id": ObjectId(body.customer_id), "shop_id": shop["id"]})
        if not customer:
            raise HTTPException(400, "Customer does not belong to this shop")
        received = max(0.0, min(float(body.amount_received or 0), total))
        paid = received
        pending = max(0.0, total - paid)

    order_no = f"OD-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}-{secrets.token_hex(2).upper()}"
    doc = {
        "shop_id": shop["id"],
        "order_no": order_no,
        "items": normalized_items,
        "subtotal": subtotal,
        "discount": discount,
        "total": total,
        "customer_id": body.customer_id,
        "payment_method": body.payment_method,
        "paid_amount": paid,
        "pending_amount": pending,
        "amount_received": received,
        "note": body.note or "",
        "created_at": now_iso(),
        "status": "udhaar" if pending > 0 else "paid",
    }

    # Checkout is a multi-document operation (order + stock + movement records).
    # Require a MongoDB transaction so a partial checkout can never become durable.
    try:
        async with await client.start_session() as session:
            async with session.start_transaction():
                r = await db.orders.insert_one(doc, session=session)
                order_id = str(r.inserted_id)

                for pid, qty in requested_qty.items():
                    prod = product_rows[pid]
                    if prod.get("unlimited_stock"):
                        continue
                    updated = await db.products.update_one(
                        {"_id": ObjectId(pid), "shop_id": shop["id"], "stock": {"$gte": qty}},
                        {"$inc": {"stock": -qty}},
                        session=session,
                    )
                    if updated.modified_count != 1:
                        raise HTTPException(409, f"Stock changed while processing {prod.get('name', 'product')}; please retry")
                    await db.stock_movements.insert_one({
                        "shop_id": shop["id"],
                        "product_id": pid,
                        "qty": -qty,
                        "reason": f"sale#{order_no}",
                        "created_at": doc["created_at"],
                    }, session=session)
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Checkout transaction failed: %s", exc)
        raise HTTPException(503, "Checkout could not be completed atomically. Please retry.")

    doc["id"] = order_id
    doc.pop("_id", None)
    return doc

@api.get("/orders/shift-summary")
async def shift_summary(started_at: str, shop: dict = Depends(get_shop)):
    try:
        start_dt = datetime.fromisoformat(started_at.replace("Z", "+00:00"))
    except ValueError:
        raise HTTPException(400, "Invalid shift start time")
    if start_dt.tzinfo is None:
        start_dt = start_dt.replace(tzinfo=timezone.utc)
    start_iso = start_dt.astimezone(timezone.utc).isoformat()

    pipeline = [
        {"$match": {"shop_id": shop["id"], "created_at": {"$gte": start_iso}}},
        {"$group": {
            "_id": None,
            "total_bills": {"$sum": 1},
            "total_sales": {"$sum": {"$ifNull": ["$total", 0]}},
            "cash_sales": {"$sum": {"$cond": [{"$eq": ["$payment_method", "cash"]}, {"$ifNull": ["$total", 0]}, 0]}},
            "upi_sales": {"$sum": {"$cond": [{"$in": ["$payment_method", ["upi", "qr"]]}, {"$ifNull": ["$total", 0]}, 0]}},
            "card_sales": {"$sum": {"$cond": [{"$eq": ["$payment_method", "card"]}, {"$ifNull": ["$total", 0]}, 0]}},
            "udhaar_sales": {"$sum": {"$cond": [{"$eq": ["$payment_method", "udhaar"]}, {"$ifNull": ["$total", 0]}, 0]}},
        }},
    ]
    row = await db.orders.aggregate(pipeline).to_list(length=1)
    summary = row[0] if row else {}
    summary.pop("_id", None)
    for key in ("total_bills", "cash_sales", "upi_sales", "card_sales", "udhaar_sales", "total_sales"):
        if key not in summary:
            summary[key] = 0
    summary["total_bills"] = int(summary["total_bills"] or 0)
    for key in ("cash_sales", "upi_sales", "card_sales", "udhaar_sales", "total_sales"):
        summary[key] = float(summary[key] or 0)
    return summary


@api.get("/orders")
async def list_orders(shop: dict = Depends(get_shop), status: Optional[str] = None, payment_method: Optional[str] = None, q: Optional[str] = None, limit: int = 200):
    query={"shop_id":shop["id"]}
    if status and status!="all": query["status"]=status
    if payment_method and payment_method!="all": query["payment_method"]=payment_method
    orders=[clean(o) for o in await db.orders.find(query).sort("created_at",-1).limit(limit).to_list(limit)]
    cust_ids=list({o.get("customer_id") for o in orders if o.get("customer_id")}); cust_map={}
    if cust_ids:
        valid=[ObjectId(c) for c in cust_ids if ObjectId.is_valid(c)]
        async for c in db.customers.find({"_id":{"$in":valid}}): cust_map[str(c["_id"])] = c.get("name","")
    for o in orders: o["customer_name"] = cust_map.get(o.get("customer_id") or "","")
    if q:
        ql=q.lower(); orders=[o for o in orders if ql in str(o.get("order_no","")).lower() or ql in (o.get("customer_name") or "").lower()]
    return orders

@api.get("/orders/{oid}")
async def get_order(oid: str, shop: dict = Depends(get_shop)):
    if not ObjectId.is_valid(oid): raise HTTPException(400,"bad id")
    o=await db.orders.find_one({"_id":ObjectId(oid),"shop_id":shop["id"]})
    if not o: raise HTTPException(404,"not found")
    o=clean(o)
    if o.get("customer_id") and ObjectId.is_valid(o["customer_id"]):
        c=await db.customers.find_one({"_id":ObjectId(o["customer_id"])})
        if c: o["customer_name"]=c.get("name",""); o["customer_phone"]=c.get("phone","")
    return o

@api.get("/orders/{oid}/invoice.pdf")
async def get_order_invoice(oid: str, shop: dict = Depends(get_shop)):
    if not ObjectId.is_valid(oid): raise HTTPException(400, "bad id")
    o = await db.orders.find_one({"_id": ObjectId(oid), "shop_id": shop["id"]})
    if not o: raise HTTPException(404, "not found")
    
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A5, rightMargin=10*mm, leftMargin=10*mm, topMargin=15*mm, bottomMargin=15*mm)
    elements = []
    styles = getSampleStyleSheet()
    
    elements.append(Paragraph(shop.get("name", "Shop Invoice"), styles['Title']))
    if shop.get("address"): elements.append(Paragraph(shop["address"], styles['Normal']))
    elements.append(Spacer(1, 5*mm))
    
    elements.append(Paragraph(f"Order No: {o.get('order_no', '')}", styles['Normal']))
    elements.append(Paragraph(f"Date: {o.get('created_at', '')[:10]}", styles['Normal']))
    if o.get("customer_id") and ObjectId.is_valid(o["customer_id"]):
        c = await db.customers.find_one({"_id": ObjectId(o["customer_id"])})
        if c: elements.append(Paragraph(f"Customer: {c.get('name', '')}", styles['Normal']))
    elements.append(Spacer(1, 5*mm))
    
    data = [["Item", "Qty", "Price", "Total"]]
    for item in o.get("items", []):
        data.append([item.get("name", ""), str(item.get("qty", 0)), f"{float(item.get('price', 0)):.2f}", f"{float(item.get('price',0))*int(item.get('qty',0)):.2f}"])
    
    t = Table(data, colWidths=[60*mm, 15*mm, 20*mm, 25*mm])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.grey),
        ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0,0), (-1,0), 12),
        ('BACKGROUND', (0,1), (-1,-1), colors.beige),
        ('GRID', (0,0), (-1,-1), 1, colors.black)
    ]))
    elements.append(t)
    elements.append(Spacer(1, 5*mm))
    
    elements.append(Paragraph(f"Subtotal: {float(o.get('subtotal', 0)):.2f}", styles['Normal']))
    elements.append(Paragraph(f"Discount: {float(o.get('discount', 0)):.2f}", styles['Normal']))
    elements.append(Paragraph(f"Total: {float(o.get('total', 0)):.2f}", styles['Normal']))
    elements.append(Paragraph(f"Payment Method: {o.get('payment_method', '')}", styles['Normal']))
    
    elements.append(Spacer(1, 10*mm))
    elements.append(Paragraph(shop.get("invoice_footer", "Thank you for shopping with us!"), styles['Italic']))
    
    doc.build(elements)
    buffer.seek(0)
    
    return StreamingResponse(buffer, media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename=invoice_{oid}.pdf"})

@api.get("/udhaar")
async def list_udhaar(shop: dict = Depends(get_shop_plan("business"))):
    pipeline=[{"$match":{"shop_id":shop["id"],"pending_amount":{"$gt":0}}},{"$group":{"_id":"$customer_id","pending":{"$sum":"$pending_amount"},"last_order_at":{"$max":"$created_at"},"count":{"$sum":1}}}]
    rows=await db.orders.aggregate(pipeline).to_list(1000); result=[]
    for r in rows:
        cid=r["_id"]
        if not cid: continue
        c = None
        if ObjectId.is_valid(cid):
            c = await db.customers.find_one({"_id": ObjectId(cid)})
        if not c:
            c = await db.customers.find_one({"id": str(cid)})
        cust_name = c.get("name", f"Customer #{str(cid)[-4:]}") if c else f"Customer #{str(cid)[-4:]}"
        cust_phone = c.get("phone", "") if c else ""
        result.append({
            "customer_id": str(cid),
            "customer_name": cust_name,
            "customer_phone": cust_phone,
            "pending": float(r["pending"]),
            "count": int(r["count"]),
            "last_order_at": r.get("last_order_at", "")
        })
    result.sort(key=lambda x:x["pending"],reverse=True); return result

@api.post("/udhaar/pay")
async def udhaar_pay(body: UdhaarPaymentIn, shop: dict = Depends(get_shop_plan("business"))):
    remaining = float(body.amount)
    if remaining <= 0: raise HTTPException(400, "invalid amount")
    cur = db.orders.find({"shop_id": shop["id"], "customer_id": str(body.customer_id), "pending_amount": {"$gt": 0}}).sort("created_at", 1)
    async for o in cur:
        if remaining <= 0: break
        pay = min(remaining, float(o["pending_amount"]))
        new_pending = float(o["pending_amount"]) - pay
        new_paid = float(o.get("paid_amount", 0)) + pay
        new_status = "paid" if new_pending == 0 else "udhaar"
        await db.orders.update_one({"_id": o["_id"]}, {"$set": {"pending_amount": new_pending, "paid_amount": new_paid, "status": new_status}})
        remaining -= pay
    await db.udhaar_payments.insert_one({"shop_id": shop["id"], "customer_id": str(body.customer_id), "amount": float(body.amount), "note": body.note or "", "created_at": now_iso()})
    return {"ok": True, "unallocated": remaining}


def _today_bounds():
    now=datetime.now(timezone.utc); start=now.replace(hour=0,minute=0,second=0,microsecond=0); return start.isoformat(), now.isoformat()

@api.get("/dashboard")
async def dashboard(shop: dict = Depends(get_shop)):
    start,end=_today_bounds(); match_today={"shop_id":shop["id"],"created_at":{"$gte":start,"$lte":end}}
    agg=await db.orders.aggregate([{"$match":match_today},{"$group":{"_id":"$payment_method","total":{"$sum":"$total"},"count":{"$sum":1}}}]).to_list(10)
    by_method={r["_id"]:{"total":r["total"],"count":r["count"]} for r in agg}; todays_total=sum(v["total"] for v in by_method.values()); todays_orders=sum(v["count"] for v in by_method.values())
    pending_agg=await db.orders.aggregate([{"$match":{"shop_id":shop["id"],"pending_amount":{"$gt":0}}},{"$group":{"_id":None,"pending":{"$sum":"$pending_amount"}}}]).to_list(1)
    total_pending=pending_agg[0]["pending"] if pending_agg else 0
    low_stock=await db.products.find({"shop_id":shop["id"],"unlimited_stock":{"$ne":True},"$expr":{"$lte":["$stock","$min_stock"]}}).limit(50).to_list(50)
    return {"today_sales":todays_total,"today_orders":todays_orders,"cash":by_method.get("cash",{}).get("total",0),"upi":by_method.get("upi",{}).get("total",0),"udhaar":by_method.get("udhaar",{}).get("total",0),"pending_udhaar":total_pending,"low_stock_count":len(low_stock),"low_stock":[clean(p) for p in low_stock]}


# =========================================================
# Reports (existing endpoints kept lightweight)
# =========================================================
@api.get("/reports/summary")
async def reports_summary(shop: dict = Depends(get_shop)):
    cur=db.orders.find({"shop_id":shop["id"]}); orders=await cur.to_list(5000)
    total_sales=sum(float(o.get("total",0)) for o in orders); total_orders=len(orders)
    cash=sum(float(o.get("total",0)) for o in orders if o.get("payment_method")=="cash")
    upi=sum(float(o.get("total",0)) for o in orders if o.get("payment_method")=="upi")
    udhaar=sum(float(o.get("total",0)) for o in orders if o.get("payment_method")=="udhaar")
    return {"total_sales":total_sales,"total_orders":total_orders,"cash":cash,"upi":upi,"udhaar":udhaar}



# =========================================================
# Premium WhatsApp udhaar reminders
# =========================================================
_whatsapp_reminder_task = None

@app.on_event("startup")
async def _start_whatsapp_reminder_loop():
    global _whatsapp_reminder_task
    if os.environ.get("AUTHKEY_API_KEY", "").strip():
        _whatsapp_reminder_task = asyncio.create_task(reminder_loop(db))

@app.on_event("shutdown")
async def _stop_whatsapp_reminder_loop():
    global _whatsapp_reminder_task
    if _whatsapp_reminder_task:
        _whatsapp_reminder_task.cancel()
        try:
            await _whatsapp_reminder_task
        except asyncio.CancelledError:
            pass
        _whatsapp_reminder_task = None

# =========================================================
# Root
# =========================================================
@app.get("/")
async def root():
    return {"ok":True,"service":"dukaan-api"}

app.include_router(api)
