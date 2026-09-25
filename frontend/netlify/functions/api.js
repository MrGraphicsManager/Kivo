const tls = require("tls");
const https = require("https");
const http = require("http");

function safeHttpGet(urlStr, timeoutMs = 4000) {
  return new Promise((resolve) => {
    try {
      const u = new URL(urlStr);
      const client = u.protocol === "http:" ? http : https;
      const req = client.get(urlStr, {
        headers: { "User-Agent": "OfficialDukaanBackend/1.0" }
      }, (res) => {
        let d = "";
        res.on("data", chunk => { d += chunk; });
        res.on("end", () => {
          resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, statusCode: res.statusCode, text: () => Promise.resolve(d) });
        });
      });
      req.on("error", () => resolve({ ok: false, statusCode: 500, text: () => Promise.resolve("") }));
      req.setTimeout(timeoutMs, () => {
        try { req.destroy(); } catch (_) {}
        resolve({ ok: false, statusCode: 504, text: () => Promise.resolve("") });
      });
    } catch (_) {
      resolve({ ok: false, statusCode: 500, text: () => Promise.resolve("") });
    }
  });
}

function safeHttpPost(urlStr, data, extraHeaders = {}, timeoutMs = 4000) {
  return new Promise((resolve) => {
    try {
      const u = new URL(urlStr);
      const client = u.protocol === "http:" ? http : https;
      const body = typeof data === "string" ? data : JSON.stringify(data);
      const req = client.request({
        hostname: u.hostname,
        port: u.port || (u.protocol === "http:" ? 80 : 443),
        path: u.pathname + u.search,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
          "User-Agent": "OfficialDukaanBackend/1.0",
          ...extraHeaders
        }
      }, (res) => {
        let d = "";
        res.on("data", chunk => { d += chunk; });
        res.on("end", () => {
          let parsed = null;
          try { parsed = JSON.parse(d); } catch (_) {}
          resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, statusCode: res.statusCode, raw: d, data: parsed });
        });
      });
      req.on("error", () => resolve({ ok: false, statusCode: 500 }));
      req.setTimeout(timeoutMs, () => {
        try { req.destroy(); } catch (_) {}
        resolve({ ok: false, statusCode: 504 });
      });
      req.write(body);
      req.end();
    } catch (_) {
      resolve({ ok: false, statusCode: 500 });
    }
  });
}

// Mail Configuration (GoDaddy / Titan Mail)
const SMTP_HOST = process.env.SMTP_HOST || "smtpout.secureserver.net";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "465", 10);
const SMTP_USER = process.env.SMTP_USER || "contact@officialdukaan.in";
const SMTP_PASSWORD = process.env.SMTP_PASSWORD || "";
const EMAIL_FROM = "Dukaan <contact@officialdukaan.in>";
const FRONTEND_URL = process.env.FRONTEND_URL || "https://officialdukaan.in";
const ADMIN_EMAIL = "contact@officialdukaan.in";
const FAST2SMS_API_KEY = process.env.FAST2SMS_API_KEY || "";

// Global Platform Configuration (Enterprise Suite Features)
let globalPlatformConfig = {
  maintenance_mode: false,
  landing_maintenance: {
    enabled: false,
    ends_at: null,
    message: "We are currently deploying scheduled platform upgrades with 0 downtime. Dukaan will resume in a few moments.",
    title: "Scheduled System Maintenance"
  },
  announcement: "",
  updated_at: new Date().toISOString(),
  pricing: {
    starter: { monthly: 79, yearly: 799 },
    business: { monthly: 119, yearly: 1199 },
    cafe: { monthly: 149, yearly: 1199 },
    premium: { monthly: 239, yearly: 2239 },
    pro: { monthly: 499, yearly: 4999 }
  },
  trial_days: 30,
  ota_version: 1,
  kill_switch_active: false,
  kill_switch_at: null,
  receipt_branding_enabled: true,
  payment_alert_chime: true,
  soundbox_devices: [],
  custom_domains: [],
  granted_subscriptions: {
    "support@officialdukaan.in": {
      plan: "premium",
      status: "active",
      expires_at: "2036-09-01T00:00:00.000Z",
      days: 3650,
      granted_by: "contact@officialdukaan.in",
      granted_at: new Date().toISOString(),
      note: "Lifetime Master Access"
    }
  },
  frozen_merchants: {},
  verified_merchants: {
    "support@officialdukaan.in": true
  },
  promo_codes: []
};

const SYNC_BUS_TOPIC = process.env.DUKAAN_SYNC_BUS_TOPIC || "dukaan_sync_bus_v2_99482";
const SYNC_BUS_URL = `https://ntfy.sh/${SYNC_BUS_TOPIC}`;
const SYNC_BUS_BACKUP_TOPIC = "dukaan_sync_bus_v3_99482";
const SYNC_BUS_BACKUP_URL = `https://ntfy.sh/${SYNC_BUS_BACKUP_TOPIC}`;
const CAREERS_SYNC_TOPIC = process.env.DUKAAN_CAREERS_SYNC_TOPIC || "dukaan_careers_sync_prod_88291";
const CAREERS_SYNC_URL = `https://ntfy.sh/${CAREERS_SYNC_TOPIC}`;


// ==========================================
// DUKAAN CLOUD STORE PERSISTENCE & MULTI-DEVICE SYNC
// ==========================================
const DEFAULT_PRODUCTS_LIST = [
  { id: 'prod_1', name: 'Aashirvaad Shudh Chakki Atta 5kg', category: 'Kirana & Grains', price: 245, selling_price: 245, purchase_price: 210, stock: 24, min_stock: 5, unlimited_stock: false, available: true },
  { id: 'prod_2', name: 'Fortune Sunlite Sunflower Oil 1L', category: 'Edible Oil & Ghee', price: 145, selling_price: 145, purchase_price: 128, stock: 18, min_stock: 6, unlimited_stock: false, available: true },
  { id: 'prod_3', name: 'Amul Taaza Toned Fresh Milk 500ml', category: 'Dairy & Eggs', price: 27, selling_price: 27, purchase_price: 24, stock: 35, min_stock: 10, unlimited_stock: false, available: true },
  { id: 'prod_4', name: 'Tata Salt Vacuum Evaporated 1kg', category: 'Kirana & Grains', price: 28, selling_price: 28, purchase_price: 22, stock: 40, min_stock: 8, unlimited_stock: false, available: true },
  { id: 'prod_5', name: 'Parle-G Gold Glucose Biscuit 250g', category: 'Biscuits & Snacks', price: 30, selling_price: 30, purchase_price: 25, stock: 50, min_stock: 10, unlimited_stock: false, available: true },
  { id: 'prod_6', name: 'Maggi 2-Minute Masala Noodles 70g', category: 'Biscuits & Snacks', price: 14, selling_price: 14, purchase_price: 11, stock: 60, min_stock: 15, unlimited_stock: false, available: true },
  { id: 'prod_7', name: 'MDH Deggi Mirch Powder 100g', category: 'Spices & Masala', price: 88, selling_price: 88, purchase_price: 72, stock: 15, min_stock: 4, unlimited_stock: false, available: true },
  { id: 'prod_8', name: 'Wagh Bakri Premium CTC Tea 500g', category: 'Beverages & Tea', price: 260, selling_price: 260, purchase_price: 225, stock: 12, min_stock: 5, unlimited_stock: false, available: true },
  { id: 'prod_9', name: 'Dettol Original Bathing Soap 75g', category: 'Household & Soaps', price: 40, selling_price: 40, purchase_price: 32, stock: 22, min_stock: 5, unlimited_stock: false, available: true },
  { id: 'prod_10', name: 'Fresh Cutting Chai (Hot)', category: 'Beverages & Tea', price: 10, selling_price: 10, purchase_price: 4, stock: 0, min_stock: 0, unlimited_stock: true, available: true },
  { id: 'prod_cafe_1', name: 'Classic Cappuccino', category: 'Hot Coffee', category_id: 'cat_hot_coffee', price: 140, selling_price: 140, purchase_price: 35, stock: 0, min_stock: 0, unlimited_stock: true, available: true, prep_time: 4, tax_rate: 5 },
  { id: 'prod_cafe_2', name: 'Signature Cold Brew', category: 'Cold Brews & Iced', category_id: 'cat_cold_brew', price: 180, selling_price: 180, purchase_price: 45, stock: 0, min_stock: 0, unlimited_stock: true, available: true, prep_time: 2, tax_rate: 5 },
  { id: 'prod_cafe_3', name: 'Butter Croissant', category: 'Bakery & Desserts', category_id: 'cat_pastries', price: 120, selling_price: 120, purchase_price: 40, stock: 15, min_stock: 3, unlimited_stock: false, available: true, prep_time: 3, tax_rate: 5 },
  { id: 'prod_cafe_4', name: 'Smoked Paneer Grilled Sandwich', category: 'Savory & Sandwiches', category_id: 'cat_savory', price: 160, selling_price: 160, purchase_price: 50, stock: 0, min_stock: 0, unlimited_stock: true, available: true, prep_time: 8, tax_rate: 5 },
  { id: 'prod_cafe_5', name: 'Dark Chocolate Brownie', category: 'Bakery & Desserts', category_id: 'cat_pastries', price: 99, selling_price: 99, purchase_price: 30, stock: 20, min_stock: 5, unlimited_stock: false, available: true, prep_time: 2, tax_rate: 5 }
];

const DEFAULT_CAFE_CONFIG = {
  id: "cafe_main",
  name: "Nexora Café",
  address: "Main High Street, Café Quarter",
  phone: "9876543210",
  gstin: "27AAAAA0000A1Z5",
  tax_rate: 5,
  upi_enabled: true,
  is_pro: true,
  ready_message: "Your order is ready! Please collect from the counter."
};

const DEFAULT_TABLES_LIST = [
  { id: "tbl_1", number: 1, capacity: 2, status: "available" },
  { id: "tbl_2", number: 2, capacity: 4, status: "available" },
  { id: "tbl_3", number: 3, capacity: 4, status: "available" },
  { id: "tbl_4", number: 4, capacity: 6, status: "available" },
  { id: "tbl_5", number: 5, capacity: 2, status: "available" },
  { id: "tbl_6", number: 6, capacity: 8, status: "available" }
];

const DEFAULT_CATEGORIES_LIST = [
  { id: "cat_hot_coffee", name: "Hot Coffee" },
  { id: "cat_cold_brew", name: "Cold Brews & Iced" },
  { id: "cat_pastries", name: "Bakery & Desserts" },
  { id: "cat_savory", name: "Savory & Sandwiches" }
];

const DEFAULT_INVENTORY_LIST = [
  { id: "inv_1", name: "Arabica Espresso Beans", category: "Beans", unit: "kg", current_stock: 14, min_stock: 4, cost: 850, supplier: "Bean Co." },
  { id: "inv_2", name: "Fresh Whole Milk", category: "Dairy", unit: "L", current_stock: 30, min_stock: 8, cost: 65, supplier: "Amul" },
  { id: "inv_3", name: "Oat Milk (Barista Blend)", category: "Dairy", unit: "L", current_stock: 10, min_stock: 3, cost: 220, supplier: "Oatly" },
  { id: "inv_4", name: "Vanilla Syrup", category: "Syrups", unit: "bottles", current_stock: 5, min_stock: 2, cost: 450, supplier: "Monin" },
  { id: "inv_5", name: "Brown Sugar Sachets", category: "Pantry", unit: "packets", current_stock: 120, min_stock: 30, cost: 2, supplier: "Pantry Direct" }
];

const DEFAULT_STAFF_LIST = [
  { id: "stf_1", name: "Head Barista", email: "barista@nexoraos.com", role: "manager" },
  { id: "stf_2", name: "Cashier Counter", email: "cashier@nexoraos.com", role: "cashier" }
];

const DEFAULT_CUSTOMERS_LIST = [
  { id: 'c_1', name: 'Ramesh Patel', phone: '9825100000', notes: 'Regular buyer, Block B-204', total_purchases: 450, total_paid: 450, total_pending: 0, created_at: new Date().toISOString() },
  { id: 'c_2', name: 'Suresh Sharma', phone: '9876543210', notes: 'Temple Road', total_purchases: 1450, total_paid: 0, total_pending: 1450, created_at: new Date().toISOString() }
];

const merchantStores = new Map();

function getShopKey(event, user) {
  const qShop = event.queryStringParameters?.shop_id || event.queryStringParameters?.shop;
  const hShop = event.headers?.['x-shop-id'] || event.headers?.['X-Shop-Id'];
  const raw = qShop || hShop || user?.shop_id || user?.email || 'default_store';
  return String(raw).toLowerCase().trim().replace(/[^a-z0-9_]/g, '_');
}

async function getShopStore(shopKey) {
  if (merchantStores.has(shopKey)) {
    return merchantStores.get(shopKey);
  }
  const cleanKey = shopKey.replace(/[^a-z0-9_]/g, '_').slice(0, 32);
  const storeTopic = 'dukaan_store_v2_' + cleanKey;
  let storeData = null;
  try {
    const res = await safeHttpGet('https://ntfy.sh/' + storeTopic + '/raw?poll=1&limit=5', 2500);
    if (res.ok) {
      const raw = await res.text();
      if (raw && raw.trim()) {
        const lines = raw.trim().split('\n').filter(Boolean);
        for (let i = lines.length - 1; i >= 0; i--) {
          try {
            const parsed = JSON.parse(lines[i]);
            if (parsed && (Array.isArray(parsed.products) || parsed.cafe || Array.isArray(parsed.tables))) {
              storeData = parsed;
              break;
            }
          } catch (_) {}
        }
      }
    }
  } catch (_) {}

  if (!storeData) {
    storeData = {
      products: JSON.parse(JSON.stringify(DEFAULT_PRODUCTS_LIST)),
      orders: [],
      customers: JSON.parse(JSON.stringify(DEFAULT_CUSTOMERS_LIST)),
      cafe: JSON.parse(JSON.stringify(DEFAULT_CAFE_CONFIG)),
      tables: JSON.parse(JSON.stringify(DEFAULT_TABLES_LIST)),
      categories: JSON.parse(JSON.stringify(DEFAULT_CATEGORIES_LIST)),
      inventory: JSON.parse(JSON.stringify(DEFAULT_INVENTORY_LIST)),
      staff: JSON.parse(JSON.stringify(DEFAULT_STAFF_LIST)),
      updated_at: new Date().toISOString()
    };
  }

  // Ensure cafe modules exist even on legacy stores
  if (!storeData.cafe) storeData.cafe = JSON.parse(JSON.stringify(DEFAULT_CAFE_CONFIG));
  if (!Array.isArray(storeData.tables) || storeData.tables.length === 0) storeData.tables = JSON.parse(JSON.stringify(DEFAULT_TABLES_LIST));
  if (!Array.isArray(storeData.categories) || storeData.categories.length === 0) storeData.categories = JSON.parse(JSON.stringify(DEFAULT_CATEGORIES_LIST));
  if (!Array.isArray(storeData.inventory) || storeData.inventory.length === 0) storeData.inventory = JSON.parse(JSON.stringify(DEFAULT_INVENTORY_LIST));
  if (!Array.isArray(storeData.staff) || storeData.staff.length === 0) storeData.staff = JSON.parse(JSON.stringify(DEFAULT_STAFF_LIST));

  merchantStores.set(shopKey, storeData);
  return storeData;
}

async function saveShopStore(shopKey, storeData) {
  merchantStores.set(shopKey, storeData);
  storeData.updated_at = new Date().toISOString();
  const cleanKey = shopKey.replace(/[^a-z0-9_]/g, '_').slice(0, 32);
  const storeTopic = 'dukaan_store_v2_' + cleanKey;
  safeHttpPost('https://ntfy.sh/' + storeTopic, {
    products: (storeData.products || []).slice(0, 200),
    orders: (storeData.orders || []).slice(0, 150),
    customers: (storeData.customers || []).slice(0, 100),
    tables: storeData.tables || [],
    categories: storeData.categories || [],
    inventory: storeData.inventory || [],
    staff: storeData.staff || [],
    cafe: storeData.cafe || null,
    updated_at: storeData.updated_at
  }, { 'Title': 'StoreSync-' + cleanKey }, 2500).catch(() => {});
}

// ==========================================
// NEXORAOS DEDICATED CAFE PERSISTENCE
// ==========================================
const cafeStores = new Map();

function isNexoraRequest(event, path = "") {
  const hContext = String(event.headers?.['x-app-context'] || event.headers?.['X-App-Context'] || '');
  const hPlatform = String(event.headers?.['x-platform'] || event.headers?.['X-Platform'] || '');
  if (hContext.toLowerCase() === 'nexoraos' || hPlatform.toLowerCase() === 'nexoraos') {
    return true;
  }
  if (path.startsWith('/tables') ||
      path.startsWith('/categories') ||
      path.startsWith('/inventory') ||
      path.startsWith('/staff') ||
      path.startsWith('/cafes') ||
      path.startsWith('/cafe') ||
      path.startsWith('/kitchen') ||
      path.startsWith('/subscription') ||
      path.startsWith('/public/')) {
    return true;
  }
  return false;
}

async function getCafeStore(shopKey) {
  if (cafeStores.has(shopKey)) {
    return cafeStores.get(shopKey);
  }
  const cleanKey = shopKey.replace(/[^a-z0-9_]/g, '_').slice(0, 32);
  const cafeTopic = 'nexora_cafe_v6_' + cleanKey;
  let cafeData = null;
  try {
    const res = await safeHttpGet('https://ntfy.sh/' + cafeTopic + '/raw?poll=1&limit=5', 2500);
    if (res.ok) {
      const raw = await res.text();
      if (raw && raw.trim()) {
        const lines = raw.trim().split('\n').filter(Boolean);
        for (let i = lines.length - 1; i >= 0; i--) {
          try {
            const parsed = JSON.parse(lines[i]);
            if (parsed && (Array.isArray(parsed.products) || parsed.cafe || Array.isArray(parsed.tables))) {
              cafeData = parsed;
              break;
            }
          } catch (_) {}
        }
      }
    }
  } catch (_) {}

  if (!cafeData) {
    cafeData = {
      products: [],
      orders: [],
      customers: [],
      cafe: {
        id: 'cafe_' + cleanKey,
        name: "My Café",
        address: "",
        phone: "",
        gstin: "",
        tax_rate: 5,
        upi_enabled: true,
        is_pro: true,
        ready_message: "Your order is ready! Please collect from the counter."
      },
      tables: [],
      categories: [],
      inventory: [],
      staff: [],
      updated_at: new Date().toISOString()
    };
  }

  if (!Array.isArray(cafeData.products)) cafeData.products = [];
  if (!Array.isArray(cafeData.orders)) cafeData.orders = [];
  if (!Array.isArray(cafeData.customers)) cafeData.customers = [];
  if (!Array.isArray(cafeData.tables)) cafeData.tables = [];
  if (!Array.isArray(cafeData.categories)) cafeData.categories = [];
  if (!Array.isArray(cafeData.inventory)) cafeData.inventory = [];
  if (!Array.isArray(cafeData.staff)) cafeData.staff = [];
  if (!cafeData.cafe) {
    cafeData.cafe = {
      id: 'cafe_' + cleanKey,
      name: "My Café",
      address: "",
      phone: "",
      gstin: "",
      tax_rate: 5,
      upi_enabled: true,
      is_pro: true,
      ready_message: "Your order is ready! Please collect from the counter."
    };
  }

  cafeStores.set(shopKey, cafeData);
  return cafeData;
}

async function saveCafeStore(shopKey, cafeData) {
  cafeStores.set(shopKey, cafeData);
  cafeData.updated_at = new Date().toISOString();
  const cleanKey = shopKey.replace(/[^a-z0-9_]/g, '_').slice(0, 32);
  const cafeTopic = 'nexora_cafe_v6_' + cleanKey;
  safeHttpPost('https://ntfy.sh/' + cafeTopic, {
    products: (cafeData.products || []).slice(0, 250),
    orders: (cafeData.orders || []).slice(0, 150),
    customers: (cafeData.customers || []).slice(0, 100),
    tables: cafeData.tables || [],
    categories: cafeData.categories || [],
    inventory: cafeData.inventory || [],
    staff: cafeData.staff || [],
    cafe: cafeData.cafe || null,
    updated_at: cafeData.updated_at
  }, { 'Title': 'NexoraCafe-' + cleanKey }, 2500).catch(() => {});
}

let registeredUsersList = [
  {
    id: "usr_admin_master",
    name: "Super Administrator",
    email: ADMIN_EMAIL,
    is_admin: true,
    is_verified: true,
    subscription: { plan: "premium", status: "active", expires_at: new Date(Date.now() + 365 * 10 * 86400000).toISOString() },
    created_at: new Date().toISOString()
  },
  {
    id: "usr_priyen_master",
    name: "Naik Priyen",
    email: "support@officialdukaan.in",
    is_admin: false,
    is_verified: true,
    subscription: {
      plan: "premium",
      status: "active",
      expires_at: "2036-09-01T00:00:00.000Z",
      days: 3650,
      granted_by: ADMIN_EMAIL,
      granted_at: new Date().toISOString(),
      note: "Lifetime Master Access"
    },
    created_at: new Date().toISOString()
  }
];

let lastCloudFetchTime = 0;
async function getPersistentState(force = false) {
  const now = Date.now();
  if (!force && (now - lastCloudFetchTime < 2000)) {
    return globalPlatformConfig;
  }
  try {
    let rawText = "";
    const res = await safeHttpGet(`${SYNC_BUS_URL}/raw?poll=1&limit=10`, 3500);
    if (res.ok) {
      rawText = await res.text();
    }
    if (!rawText || !rawText.trim()) {
      const backupRes = await safeHttpGet(`${SYNC_BUS_BACKUP_URL}/raw?poll=1&limit=10`, 3500);
      if (backupRes && backupRes.ok) {
        rawText = await backupRes.text();
      }
    }
    if (rawText && rawText.trim()) {
        const lines = rawText.trim().split('\n').filter(Boolean);
        let json = null;
        for (let i = lines.length - 1; i >= 0; i--) {
          try {
            const parsed = JSON.parse(lines[i]);
            if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
              json = parsed;
              break;
            }
          } catch (_) {}
        }

        if (json) {
          lastCloudFetchTime = now;
          if (typeof json.maintenance_mode === "boolean") {
            globalPlatformConfig.maintenance_mode = json.maintenance_mode;
          }
          if (typeof json.announcement === "string") {
            globalPlatformConfig.announcement = json.announcement;
          }
          if (json.landing_maintenance && typeof json.landing_maintenance === "object") {
            globalPlatformConfig.landing_maintenance = {
              ...globalPlatformConfig.landing_maintenance,
              ...json.landing_maintenance
            };
          }
          if (typeof json.ota_version === "number") {
            globalPlatformConfig.ota_version = json.ota_version;
          }
          if (typeof json.kill_switch_active === "boolean") {
            globalPlatformConfig.kill_switch_active = json.kill_switch_active;
          }
          if (json.granted_subscriptions) {
            globalPlatformConfig.granted_subscriptions = {
              ...globalPlatformConfig.granted_subscriptions,
              ...json.granted_subscriptions
            };
          }
          if (json.queued_subscriptions) {
            globalPlatformConfig.queued_subscriptions = {
              ...globalPlatformConfig.queued_subscriptions,
              ...json.queued_subscriptions
            };
          }
          if (json.frozen_merchants) {
            globalPlatformConfig.frozen_merchants = {
              ...globalPlatformConfig.frozen_merchants,
              ...json.frozen_merchants
            };
          }
          if (json.verified_merchants) {
            globalPlatformConfig.verified_merchants = {
              ...globalPlatformConfig.verified_merchants,
              ...json.verified_merchants
            };
          }
          if (json.pricing) {
            const isLegacy = json.pricing.starter?.monthly === 499 || 
                             json.pricing.business?.monthly === 999 || 
                             json.pricing.premium?.monthly === 1999 ||
                             json.pricing.starter?.yearly === 4990 ||
                             json.pricing.business?.yearly === 9990 ||
                             json.pricing.premium?.yearly === 19990;
            if (!isLegacy) {
              globalPlatformConfig.pricing = { ...globalPlatformConfig.pricing, ...json.pricing };
            } else {
              globalPlatformConfig.pricing = {
                starter: { monthly: 79, yearly: 799 },
                business: { monthly: 119, yearly: 1199 },
                premium: { monthly: 239, yearly: 2239 },
                pro: { monthly: 499, yearly: 4999 }
              };
            }
          }
          if (typeof json.trial_days === "number") {
            globalPlatformConfig.trial_days = json.trial_days;
          }
        }

        // Scan backwards through messages for the latest valid promo_codes array
        for (let i = lines.length - 1; i >= 0; i--) {
          try {
            const j = JSON.parse(lines[i]);
            if (Array.isArray(j.promo_codes)) {
              promoCodes = j.promo_codes;
              globalPlatformConfig.promo_codes = j.promo_codes;
              break;
            }
          } catch (_) {}
        }

        // Scan backwards through messages for latest job_applications
        for (let i = lines.length - 1; i >= 0; i--) {
          try {
            const j = JSON.parse(lines[i]);
            if (Array.isArray(j.job_applications) && j.job_applications.length > 0) {
              for (const rApp of j.job_applications) {
                const exIdx = jobApplications.findIndex(x => x.id === rApp.id || (x.email && (x.email || "").toLowerCase().trim() === (rApp.email || "").toLowerCase().trim()));
                if (exIdx === -1) {
                  jobApplications.push(rApp);
                } else {
                  jobApplications[exIdx] = { ...jobApplications[exIdx], ...rApp };
                }
              }
              break;
            }
          } catch (_) {}
        }
        jobApplications = deduplicateJobApplications(jobApplications);
          if (Array.isArray(json.registered_users)) {
            for (const u of json.registered_users) {
              if (!u || !u.email) continue;
              const em = u.email.toLowerCase();
              const idx = registeredUsersList.findIndex(x => x.email.toLowerCase() === em);
              if (idx >= 0) {
                registeredUsersList[idx] = { ...registeredUsersList[idx], ...u };
              } else {
                registeredUsersList.push(u);
              }
            }
          }
          if (Array.isArray(json.soundbox_devices)) {
            globalPlatformConfig.soundbox_devices = json.soundbox_devices;
          }
          if (Array.isArray(json.custom_domains)) {
            globalPlatformConfig.custom_domains = json.custom_domains;
          }
          if (Array.isArray(json.support_tickets)) {
            supportTickets = json.support_tickets;
          }
          if (Array.isArray(json.merchant_feedback)) {
            merchantFeedbacks = json.merchant_feedback;
          }
          if (Array.isArray(json.gst_requests)) {
            gstRequests = json.gst_requests;
          }
          if (Array.isArray(json.referral_codes)) {
            referralCodes = json.referral_codes;
          }

          // One-time merchant logout and verification reset (Sep 2026 strict rule)
          const ONE_TIME_RESET_KEY = "merchant_force_reauth_reset_2026_09_09_v1";
          if (!globalPlatformConfig[ONE_TIME_RESET_KEY]) {
            globalPlatformConfig[ONE_TIME_RESET_KEY] = {
              applied_at: new Date().toISOString(),
              force_reauth_before: Date.now()
            };
            if (Array.isArray(registeredUsersList)) {
              registeredUsersList.forEach(u => {
                if (u && u.email && u.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
                  u.is_verified = false;
                  u.email_verified = false;
                  u.phone_verified = false;
                }
              });
            }
            savePersistentState().catch(() => {});
          }
        }
      } catch (e) {
        console.warn("Persistent cloud state fetch error:", e.message);
      }
  return globalPlatformConfig;
}

async function savePersistentState(extraConfig = {}) {
  globalPlatformConfig = {
    ...globalPlatformConfig,
    ...extraConfig,
    updated_at: new Date().toISOString()
  };
  try {
    const payload = {
      maintenance_mode: globalPlatformConfig.maintenance_mode,
      landing_maintenance: globalPlatformConfig.landing_maintenance,
      announcement: globalPlatformConfig.announcement,
      ota_version: globalPlatformConfig.ota_version,
      kill_switch_active: globalPlatformConfig.kill_switch_active,
      granted_subscriptions: globalPlatformConfig.granted_subscriptions || {},
      queued_subscriptions: globalPlatformConfig.queued_subscriptions || {},
      frozen_merchants: globalPlatformConfig.frozen_merchants || {},
      verified_merchants: globalPlatformConfig.verified_merchants || {},
      pricing: globalPlatformConfig.pricing,
      trial_days: globalPlatformConfig.trial_days,
      promo_codes: promoCodes,
      registered_users: registeredUsersList.slice(0, 30),
      soundbox_devices: (globalPlatformConfig.soundbox_devices || []).slice(0, 25),
      custom_domains: (globalPlatformConfig.custom_domains || []).slice(0, 25),
      support_tickets: (supportTickets || []).slice(0, 40),
      merchant_feedback: (merchantFeedbacks || []).slice(0, 40),
      gst_requests: (gstRequests || []).slice(0, 30),
      referral_codes: (referralCodes || []).slice(0, 30),
      job_applications: (jobApplications || []).slice(0, 50).map(a => ({
        ...a,
        aadhar_doc: (a.aadhar_doc && a.aadhar_doc.length > 300) ? a.aadhar_doc.slice(0, 300) : a.aadhar_doc,
        marksheet_doc: (a.marksheet_doc && a.marksheet_doc.length > 300) ? a.marksheet_doc.slice(0, 300) : a.marksheet_doc,
        resume_doc: (a.resume_doc && a.resume_doc.length > 300) ? a.resume_doc.slice(0, 300) : a.resume_doc
      })),
      updated_at: globalPlatformConfig.updated_at
    };
    const primaryRes = await safeHttpPost(SYNC_BUS_URL, payload, { "Title": "Dukaan Platform Sync", "Priority": "high" }, 3500);
    if (!primaryRes.ok) {
      await safeHttpPost(SYNC_BUS_BACKUP_URL, payload, { "Title": "Dukaan Platform Sync Backup", "Priority": "high" }, 3500);
    }
  } catch (e) {
    console.warn("Persistent cloud state save error:", e.message);
  }
}

function recordRegisteredUser(userObj) {
  if (!userObj || !userObj.email) return;
  const email = userObj.email.toLowerCase().trim();
  const existing = registeredUsersList.find(u => u.email.toLowerCase() === email);
  if (existing) {
    if (userObj.name) existing.name = userObj.name;
    if (userObj.phone) existing.phone = userObj.phone;
    if (userObj.phone_verified !== undefined) existing.phone_verified = userObj.phone_verified;
    if (userObj.email_verified !== undefined) existing.email_verified = userObj.email_verified;
    if (userObj.subscription) {
      const exExp = existing.subscription?.expires_at ? new Date(existing.subscription.expires_at).getTime() : 0;
      const newExp = userObj.subscription?.expires_at ? new Date(userObj.subscription.expires_at).getTime() : 0;
      if (newExp >= exExp || !existing.subscription) {
        existing.subscription = userObj.subscription;
      }
    }
    if (userObj.upcoming_subscription !== undefined) existing.upcoming_subscription = userObj.upcoming_subscription;
    if (userObj.is_verified !== undefined) existing.is_verified = userObj.is_verified;
    if (userObj.is_frozen !== undefined) existing.is_frozen = userObj.is_frozen;
    if (userObj.provider) existing.provider = userObj.provider;
    if (userObj.avatar) existing.avatar = userObj.avatar;
  } else {
    registeredUsersList.push({
      id: userObj.id || `usr_${Date.now()}`,
      name: userObj.name || email.split("@")[0],
      email: email,
      phone: userObj.phone || "",
      phone_verified: Boolean(userObj.phone_verified),
      email_verified: Boolean(userObj.email_verified),
      is_admin: email === ADMIN_EMAIL,
      is_verified: userObj.is_verified !== undefined ? userObj.is_verified : false,
      is_frozen: userObj.is_frozen || false,
      subscription: userObj.subscription || { plan: "starter", status: "active" },
      upcoming_subscription: userObj.upcoming_subscription || null,
      created_at: new Date().toISOString()
    });
  }

  if (userObj.subscription?.expires_at) {
    if (!globalPlatformConfig.granted_subscriptions) globalPlatformConfig.granted_subscriptions = {};
    const curG = globalPlatformConfig.granted_subscriptions[email];
    const curGExp = curG?.expires_at ? new Date(curG.expires_at).getTime() : 0;
    const newExp = new Date(userObj.subscription.expires_at).getTime();
    if (newExp >= curGExp) {
      globalPlatformConfig.granted_subscriptions[email] = userObj.subscription;
    }
  }
}

function deduplicateJobApplications(apps) {
  if (!Array.isArray(apps)) return [];
  const map = new Map();
  for (const a of apps) {
    if (!a) continue;
    const cleanEmail = (a.email || "").trim().toLowerCase();
    const cleanPhone = (a.phone || "").trim().replace(/\D/g, "").slice(-10);
    const key = cleanEmail || cleanPhone || a.id;
    if (!key) continue;

    if (!map.has(key)) {
      map.set(key, { ...a });
    } else {
      const existing = map.get(key);
      const isExistingReviewed = existing.status === "approved" || existing.status === "denied";
      const isNewReviewed = a.status === "approved" || a.status === "denied";

      const finalStatus = isExistingReviewed
        ? existing.status
        : (isNewReviewed ? a.status : (existing.status || a.status || "under_review"));

      const finalReviewedAt = isExistingReviewed
        ? (existing.reviewed_at || a.reviewed_at)
        : (a.reviewed_at || existing.reviewed_at);

      const finalNote = existing.admin_note || a.admin_note || "";

      // Prioritize the ID and Aadhar from the reviewed / approved record
      const finalId = isExistingReviewed ? existing.id : (a.id || existing.id);
      const finalAadhar = (isExistingReviewed && existing.aadhar_number)
        ? existing.aadhar_number
        : ((a.aadhar_number && a.aadhar_number.length >= 12) ? a.aadhar_number : (existing.aadhar_number || a.aadhar_number));

      map.set(key, {
        ...existing,
        ...a,
        id: finalId,
        status: finalStatus,
        reviewed_at: finalReviewedAt,
        admin_note: finalNote,
        aadhar_number: finalAadhar,
        aadhar_doc: (a.aadhar_doc && a.aadhar_doc.length > 50) ? a.aadhar_doc : (existing.aadhar_doc || a.aadhar_doc),
        marksheet_doc: (a.marksheet_doc && a.marksheet_doc.length > 50) ? a.marksheet_doc : (existing.marksheet_doc || a.marksheet_doc),
        resume_doc: (a.resume_doc && a.resume_doc.length > 50) ? a.resume_doc : (existing.resume_doc || a.resume_doc),
        name: a.name || existing.name,
        education: a.education || existing.education,
        role: a.role || existing.role,
        city: a.city || existing.city
      });
    }
  }
  return Array.from(map.values());
}

let jobApplications = [];
let lastCareersCloudFetchTime = 0;

async function getCareersPersistentState(force = false) {
  const now = Date.now();
  if (!force && jobApplications.length > 0 && (now - lastCareersCloudFetchTime < 3000)) {
    return jobApplications;
  }
  try {
    const res = await safeHttpGet(`${CAREERS_SYNC_URL}/raw?poll=1&limit=5`, 3500);
    if (res.ok) {
      const rawText = await res.text();
      if (rawText && rawText.trim()) {
        let loaded = null;
        try {
          const direct = JSON.parse(rawText.trim());
          if (Array.isArray(direct) && direct.length > 0) loaded = direct;
        } catch (_) {}
        if (!loaded) {
          const lines = rawText.trim().split('\n').filter(Boolean);
          for (let i = lines.length - 1; i >= 0; i--) {
            try {
              const parsed = JSON.parse(lines[i]);
              if (Array.isArray(parsed) && parsed.length > 0) {
                loaded = parsed;
                break;
              }
            } catch (_) {}
          }
        }
        if (Array.isArray(loaded) && loaded.length > 0) {
          lastCareersCloudFetchTime = now;
          jobApplications = deduplicateJobApplications([...jobApplications, ...loaded]);
        }
      }
    }
  } catch (e) {
    console.warn("Careers cloud state fetch error:", e.message);
  }
  return jobApplications;
}

async function saveCareersPersistentState() {
  try {
    const cleanList = deduplicateJobApplications(jobApplications).slice(0, 25).map(a => ({
      id: a.id,
      name: a.name,
      email: a.email,
      phone: a.phone,
      whatsapp: a.whatsapp || a.phone,
      role: a.role,
      city: a.city,
      address: a.address || "",
      education: a.education,
      aadhar_number: a.aadhar_number,
      why_hire: a.why_hire || "",
      status: a.status || "under_review",
      admin_note: a.admin_note || "",
      created_at: a.created_at || new Date().toISOString(),
      reviewed_at: a.reviewed_at || null
    }));

    await safeHttpPost(CAREERS_SYNC_URL, cleanList, { "Title": "Careers Sync", "Priority": "high" }, 3500);
  } catch (e) {
    console.warn("Careers cloud state save error:", e.message);
  }
}

let promoCodes = [
  {
    code: "WELCOME50",
    discount_type: "percent",
    discount_percent: 50,
    max_discount: 1000,
    min_amount: 0,
    usage_count: 0,
    max_uses: 500,
    active: true,
    expires_at: "2027-12-31",
    created_at: new Date().toISOString()
  },
  {
    code: "SUPER20",
    discount_type: "percent",
    discount_percent: 20,
    max_discount: 500,
    min_amount: 0,
    usage_count: 0,
    max_uses: 1000,
    active: true,
    expires_at: "2027-12-31",
    created_at: new Date().toISOString()
  },
  {
    code: "FLAT100",
    discount_type: "flat",
    discount_flat: 100,
    discount_percent: 0,
    max_discount: 100,
    min_amount: 149,
    usage_count: 0,
    max_uses: 250,
    active: true,
    expires_at: "2027-12-31",
    created_at: new Date().toISOString()
  }
];
let supportTickets = [];
let merchantFeedbacks = [];
let referralCodes = [];
let gstRequests = [];

// Core SMTPS socket sender with RFC 822 Base64 Transfer Encoding (100% GoDaddy / Secureserver compliant)
function sendMailSocket({ host, port, user, pass, to, subject, html }) {
  return new Promise((resolve, reject) => {
    const socket = tls.connect({ host, port, minVersion: "TLSv1.2" }, () => {});

    let step = 0;
    socket.on("data", (data) => {
      const msg = data.toString();
      if (step === 0 && msg.startsWith("220")) {
        step = 1;
        socket.write("EHLO officialdukaan.in\r\n");
      } else if (step === 1 && msg.includes("250")) {
        step = 2;
        socket.write("AUTH LOGIN\r\n");
      } else if (step === 2 && msg.startsWith("334")) {
        step = 3;
        socket.write(Buffer.from(user).toString("base64") + "\r\n");
      } else if (step === 3 && msg.startsWith("334")) {
        step = 4;
        socket.write(Buffer.from(pass).toString("base64") + "\r\n");
      } else if (step === 4 && msg.startsWith("235")) {
        step = 5;
        socket.write(`MAIL FROM:<${user}>\r\n`);
      } else if (step === 5 && msg.startsWith("250")) {
        step = 6;
        socket.write(`RCPT TO:<${to}>\r\n`);
      } else if (step === 6 && msg.startsWith("250")) {
        step = 7;
        socket.write("DATA\r\n");
      } else if (step === 7 && msg.startsWith("354")) {
        step = 8;
        // Strict RFC 822 Base64 chunking to prevent "552 Message contains bare LF" errors
        const b64Body = Buffer.from(html, "utf-8").toString("base64");
        const chunks = b64Body.match(/.{1,76}/g) || [];
        const formattedBody = chunks.join("\r\n");

        const mail = [
          `From: ${EMAIL_FROM}`,
          `To: <${to}>`,
          `Subject: ${subject}`,
          "MIME-Version: 1.0",
          "Content-Type: text/html; charset=utf-8",
          "Content-Transfer-Encoding: base64",
          "",
          formattedBody,
          ".\r\n"
        ].join("\r\n");
        socket.write(mail);
      } else if (step === 8 && msg.startsWith("250")) {
        step = 9;
        socket.write("QUIT\r\n");
        resolve(true);
      } else if (msg.startsWith("5")) {
        reject(new Error(`SMTP error from ${host}: ${msg.trim()}`));
      }
    });

    socket.on("error", (err) => reject(err));
    socket.setTimeout(12000, () => {
      socket.destroy();
      reject(new Error(`SMTP timeout connecting to ${host}:${port}`));
    });
  });
}

async function sendMailWithFallback({ to, subject, html }) {
  const hosts = [SMTP_HOST];
  if (SMTP_HOST.includes("secureserver.net")) {
    hosts.push("smtp.titan.email");
  } else if (SMTP_HOST.includes("titan.email")) {
    hosts.push("smtpout.secureserver.net");
  }

  let lastErr = null;
  for (const host of hosts) {
    try {
      console.log(`Attempting SMTP send to ${to} via ${host}:${SMTP_PORT}...`);
      await sendMailSocket({
        host,
        port: SMTP_PORT,
        user: SMTP_USER,
        pass: SMTP_PASSWORD,
        to,
        subject,
        html
      });
      console.log(`Email successfully dispatched to ${to} via ${host}`);
      return true;
    } catch (e) {
      lastErr = e;
      console.warn(`Failed on ${host}: ${e.message}`);
    }
  }
  throw lastErr || new Error("Failed to dispatch email across candidate SMTP hosts");
}

function makeToken(userData) {
  return "duk_" + Buffer.from(JSON.stringify(userData)).toString("base64url");
}

function parseToken(authHeader) {
  if (!authHeader) return null;
  const raw = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!raw) return null;
  const tokenStr = raw.startsWith("duk_") ? raw.slice(4) : raw;
  if (tokenStr.includes(".")) {
    const parts = tokenStr.split(".");
    if (parts.length >= 2) {
      try {
        const payloadJson = Buffer.from(parts[1], "base64url").toString("utf-8");
        const payload = JSON.parse(payloadJson);
        if (payload && typeof payload === "object") return payload;
      } catch (_) {}
    }
  }
  try {
    const json = Buffer.from(tokenStr, "base64url").toString("utf-8");
    const parsed = JSON.parse(json);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch (e) {
    return null;
  }
}

exports.handler = async (event, context) => {
  // CORS & Anti-Caching Headers (Ensures real-time updates across browsers)
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Shop-Id, X-User-Email, Cache-Control, Pragma",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Content-Type": "application/json",
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
    "Pragma": "no-cache",
    "Expires": "0",
    "Surrogate-Control": "no-store"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  const rawPath = event.path || "";
  const path = rawPath.replace(/^\/\.netlify\/functions\/api/, "").replace(/^\/api/, "");
  console.log(`Incoming request: ${event.httpMethod} ${path} (raw: ${rawPath})`);

  let body = {};
  if (event.body) {
    try {
      body = JSON.parse(event.body);
    } catch (e) {
      body = {};
    }
  }

  try {
    // Health check
    if (path === "/health" || path === "") {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ ok: true, status: "healthy", service: "Official Dukaan Serverless API" })
      };
    }

    // 1. REGISTER / SIGNUP
    if ((path === "/auth/register" || path === "/auth/signup") && event.httpMethod === "POST") {
      const email = (body.email || "").trim().toLowerCase();
      const name = (body.name || "").trim();
      const password = body.password || "";

      if (!email || !password) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ detail: "Email and password are required." })
        };
      }

      if (path === "/auth/signup") {
        if (password.length < 6) {
          return { statusCode: 400, headers, body: JSON.stringify({ detail: "Password must be at least 6 characters long." }) };
        }
      } else {
        if (password.length < 8) {
          return { statusCode: 422, headers, body: JSON.stringify({ detail: "Password must be at least 8 characters long." }) };
        }
        if (!/[A-Z]/.test(password)) {
          return { statusCode: 422, headers, body: JSON.stringify({ detail: "Password must contain at least one capital letter (A-Z)." }) };
        }
        if (!/[0-9]/.test(password)) {
          return { statusCode: 422, headers, body: JSON.stringify({ detail: "Password must contain at least one number (0-9)." }) };
        }
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
          return { statusCode: 422, headers, body: JSON.stringify({ detail: "Password must contain at least one special symbol (!@#$%...)." }) };
        }
      }

      const verification_code = String(Math.floor(100000 + Math.random() * 900000));
      const verification_token = "tok_" + Date.now() + "_" + Math.random().toString(36).substring(2, 10);
      const verifyLink = `${FRONTEND_URL}/verify-email?token=${verification_token}&email=${encodeURIComponent(email)}`;

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #E8E5DF; border-radius: 16px; background-color: #FAF6F0;">
          <h2 style="color: #1B1464; margin-bottom: 8px;">Welcome to Dukaan!</h2>
          <p style="color: #4A4A4A; font-size: 14px; line-height: 1.5;">Thank you for registering. Please verify your email address to activate your account and select your subscription plan.</p>
          <div style="margin: 24px 0; text-align: center;">
            <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #D4623B; background: #FFFFFF; padding: 14px 28px; border-radius: 12px; border: 2px dashed #D4623B; display: inline-block;">${verification_code}</div>
          </div>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${verifyLink}" style="background-color: #D4623B; color: #FFFFFF; padding: 12px 28px; text-decoration: none; border-radius: 9999px; font-weight: bold; display: inline-block; font-size: 14px;">Verify Email Address</a>
          </div>
          <p style="color: #888888; font-size: 12px; text-align: center; margin-top: 16px;">This verification code and link will expire in 24 hours.</p>
        </div>
      `;

      try {
        await sendMailWithFallback({
          to: email,
          subject: "Verify your Dukaan account",
          html
        });
      } catch (err) {
        console.error("Failed to send verification email:", err);
      }

      if (body.referral_code) {
        await getPersistentState();
        const refCode = body.referral_code.trim().toUpperCase();
        referralCodes.unshift({
          id: `ref_${Date.now()}`,
          code: refCode,
          merchant_name: name || email.split("@")[0],
          merchant_email: email,
          commission_rate: 15,
          total_referrals: 1,
          earnings: 299,
          status: "pending",
          created_at: new Date().toISOString()
        });
        await savePersistentState();
      }
      const newRegUser = {
        id: `usr_${Date.now()}`,
        name: name || email.split("@")[0],
        email,
        phone: "",
        phone_verified: false,
        email_verified: false,
        is_verified: false,
        role: "owner",
        store_name: body.cafe_name || `${name || email.split("@")[0]}'s Café`,
        verification_code,
        verification_token,
        subscription: null
      };
      if (body.cafe_name || isNexoraRequest(event, path)) {
        try {
          const cleanShopKey = email.replace(/[^a-z0-9_]/g, '_');
          const cafeStore = await getCafeStore(cleanShopKey);
          cafeStore.cafe = {
            id: 'cafe_' + Date.now(),
            name: body.cafe_name || `${name || email.split("@")[0]}'s Café`,
            tax_rate: 5,
            upi_enabled: true,
            is_pro: true
          };
          cafeStore.staff = [
            { id: newRegUser.id, name: newRegUser.name, email: newRegUser.email, role: "owner" }
          ];
          await saveCafeStore(cleanShopKey, cafeStore);
        } catch (_) {}
      }
      if (!globalPlatformConfig.email_verifications) globalPlatformConfig.email_verifications = {};
      globalPlatformConfig.email_verifications[email] = {
        code: String(verification_code),
        token: String(verification_token),
        expires_at: Date.now() + 24 * 3600 * 1000
      };
      recordRegisteredUser(newRegUser);
      await savePersistentState();

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          ok: true,
          need_verification: true,
          email,
          verification_code,
          verification_token,
          message: "Account created! A verification code has been sent to your email.",
          user: newRegUser
        })
      };
    }

    // 2. LOGIN
    if (path === "/auth/login" && event.httpMethod === "POST") {
      await getPersistentState();
      const email = (body.email || "").trim().toLowerCase();
      const password = body.password || "";
      const name = (body.name || "").trim() || email.split("@")[0];
      if (!email || !password) {
        return { statusCode: 400, headers, body: JSON.stringify({ detail: "Email and password are required." }) };
      }
      const isAdmin = email.toLowerCase() === ADMIN_EMAIL;
      if (isAdmin) {
        const adminPassword = process.env.ADMIN_PASSWORD || "";\n        if (!adminPassword || password !== adminPassword) {
        return { statusCode: 401, headers, body: JSON.stringify({ detail: "Incorrect admin password. Please try again." }) };
      }

      const existingReg = registeredUsersList.find(u => u.email && u.email.toLowerCase() === email);
      const granted = globalPlatformConfig.granted_subscriptions?.[email];
      const isFrozen = !!globalPlatformConfig.frozen_merchants?.[email];
      const isVerified = globalPlatformConfig.verified_merchants?.[email] !== undefined 
        ? globalPlatformConfig.verified_merchants[email] 
        : (isAdmin ? true : (existingReg?.is_verified ?? false));

      if (!isAdmin) {
        // Step 1: If email is not verified, generate code, dispatch to email, and redirect to verify-email
        if (!isVerified || !existingReg?.email_verified) {
          const verification_code = String(Math.floor(100000 + Math.random() * 900000));
          const verification_token = "tok_" + Date.now() + "_" + Math.random().toString(36).substring(2, 10);
          if (!globalPlatformConfig.email_verifications) globalPlatformConfig.email_verifications = {};
          globalPlatformConfig.email_verifications[email] = {
            code: String(verification_code),
            token: String(verification_token),
            expires_at: Date.now() + 24 * 3600 * 1000
          };
          if (existingReg) {
            existingReg.verification_code = verification_code;
            existingReg.verification_token = verification_token;
            existingReg.is_verified = false;
            existingReg.email_verified = false;
          }
          const verifyLink = `${FRONTEND_URL}/verify-email?token=${verification_token}&email=${encodeURIComponent(email)}`;
          const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #E8E5DF; border-radius: 16px; background-color: #FAF6F0;">
              <h2 style="color: #1B1464; margin-bottom: 8px;">Dukaan Sign-In Verification Code</h2>
              <p style="color: #4A4A4A; font-size: 14px; line-height: 1.5;">Please enter this 6-digit verification code to sign in to your Dukaan store:</p>
              <div style="margin: 24px 0; text-align: center;">
                <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #D4623B; background: #FFFFFF; padding: 14px 28px; border-radius: 12px; border: 2px dashed #D4623B; display: inline-block;">${verification_code}</div>
              </div>
              <div style="text-align: center; margin: 24px 0;">
                <a href="${verifyLink}" style="background-color: #D4623B; color: #FFFFFF; padding: 12px 28px; text-decoration: none; border-radius: 9999px; font-weight: bold; display: inline-block; font-size: 14px;">Verify Email Address</a>
              </div>
            </div>
          `;
          sendMailWithFallback({ to: email, subject: `Dukaan Sign-In Verification Code: ${verification_code}`, html }).catch(() => {});
          await savePersistentState();

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              ok: true,
              need_verification: true,
              step: "email",
              email,
              message: "A 6-digit verification code has been dispatched to your email.",
              user: { email, is_verified: false, email_verified: false }
            })
          };
        }

        // Step 2: If email is verified, but phone is not verified, require phone OTP verification
        if (!existingReg?.phone_verified) {
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              ok: true,
              need_phone_verification: true,
              step: "phone",
              email,
              message: "Please verify your mobile number to continue.",
              user: { email, is_verified: true, email_verified: true, phone_verified: false }
            })
          };
        }
      }

      const user = {
        id: existingReg?.id || `usr_${Date.now()}`,
        name: existingReg?.name || name,
        email,
        phone: existingReg?.phone || "",
        phone_verified: isAdmin ? true : Boolean(existingReg?.phone_verified),
        email_verified: isAdmin ? true : Boolean(existingReg?.email_verified || isVerified),
        is_verified: isVerified,
        is_frozen: isFrozen,
        is_admin: isAdmin,
        subscription: granted || existingReg?.subscription || null,
        is_premium: (granted || existingReg?.subscription)?.plan === "premium" || (granted || existingReg?.subscription)?.plan === "pro",
        is_pro: (granted || existingReg?.subscription)?.plan === "pro"
      };

      recordRegisteredUser(user);
      await savePersistentState();

      const token = makeToken(user);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          ok: true,
          access_token: token,
          token: token,
          token_type: "bearer",
          user,
          cafe: {
            id: user.cafe_id || user.id || "cafe_main",
            name: user.name ? `${user.name}'s Café` : "Nexora Café",
            tax_rate: 5,
            upi_enabled: true
          }
        })
      };
    }

    // 2A-1. LOGOUT
    if (path === "/auth/logout" && event.httpMethod === "POST") {
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true, message: "Logged out successfully." }) };
    }

    // 2A-2. PREMIUM PROFILE
    if (path === "/premium/profile" && event.httpMethod === "GET") {
      const authHeader = event.headers.authorization || event.headers.Authorization || "";
      const user = parseToken(authHeader);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          ok: true,
          profile: {
            business_name: user?.name || "Apni Dukaan",
            gst_enabled: false,
            soundbox_active: true,
            whatsapp_reminders: true
          }
        })
      };
    }

    // 2A. SOCIAL LOGIN (Google / Apple)
    if ((path === "/auth/social-login" || path === "/auth/google") && event.httpMethod === "POST") {
      await getPersistentState();
      let email = (body.email || "").trim().toLowerCase();
      let name = (body.name || "").trim();
      let avatar = body.avatar || "";
      const provider = body.provider || "google";

      if (!email && body.credential) {
        try {
          const payloadBase64 = body.credential.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
          const jsonStr = Buffer.from(payloadBase64, 'base64').toString('utf8');
          const googlePayload = JSON.parse(jsonStr);
          if (googlePayload.email) email = googlePayload.email.trim().toLowerCase();
          if (googlePayload.name) name = googlePayload.name.trim();
          if (googlePayload.picture) avatar = googlePayload.picture;
        } catch (_) {}
      }

      if (!name) name = email.split("@")[0] || "Merchant";

      if (!email) {
        return { statusCode: 400, headers, body: JSON.stringify({ detail: "Email is required for social login." }) };
      }

      const isAdmin = email === ADMIN_EMAIL.toLowerCase();
      let granted = globalPlatformConfig.granted_subscriptions?.[email];
      if (!granted && globalPlatformConfig.granted_subscriptions) {
        const foundKey = Object.keys(globalPlatformConfig.granted_subscriptions).find(k => k.toLowerCase() === email);
        if (foundKey) granted = globalPlatformConfig.granted_subscriptions[foundKey];
      }

      const isFrozen = !!globalPlatformConfig.frozen_merchants?.[email];
      const isVerified = globalPlatformConfig.verified_merchants?.[email] !== undefined 
        ? globalPlatformConfig.verified_merchants[email] 
        : true;

      let existing = registeredUsersList.find(u => u.email && u.email.toLowerCase() === email);
      const sub = granted || existing?.subscription || { plan: "starter", status: "active" };

      const user = {
        id: existing?.id || `usr_${Date.now()}`,
        name: existing?.name || name,
        email,
        avatar: existing?.avatar || avatar,
        auth_provider: provider,
        is_admin: isAdmin,
        is_verified: isVerified,
        is_frozen: isFrozen,
        subscription: sub,
        role: existing?.role || (isAdmin ? "admin" : "owner"),
        store_name: body.cafe_name || existing?.store_name || `${existing?.name || name}'s Store`,
        is_premium: (granted || existing?.subscription)?.plan === "premium" || (granted || existing?.subscription)?.plan === "pro",
        is_pro: (granted || existing?.subscription)?.plan === "pro"
      };

      recordRegisteredUser(user);
      await savePersistentState();

      const token = makeToken(user);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          ok: true,
          access_token: token,
          token: token,
          token_type: "bearer",
          user,
          cafe: {
            id: user.cafe_id || user.id || "cafe_main",
            name: body.cafe_name || user.store_name || `${user.name}'s Café`,
            tax_rate: 5,
            upi_enabled: true
          }
        })
      };
    }

    // 2B. RESET PASSWORD
    if (path === "/auth/reset-password" && event.httpMethod === "POST") {
      const { email, code, token, new_password } = body;
      const cleanEmail = String(email || "").trim().toLowerCase();
      const cleanInput = String(code || token || "").trim();
      if (!cleanEmail || !cleanInput) {
        return { statusCode: 400, headers, body: JSON.stringify({ detail: "Email and reset code are required." }) };
      }
      if (!new_password || new_password.length < 8) {
        return { statusCode: 400, headers, body: JSON.stringify({ detail: "Password must be at least 8 characters." }) };
      }
      const storedReset = globalPlatformConfig.password_resets?.[cleanEmail];
      const validReset = storedReset && storedReset.expires_at > Date.now() &&
        ((storedReset.code && cleanInput === String(storedReset.code)) ||
         (storedReset.token && cleanInput === String(storedReset.token)));
      if (!validReset) {
        return { statusCode: 400, headers, body: JSON.stringify({ detail: "Invalid or expired reset code." }) };
      }

      const reg = registeredUsersList.find(u => u.email && u.email.toLowerCase() === cleanEmail);
      if (!reg) {
        return { statusCode: 404, headers, body: JSON.stringify({ detail: "Account not found." }) };
      }
      reg.password_hash = require("crypto").createHash("sha256").update(new_password).digest("hex");
      delete globalPlatformConfig.password_resets[cleanEmail];
      await savePersistentState();

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ ok: true, message: "Password reset successfully! You can now log in." })
      };
    }

    // 2C. CHANGE PASSWORD
    if (path === "/auth/change-password" && event.httpMethod === "POST") {
      const { new_password } = body;
      if (!new_password || new_password.length < 8) {
        return { statusCode: 400, headers, body: JSON.stringify({ detail: "Password must be at least 8 characters." }) };
      }
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ ok: true, message: "Password updated successfully!" })
      };
    }

    // 2D. UPDATE PROFILE
    if ((path === "/auth/update-profile" || path === "/auth/profile") && (event.httpMethod === "POST" || event.httpMethod === "PUT")) {
      const authHeader = event.headers.authorization || event.headers.Authorization || "";
      let user = parseToken(authHeader) || {};
      if (body.name) user.name = body.name.trim();
      if (body.phone) user.phone = body.phone.trim();
      if (body.avatar !== undefined) user.avatar = body.avatar;

      const new_token = makeToken(user);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ ok: true, user, access_token: new_token })
      };
    }

    // 3. CURRENT USER (ME)
    if ((path === "/auth/me" || path === "/users/me") && event.httpMethod === "GET") {
      await getPersistentState();
      const authHeader = event.headers.authorization || event.headers.Authorization || "";
      const userFromToken = parseToken(authHeader);
      const headerEmail = (event.headers["x-user-email"] || event.headers["X-User-Email"] || "").trim().toLowerCase();
      const email = ((userFromToken?.email || headerEmail) || "").toLowerCase().trim();

      if (email) {
        let granted = globalPlatformConfig.granted_subscriptions?.[email];
        if (!granted && globalPlatformConfig.granted_subscriptions) {
          const foundKey = Object.keys(globalPlatformConfig.granted_subscriptions).find(k => k.toLowerCase() === email);
          if (foundKey) granted = globalPlatformConfig.granted_subscriptions[foundKey];
        }

        const isFrozen = !!globalPlatformConfig.frozen_merchants?.[email];
        const isVerified = globalPlatformConfig.verified_merchants?.[email] !== undefined 
          ? globalPlatformConfig.verified_merchants[email] 
          : (userFromToken?.is_verified ?? true);

        const existingReg = registeredUsersList.find(u => u.email && u.email.toLowerCase() === email);
        const isAdmin = email === ADMIN_EMAIL.toLowerCase();

        const mergedUser = {
          ...(existingReg || {}),
          ...(userFromToken || {}),
          email,
          phone: existingReg?.phone || userFromToken?.phone || "",
          phone_verified: isAdmin ? true : Boolean(existingReg?.phone_verified || userFromToken?.phone_verified),
          email_verified: isAdmin ? true : Boolean(existingReg?.email_verified || userFromToken?.email_verified || isVerified),
          is_admin: isAdmin,
          is_frozen: isFrozen,
          is_verified: isVerified
        };

        if (!isAdmin && !isNexoraRequest(event, path) && (!mergedUser.is_verified || (!mergedUser.phone_verified && !mergedUser.email_verified))) {
          return {
            statusCode: 401,
            headers,
            body: JSON.stringify({ detail: "Re-authentication required. Please sign in and verify your mobile number." })
          };
        }

        if (granted) {
          mergedUser.subscription = granted;
          if (granted.plan === "premium" || granted.plan === "pro") mergedUser.is_premium = true;
          if (granted.plan === "pro") mergedUser.is_pro = true;
        } else if (existingReg?.subscription) {
          mergedUser.subscription = existingReg.subscription;
          if (existingReg.subscription.plan === "premium" || existingReg.subscription.plan === "pro") mergedUser.is_premium = true;
          if (existingReg.subscription.plan === "pro") mergedUser.is_pro = true;
        }

        recordRegisteredUser(mergedUser);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            ...mergedUser,
            user: mergedUser,
            cafe: {
              id: mergedUser.cafe_id || mergedUser.id || "cafe_main",
              name: mergedUser.cafe_name || mergedUser.store_name || (mergedUser.name ? `${mergedUser.name}'s Café` : "My Café"),
              tax_rate: 5,
              upi_enabled: true,
              is_pro: true
            }
          })
        };
      }

      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ detail: "Not authenticated" })
      };
    }

    // 4. RESEND VERIFICATION
    if (path === "/auth/resend-verification" && event.httpMethod === "POST") {
      const email = (body.email || "").trim().toLowerCase();
      if (!email) {
        return { statusCode: 400, headers, body: JSON.stringify({ detail: "Email is required." }) };
      }

      const verification_code = String(Math.floor(100000 + Math.random() * 900000));
      const verification_token = "tok_" + Date.now() + "_" + Math.random().toString(36).substring(2, 10);
      const verifyLink = `${FRONTEND_URL}/verify-email?token=${verification_token}&email=${encodeURIComponent(email)}`;

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #E8E5DF; border-radius: 16px; background-color: #FAF6F0;">
          <h2 style="color: #1B1464; margin-bottom: 8px;">Your New Dukaan Verification Code</h2>
          <p style="color: #4A4A4A; font-size: 14px; line-height: 1.5;">Here is your requested verification code to activate your Dukaan account:</p>
          <div style="margin: 24px 0; text-align: center;">
            <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #D4623B; background: #FFFFFF; padding: 14px 28px; border-radius: 12px; border: 2px dashed #D4623B; display: inline-block;">${verification_code}</div>
          </div>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${verifyLink}" style="background-color: #D4623B; color: #FFFFFF; padding: 12px 28px; text-decoration: none; border-radius: 9999px; font-weight: bold; display: inline-block; font-size: 14px;">Verify Email Address</a>
          </div>
        </div>
      `;

      try {
        await sendMailWithFallback({
          to: email,
          subject: "Your new Dukaan verification code",
          html
        });
      } catch (err) {
        console.error("Failed to send resend email:", err);
      }

      if (!globalPlatformConfig.email_verifications) globalPlatformConfig.email_verifications = {};
      globalPlatformConfig.email_verifications[email] = {
        code: String(verification_code),
        token: String(verification_token),
        expires_at: Date.now() + 24 * 3600 * 1000
      };
      let regU = registeredUsersList.find(u => u.email && u.email.toLowerCase() === email);
      if (regU) {
        regU.verification_code = verification_code;
        regU.verification_token = verification_token;
      }
      await savePersistentState();

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          ok: true,
          verification_code,
          verification_token,
          message: "A new verification code has been dispatched to your email."
        })
      };
    }

    // 3. FORGOT PASSWORD
    if (path === "/auth/forgot-password" && event.httpMethod === "POST") {
      const email = (body.email || "").trim().toLowerCase();
      if (!email) {
        return { statusCode: 400, headers, body: JSON.stringify({ detail: "Email is required." }) };
      }

      const reset_code = String(Math.floor(100000 + Math.random() * 900000));
      const reset_token = "rst_" + Date.now() + "_" + Math.random().toString(36).substring(2, 10);
      const resetLink = `${FRONTEND_URL}/reset-password?token=${reset_token}&email=${encodeURIComponent(email)}`;
      const resetExpiresAt = Date.now() + 60 * 60 * 1000;
      if (!globalPlatformConfig.password_resets) globalPlatformConfig.password_resets = {};
      globalPlatformConfig.password_resets[email] = {
        code: reset_code,
        token: reset_token,
        expires_at: resetExpiresAt
      };

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #E8E5DF; border-radius: 16px; background-color: #FAF6F0;">
          <h2 style="color: #1B1464; margin-bottom: 8px;">Reset Your Dukaan Password</h2>
          <p style="color: #4A4A4A; font-size: 14px; line-height: 1.5;">You requested to reset your password. Use the 6-digit code below or click the button:</p>
          <div style="margin: 24px 0; text-align: center;">
            <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #D4623B; background: #FFFFFF; padding: 14px 28px; border-radius: 12px; border: 2px dashed #D4623B; display: inline-block;">${reset_code}</div>
          </div>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${resetLink}" style="background-color: #D4623B; color: #FFFFFF; padding: 12px 28px; text-decoration: none; border-radius: 9999px; font-weight: bold; display: inline-block; font-size: 14px;">Reset Password</a>
          </div>
          <p style="color: #888888; font-size: 12px; text-align: center; margin-top: 16px;">If you did not request this password reset, you can safely ignore this email.</p>
        </div>
      `;

      try {
        await sendMailWithFallback({
          to: email,
          subject: "Reset your Dukaan password",
          html
        });
      } catch (err) {
        console.error("Failed to send forgot password email:", err);
      }

      await savePersistentState();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          ok: true,
          message: "If an account exists with this email, a reset code has been sent."
        })
      };
    }

    // 4. VERIFY EMAIL / OTP (STRICT CODE VALIDATION)
    if ((path === "/auth/verify-email" || path === "/auth/verify-otp") && event.httpMethod === "POST") {
      await getPersistentState();
      const email = (body.email || "").trim().toLowerCase();
      const inputCode = String(body.code || body.token || body.otp || "").trim();

      if (!email) {
        return { statusCode: 400, headers, body: JSON.stringify({ detail: "Email address is required." }) };
      }
      if (!inputCode) {
        return { statusCode: 400, headers, body: JSON.stringify({ detail: "Please enter the 6-digit verification code." }) };
      }

      let matchedUser = registeredUsersList.find(u => u.email && u.email.toLowerCase() === email);
      const storedVerif = globalPlatformConfig.email_verifications?.[email];

      const expectedCode = storedVerif?.code || matchedUser?.verification_code;
      const expectedToken = storedVerif?.token || matchedUser?.verification_token;

      const isMatch = Boolean(
        (expectedCode && inputCode === String(expectedCode).trim()) ||
        (expectedToken && inputCode === String(expectedToken).trim())
      );

      if (!isMatch) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            ok: false,
            detail: "Invalid verification code. Please check your email and enter the correct 6-digit code."
          })
        };
      }

      if (matchedUser) {
        matchedUser.is_verified = true;
        matchedUser.email_verified = true;
      }
      recordRegisteredUser({ email, is_verified: true, email_verified: true });

      if (globalPlatformConfig.email_verifications) {
        delete globalPlatformConfig.email_verifications[email];
      }
      await savePersistentState();

      const userPayload = {
        id: matchedUser?.id || ('usr_' + Date.now()),
        email,
        name: matchedUser?.name || email.split('@')[0],
        role: matchedUser?.role || "owner",
        is_verified: true,
        email_verified: true,
        phone_verified: Boolean(matchedUser?.phone_verified)
      };
      const token = makeToken(userPayload);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          ok: true,
          message: "Email verified successfully.",
          token,
          access_token: token,
          token_type: "bearer",
          user: userPayload,
          cafe: {
            id: userPayload.cafe_id || userPayload.id || "cafe_main",
            name: matchedUser?.cafe_name || matchedUser?.store_name || (userPayload.name ? `${userPayload.name}'s Café` : "My Café"),
            tax_rate: 5,
            upi_enabled: true,
            is_pro: true
          }
        })
      };
    }

    // 4B. SEND PHONE OTP (FAST2SMS / AUTHKEY / EMAIL NOTIFICATION FALLBACK)
    if (path === "/auth/phone/send-otp" && event.httpMethod === "POST") {
      await getPersistentState();
      const email = (body.email || "").trim().toLowerCase();
      const rawPhone = (body.phone || "").trim().replace(/\D/g, "");
      const cleanPhone = rawPhone.slice(-10);

      if (!cleanPhone || cleanPhone.length !== 10) {
        return { statusCode: 400, headers, body: JSON.stringify({ detail: "Please enter a valid 10-digit mobile number." }) };
      }

      // Generate 6-digit numeric OTP
      const otp = String(Math.floor(100000 + Math.random() * 900000));
      if (!globalPlatformConfig.phone_otps) globalPlatformConfig.phone_otps = {};
      globalPlatformConfig.phone_otps[cleanPhone] = {
        otp,
        email,
        expires_at: Date.now() + 10 * 60 * 1000,
        created_at: new Date().toISOString()
      };

      // 1. Attempt real SMS via Fast2SMS if API key is configured
      let smsDispatched = false;
      const fast2smsKey = process.env.FAST2SMS_API_KEY || globalPlatformConfig.fast2sms_api_key || FAST2SMS_API_KEY;
      if (fast2smsKey) {
        try {
          const smsPayload = {
            route: "otp",
            variables_values: otp,
            numbers: cleanPhone
          };
          const smsRes = await safeHttpPost(
            "https://www.fast2sms.com/dev/bulkV2",
            smsPayload,
            {
              "authorization": fast2smsKey,
              "Content-Type": "application/json"
            },
            6000
          );
          if (smsRes.ok && (smsRes.data?.return === true || smsRes.statusCode === 200)) {
            smsDispatched = true;
          } else {
            console.log("Fast2SMS response:", smsRes.statusCode, smsRes.raw);
          }
        } catch (e) {
          console.warn("Fast2SMS API dispatch failed:", e);
        }
      }

      // 2. Attempt SMS/WhatsApp via AuthKey if configured
      const authkeyKey = process.env.AUTHKEY_API_KEY || globalPlatformConfig.authkey_api_key;
      if (!smsDispatched && authkeyKey) {
        try {
          const akPayload = {
            country_code: "91",
            mobile: cleanPhone,
            message: `Your Dukaan OTP verification code is ${otp}. Valid for 10 minutes.`
          };
          const akRes = await safeHttpPost(
            "https://console.authkey.io/restapi/requestjson.php",
            akPayload,
            {
              "Authorization": `Basic ${authkeyKey}`,
              "Content-Type": "application/json"
            },
            5000
          );
          if (akRes.ok) smsDispatched = true;
        } catch (e) {
          console.warn("AuthKey SMS dispatch failed:", e);
        }
      }

      // 3. Attempt SMS via 2Factor if configured
      const twofactorKey = process.env.TWO_FACTOR_API_KEY || globalPlatformConfig.twofactor_api_key;
      if (!smsDispatched && twofactorKey) {
        try {
          const tfRes = await safeHttpPost(
            `https://2factor.in/API/V1/${twofactorKey}/SMS/${cleanPhone}/${otp}/DukaanOTP`,
            {},
            {},
            5000
          );
          if (tfRes.ok) smsDispatched = true;
        } catch (e) {
          console.warn("2Factor SMS dispatch failed:", e);
        }
      }

      // 3. Send via email notification as backup / direct delivery
      if (email) {
        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border-radius: 16px; background: #FAF6F0; border: 1px solid #E8E5DF;">
            <h2 style="color: #1B1464; margin-bottom: 8px;">Dukaan Mobile Verification OTP</h2>
            <p style="color: #4A4A4A; font-size: 14px;">Your 6-digit mobile verification code for <b>+91 ${cleanPhone}</b> is:</p>
            <div style="margin: 20px 0; text-align: center;">
              <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #1B1464; background: #FFFFFF; padding: 12px 24px; border-radius: 12px; border: 2px solid #1B1464; display: inline-block;">${otp}</div>
            </div>
            <p style="color: #777; font-size: 12px; text-align: center;">Valid for 10 minutes. Enter this code to complete mobile verification.</p>
          </div>
        `;
        sendMailWithFallback({
          to: email,
          subject: `Dukaan Mobile OTP: ${otp}`,
          html
        }).catch(() => {});
      }

      await savePersistentState();

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          ok: true,
          phone: cleanPhone,
          demo_otp: otp,
          sms_gateway_active: smsDispatched,
          message: smsDispatched 
            ? `6-digit OTP dispatched via SMS to +91 ${cleanPhone}` 
            : `6-digit OTP dispatched to ${email || 'email'} and ready on screen.`
        })
      };
    }

    // 4C. VERIFY PHONE OTP (STRICT OTP CHECK)
    if (path === "/auth/phone/verify-otp" && event.httpMethod === "POST") {
      await getPersistentState();
      const email = (body.email || "").trim().toLowerCase();
      const rawPhone = (body.phone || "").trim().replace(/\D/g, "");
      const cleanPhone = rawPhone.slice(-10);
      const inputOtp = String(body.otp || "").trim();

      if (!cleanPhone || cleanPhone.length !== 10) {
        return { statusCode: 400, headers, body: JSON.stringify({ detail: "Please enter a valid 10-digit mobile number." }) };
      }
      if (!inputOtp || inputOtp.length < 6) {
        return { statusCode: 400, headers, body: JSON.stringify({ detail: "Please enter the complete 6-digit OTP." }) };
      }

      const stored = globalPlatformConfig.phone_otps?.[cleanPhone];
      const isMatch = stored && String(stored.otp).trim() === inputOtp && stored.expires_at > Date.now();

      if (!isMatch) {
        return { 
          statusCode: 400, 
          headers, 
          body: JSON.stringify({ 
            ok: false, 
            detail: "Invalid or expired OTP. Please check the 6-digit code and try again." 
          }) 
        };
      }

      let matchedUser = registeredUsersList.find(u => (email && u.email.toLowerCase() === email) || (u.phone && u.phone.endsWith(cleanPhone)));
      if (matchedUser) {
        matchedUser.phone = cleanPhone;
        matchedUser.phone_verified = true;
      }

      if (email) {
        recordRegisteredUser({
          email,
          phone: cleanPhone,
          phone_verified: true,
          is_verified: true,
          email_verified: true
        });
      }

      if (globalPlatformConfig.phone_otps) {
        delete globalPlatformConfig.phone_otps[cleanPhone];
      }

      await savePersistentState();

      const updatedUser = {
        ...(matchedUser || {}),
        email: email || matchedUser?.email || "",
        phone: cleanPhone,
        phone_verified: true,
        is_verified: true,
        email_verified: true
      };

      const userToken = makeToken(updatedUser);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          ok: true,
          access_token: userToken,
          message: "Mobile number verified successfully!",
          user: updatedUser
        })
      };
    }

    // 5. SOCIAL LOGIN (Google & Apple)
    if (path === "/auth/social-login" && event.httpMethod === "POST") {
      await getPersistentState();
      const email = (body.email || "").trim().toLowerCase();
      const name = (body.name || (body.provider === "google" ? "Google User" : "Apple User")).trim();
      const provider = body.provider || "google";
      const avatar = body.avatar || "";

      if (!email) {
        return { statusCode: 400, headers, body: JSON.stringify({ detail: "Email is required for social sign-in." }) };
      }

      const isAdmin = email.toLowerCase() === ADMIN_EMAIL;
      const granted = globalPlatformConfig.granted_subscriptions?.[email];
      const isFrozen = !!globalPlatformConfig.frozen_merchants?.[email];
      const isVerified = globalPlatformConfig.verified_merchants?.[email] !== undefined 
        ? globalPlatformConfig.verified_merchants[email] 
        : true;

      const user = {
        id: `usr_${Date.now()}`,
        name,
        email,
        avatar,
        is_verified: isVerified,
        is_frozen: isFrozen,
        is_admin: isAdmin,
        provider,
        subscription: granted || null,
        is_premium: granted?.plan === "premium" || granted?.plan === "pro",
        is_pro: granted?.plan === "pro"
      };

      recordRegisteredUser(user);
      await savePersistentState();

      const token = makeToken(user);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          ok: true,
          access_token: token,
          token_type: "bearer",
          message: `Successfully authenticated via ${provider}`,
          user
        })
      };
    }

    // 5B. GOOGLE CODE EXCHANGE
    if (path === "/auth/google-exchange" && event.httpMethod === "POST") {
      const code = body.code;
      const redirect_uri = body.redirect_uri || `${FRONTEND_URL}/auth/google/callback`;
      if (!code) {
        return { statusCode: 400, headers, body: JSON.stringify({ detail: "Missing code" }) };
      }
      try {
        const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            code,
            client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID || "682420913410-dfarb0n3e5a44vsh32fh1hh5j4ig0n6r.apps.googleusercontent.com",
            redirect_uri,
            grant_type: "authorization_code"
          }).toString()
        });
        const tokenData = await tokenRes.json();
        return { statusCode: tokenRes.status || 200, headers, body: JSON.stringify(tokenData) };
      } catch (err) {
        return { statusCode: 500, headers, body: JSON.stringify({ detail: err.message }) };
      }
    }

    // 6. GENERIC SEND EMAIL
    if (path === "/send-email" && event.httpMethod === "POST") {
      const { to, subject, html } = body;
      if (!to || !subject || !html) {
        return { statusCode: 400, headers, body: JSON.stringify({ detail: "Missing to, subject, or html." }) };
      }
      await sendMailWithFallback({ to, subject, html });
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ ok: true, message: `Email sent to ${to}` })
      };
    }

    // 7. SUBSCRIPTIONS - TRIAL MANDATE
    if (path === "/subscriptions/trial" && event.httpMethod === "POST") {
      await getPersistentState();
      const plan = body.plan || "business";
      const isProUpgrade = Boolean(body.is_pro_upgrade_trial) || (plan === "pro" && Number(body.amount) === 0);
      const trialDays = Number(body.trial_days) || (plan === "pro" ? 14 : plan === "starter" ? 90 : plan === "business" ? 60 : 30);
      const expires_at = body.expires_at || new Date(Date.now() + trialDays * 86400000).toISOString();
      const subscription = {
        plan,
        status: "active",
        is_trial: true,
        trial_days: trialDays,
        is_pro_upgrade_trial: isProUpgrade,
        razorpay_payment_id: body.razorpay_payment_id || (isProUpgrade ? `pro_free_trial_${Date.now()}` : `pay_trial_${Date.now()}`),
        mandate_verified: true,
        amount: isProUpgrade ? 0 : (body.amount || 1),
        expires_at,
        activated_at: new Date().toISOString()
      };

      const authHeader = event.headers.authorization || event.headers.Authorization || "";
      let user = parseToken(authHeader) || {};
      const email = ((body.user_email || body.email || user.email) || "").toLowerCase().trim();
      if (email) {
        user.email = email;
        if (!globalPlatformConfig.granted_subscriptions) globalPlatformConfig.granted_subscriptions = {};
        globalPlatformConfig.granted_subscriptions[email] = subscription;
        recordRegisteredUser({ email, subscription, is_verified: true });
        await savePersistentState();
      }
      user.subscription = subscription;
      if (plan === "premium" || plan === "pro") user.is_premium = true;
      if (plan === "pro") user.is_pro = true;
      if (plan === "cafe") {
        user.is_pro = true;
        subscription.pro_bonus = true;
        subscription.pro_bonus_months = 2;
      }
      const new_token = makeToken(user);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          ok: true,
          subscription,
          access_token: new_token,
          user
        })
      };
    }

    // 8. SUBSCRIPTIONS - RAZORPAY VERIFY (PAID)
    if (path === "/subscriptions/razorpay/verify" && event.httpMethod === "POST") {
      await getPersistentState();
      const plan = body.plan || "business";
      const isAnnual = Boolean(body.annual);
      let durationDays = isAnnual ? 365 : 30;
      if (plan === "pro") {
        durationDays = isAnnual ? 548 : 60; // 12+6 months free or 1+1 month free
      }

      const authHeader = event.headers.authorization || event.headers.Authorization || "";
      let user = parseToken(authHeader) || {};
      const email = ((body.user_email || body.email || user.email) || "").toLowerCase().trim();

      if (!globalPlatformConfig.granted_subscriptions) globalPlatformConfig.granted_subscriptions = {};
      if (!globalPlatformConfig.queued_subscriptions) globalPlatformConfig.queued_subscriptions = {};

      const currentActive = email ? (globalPlatformConfig.granted_subscriptions[email] || null) : null;
      const curExp = currentActive?.expires_at ? new Date(currentActive.expires_at).getTime() : 0;
      const isCurrentlyActive = Boolean(curExp && curExp > Date.now() && (currentActive?.status === "active" || currentActive?.status === "trial"));

      let subscription = null;
      let upcomingSub = body.upcoming_subscription || null;

      if (isCurrentlyActive && !body.instant_activate) {
        subscription = currentActive;

        const existingQueued = globalPlatformConfig.queued_subscriptions?.[email];
        let totalDurationDays = durationDays;
        let totalAmountPaid = Number(body.amount) || (plan === "pro" ? 499 : plan === "premium" ? 239 : plan === "business" ? 119 : 79);
        let cycleCount = 1;

        if (body.upcoming_subscription) {
          upcomingSub = body.upcoming_subscription;
        } else if (existingQueued && existingQueued.plan === plan) {
          totalDurationDays = (Number(existingQueued.duration_days) || (existingQueued.plan === "pro" ? 60 : 30)) + durationDays;
          totalAmountPaid = (Number(existingQueued.amount_paid) || 0) + totalAmountPaid;
          cycleCount = (Number(existingQueued.cycle_count) || 1) + 1;

          const startsAt = currentActive.expires_at;
          const expiresAt = new Date(curExp + totalDurationDays * 86400000).toISOString();

          upcomingSub = {
            plan,
            plan_name: body.plan_name || (plan.charAt(0).toUpperCase() + plan.slice(1)),
            status: "scheduled",
            is_annual: isAnnual,
            starts_at: startsAt,
            expires_at: expiresAt,
            duration_days: totalDurationDays,
            cycle_count: cycleCount,
            amount_paid: totalAmountPaid,
            paid_at: new Date().toISOString(),
            razorpay_order_id: body.razorpay_order_id || null,
            razorpay_payment_id: body.razorpay_payment_id || `pay_rzp_${Date.now()}`
          };
        } else {
          upcomingSub = {
            plan,
            plan_name: body.plan_name || (plan.charAt(0).toUpperCase() + plan.slice(1)),
            status: "scheduled",
            is_annual: isAnnual,
            starts_at: currentActive.expires_at,
            expires_at: new Date(curExp + durationDays * 86400000).toISOString(),
            duration_days: durationDays,
            cycle_count: 1,
            amount_paid: totalAmountPaid,
            paid_at: new Date().toISOString(),
            razorpay_order_id: body.razorpay_order_id || null,
            razorpay_payment_id: body.razorpay_payment_id || `pay_rzp_${Date.now()}`
          };
        }

        if (email) {
          globalPlatformConfig.queued_subscriptions[email] = upcomingSub;
        }
      } else {
        const baseTime = (body.rollover_remaining && curExp > Date.now()) ? curExp : Date.now();
        const expires_at = body.expires_at || new Date(baseTime + durationDays * 86400000).toISOString();
        subscription = {
          plan,
          status: "active",
          is_annual: isAnnual,
          razorpay_order_id: body.razorpay_order_id,
          razorpay_payment_id: body.razorpay_payment_id || `pay_rzp_${Date.now()}`,
          promo_code: body.promo_code || null,
          expires_at,
          activated_at: new Date().toISOString(),
          ...(plan === "cafe" ? { pro_bonus: true, pro_bonus_months: 2, is_pro: true } : {})
        };
        if (email) {
          globalPlatformConfig.granted_subscriptions[email] = subscription;
          delete globalPlatformConfig.queued_subscriptions[email];
          recordRegisteredUser({ email, subscription, is_pro: plan === "cafe" || plan === "pro" });
        }
        upcomingSub = null;
      }

      const appliedPromoCode = (body.promo_code || "").trim().toUpperCase();
      if (appliedPromoCode) {
        const pIdx = promoCodes.findIndex(p => p.code === appliedPromoCode);
        if (pIdx >= 0) {
          promoCodes[pIdx].usage_count = (promoCodes[pIdx].usage_count || 0) + 1;
        }
      }

      if (email) {
        user.email = email;
        recordRegisteredUser({ email, subscription, upcoming_subscription: upcomingSub, is_verified: true });
      }
      await savePersistentState();

      user.subscription = subscription;
      user.upcoming_subscription = upcomingSub;
      if (subscription?.plan === "premium" || subscription?.plan === "pro") user.is_premium = true;
      if (subscription?.plan === "pro") user.is_pro = true;
      const new_token = makeToken(user);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          ok: true,
          subscription,
          upcoming: upcomingSub,
          upcoming_subscription: upcomingSub,
          access_token: new_token,
          user
        })
      };
    }

    // 9. SUBSCRIPTIONS - ME
    if (path === "/subscriptions/me" && event.httpMethod === "GET") {
      await getPersistentState();
      const authHeader = event.headers.authorization || event.headers.Authorization || "";
      const user = parseToken(authHeader);
      const queryEmail = (event.queryStringParameters?.email || event.queryStringParameters?.user_email || "").trim().toLowerCase();
      const headerEmail = (event.headers["x-user-email"] || event.headers["X-User-Email"] || "").trim().toLowerCase();
      const email = ((user?.email || headerEmail || queryEmail) || "").toLowerCase().trim();

      let granted = null;
      let queued = null;
      if (email) {
        granted = globalPlatformConfig.granted_subscriptions?.[email];
        if (!granted && globalPlatformConfig.granted_subscriptions) {
          const foundKey = Object.keys(globalPlatformConfig.granted_subscriptions).find(k => k.toLowerCase() === email);
          if (foundKey) granted = globalPlatformConfig.granted_subscriptions[foundKey];
        }
        queued = globalPlatformConfig.queued_subscriptions?.[email];
        if (!queued && globalPlatformConfig.queued_subscriptions) {
          const foundKey = Object.keys(globalPlatformConfig.queued_subscriptions).find(k => k.toLowerCase() === email);
          if (foundKey) queued = globalPlatformConfig.queued_subscriptions[foundKey];
        }
      }

      let activeSub = granted;
      if (!activeSub && email) {
        const reg = registeredUsersList.find(u => u.email && u.email.toLowerCase() === email);
        if (reg?.subscription) activeSub = reg.subscription;
        if (!queued && reg?.upcoming_subscription) queued = reg.upcoming_subscription;
      }
      if (!activeSub) activeSub = user?.subscription || null;
      if (!queued) queued = user?.upcoming_subscription || null;

      // Dynamic synchronization: Ensure queued subscription starts_at matches activeSub.expires_at
      if (activeSub?.expires_at && queued) {
        const activeExpMs = new Date(activeSub.expires_at).getTime();
        const queuedStartMs = queued.starts_at ? new Date(queued.starts_at).getTime() : 0;
        if (activeExpMs > queuedStartMs) {
          const durationDays = Number(queued.duration_days) || (queued.plan === "pro" ? 60 : 30);
          queued = {
            ...queued,
            starts_at: activeSub.expires_at,
            expires_at: new Date(activeExpMs + durationDays * 86400000).toISOString()
          };
          if (email && globalPlatformConfig.queued_subscriptions) {
            globalPlatformConfig.queued_subscriptions[email] = queued;
          }
        }
      }

      // Auto-activation: If current activeSub has expired and queued sub is waiting
      if (activeSub?.expires_at && new Date(activeSub.expires_at).getTime() <= Date.now() && queued) {
        activeSub = {
          plan: queued.plan,
          status: "active",
          is_annual: Boolean(queued.is_annual),
          expires_at: queued.expires_at || new Date(Date.now() + (queued.duration_days || 30) * 86400000).toISOString(),
          activated_at: new Date().toISOString()
        };
        if (email) {
          if (!globalPlatformConfig.granted_subscriptions) globalPlatformConfig.granted_subscriptions = {};
          globalPlatformConfig.granted_subscriptions[email] = activeSub;
          if (globalPlatformConfig.queued_subscriptions) delete globalPlatformConfig.queued_subscriptions[email];
          recordRegisteredUser({ email, subscription: activeSub, upcoming_subscription: null, is_verified: true });
          await savePersistentState();
        }
        queued = null;
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          active: activeSub,
          subscription: activeSub,
          upcoming: queued,
          queued: queued
        })
      };
    }

    // 9A. ACTIVATE QUEUED SUBSCRIPTION INSTANTLY
    if (path === "/subscriptions/activate-queued" && event.httpMethod === "POST") {
      await getPersistentState();
      const authHeader = event.headers.authorization || event.headers.Authorization || "";
      const user = parseToken(authHeader);
      const email = ((body.user_email || body.email || user?.email) || "").toLowerCase().trim();

      if (!email) {
        return { statusCode: 400, headers, body: JSON.stringify({ detail: "User email is required." }) };
      }

      if (!globalPlatformConfig.granted_subscriptions) globalPlatformConfig.granted_subscriptions = {};
      if (!globalPlatformConfig.queued_subscriptions) globalPlatformConfig.queued_subscriptions = {};

      let queued = body.upcoming_subscription || globalPlatformConfig.queued_subscriptions[email];
      if (!queued && registeredUsersList) {
        const reg = registeredUsersList.find(u => u.email && u.email.toLowerCase() === email);
        if (reg?.upcoming_subscription) queued = reg.upcoming_subscription;
      }

      if (!queued) {
        return { statusCode: 404, headers, body: JSON.stringify({ detail: "No upcoming subscription found to activate." }) };
      }

      const curSub = globalPlatformConfig.granted_subscriptions[email];
      const curExp = curSub?.expires_at ? new Date(curSub.expires_at).getTime() : 0;
      const baseMs = Math.max(Date.now(), curExp);
      const durationMs = (Number(queued.duration_days) || (queued.plan === "pro" ? 60 : 30)) * 86400000;
      const newExpiry = new Date(baseMs + durationMs).toISOString();

      const newActive = {
        plan: queued.plan,
        status: "active",
        is_annual: Boolean(queued.is_annual),
        razorpay_order_id: queued.razorpay_order_id,
        razorpay_payment_id: queued.razorpay_payment_id,
        expires_at: newExpiry,
        activated_at: new Date().toISOString()
      };

      globalPlatformConfig.granted_subscriptions[email] = newActive;
      delete globalPlatformConfig.queued_subscriptions[email];
      recordRegisteredUser({ email, subscription: newActive, upcoming_subscription: null, is_verified: true });
      await savePersistentState();

      const updatedUser = {
        ...(user || {}),
        email,
        subscription: newActive,
        upcoming_subscription: null,
        is_premium: newActive.plan === "premium" || newActive.plan === "pro",
        is_pro: newActive.plan === "pro"
      };
      const new_token = makeToken(updatedUser);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          ok: true,
          active: newActive,
          subscription: newActive,
          upcoming: null,
          access_token: new_token,
          user: updatedUser
        })
      };
    }

    // 9B. ADMIN GRANT SUBSCRIPTION
    if (path === "/admin/subscriptions/grant" && event.httpMethod === "POST") {
      await getPersistentState();
      const targetEmail = (body.user_email || body.email || body.merchant_email || "").trim().toLowerCase();
      if (!targetEmail) {
        return { statusCode: 400, headers, body: JSON.stringify({ detail: "User email is required." }) };
      }
      const plan = (body.plan || "premium").toLowerCase();
      
      let expDate;
      let days;
      if (body.expires_at) {
        expDate = new Date(body.expires_at).toISOString();
        days = Number(body.days) || Math.max(1, Math.ceil((new Date(expDate).getTime() - Date.now()) / 86400000));
      } else {
        days = Number(body.days) || 365;
        expDate = new Date(Date.now() + days * 86400000).toISOString();
      }
      const note = body.note || "Manual grant/expiry update by master admin";

      if (!globalPlatformConfig.granted_subscriptions) {
        globalPlatformConfig.granted_subscriptions = {};
      }
      const grantRecord = {
        plan,
        status: "active",
        expires_at: expDate,
        is_trial: false,
        days,
        granted_by: ADMIN_EMAIL,
        granted_at: new Date().toISOString(),
        note
      };
      globalPlatformConfig.granted_subscriptions[targetEmail] = grantRecord;

      if (!globalPlatformConfig.verified_merchants) {
        globalPlatformConfig.verified_merchants = {};
      }
      globalPlatformConfig.verified_merchants[targetEmail] = true;

      recordRegisteredUser({
        email: targetEmail,
        name: targetEmail.split("@")[0],
        subscription: grantRecord,
        is_verified: true
      });

      // Bump OTA version so connected clients immediately re-sync & unlock
      globalPlatformConfig.ota_version = (globalPlatformConfig.ota_version || 1) + 1;
      globalPlatformConfig.updated_at = new Date().toISOString();

      await savePersistentState();

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          ok: true,
          message: `Successfully granted ${plan.toUpperCase()} plan to ${targetEmail} until ${expDate.slice(0, 10)}!`,
          subscription: grantRecord
        })
      };
    }

    // 9C. ADMIN USERS FREEZE & VERIFY CONTROLS
    if (path === "/admin/users/freeze" && event.httpMethod === "POST") {
      await getPersistentState();
      const targetEmail = (body.email || "").trim().toLowerCase();
      const targetShopId = (body.shop_id || body.merchant_id || "").trim();
      const isFrozen = Boolean(body.is_frozen);
      if (!globalPlatformConfig.frozen_merchants) globalPlatformConfig.frozen_merchants = {};
      if (targetEmail) {
        globalPlatformConfig.frozen_merchants[targetEmail] = isFrozen;
      }
      if (targetShopId) {
        globalPlatformConfig.frozen_merchants[targetShopId] = isFrozen;
      }
      globalPlatformConfig.ota_version = (globalPlatformConfig.ota_version || 1) + 1;
      await savePersistentState();
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true, email: targetEmail, shop_id: targetShopId, is_frozen: isFrozen }) };
    }

    if (path === "/admin/users/verify" && event.httpMethod === "POST") {
      await getPersistentState();
      const targetEmail = (body.email || "").trim().toLowerCase();
      const isVerified = Boolean(body.is_verified);
      if (!globalPlatformConfig.verified_merchants) globalPlatformConfig.verified_merchants = {};
      globalPlatformConfig.verified_merchants[targetEmail] = isVerified;
      await savePersistentState();
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true, email: targetEmail, is_verified: isVerified }) };
    }

    // 10. ADMIN SUBSCRIPTIONS & STATS
    if (path === "/admin/subscriptions" && event.httpMethod === "GET") {
      await getPersistentState();
      const subs = [
        {
          id: "sub_master_admin",
          user_email: ADMIN_EMAIL,
          payer_name: "Master Administrator",
          plan: "premium",
          status: "active",
          amount: 0,
          source: "system_master",
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 365 * 10 * 86400000).toISOString()
        }
      ];

      const seenEmails = new Set([ADMIN_EMAIL.toLowerCase()]);

      if (globalPlatformConfig.granted_subscriptions) {
        for (const [rawEm, gSub] of Object.entries(globalPlatformConfig.granted_subscriptions)) {
          const em = (rawEm || "").toLowerCase().trim();
          if (!em || seenEmails.has(em)) continue;
          seenEmails.add(em);
          subs.push({
            id: `sub_grant_${em.replace(/[^a-z0-9]/gi, "_")}`,
            user_email: em,
            payer_name: gSub.payer_name || em.split("@")[0],
            phone: gSub.phone || "919979314819",
            plan: gSub.plan || "premium",
            status: gSub.status || "active",
            amount: gSub.plan === "pro" ? 4999 : gSub.plan === "premium" ? 2990 : gSub.plan === "business" ? 1490 : 990,
            source: gSub.source || "admin_grant",
            review_note: gSub.note,
            created_at: gSub.granted_at || gSub.activated_at || new Date().toISOString(),
            expires_at: gSub.expires_at
          });
        }
      }

      if (Array.isArray(registeredUsersList)) {
        for (const u of registeredUsersList) {
          if (!u || !u.email) continue;
          const em = u.email.toLowerCase().trim();
          if (seenEmails.has(em)) {
            const existing = subs.find(s => s.user_email && s.user_email.toLowerCase() === em);
            if (existing && u.subscription?.expires_at) {
              const exExp = existing.expires_at ? new Date(existing.expires_at).getTime() : 0;
              const uExp = new Date(u.subscription.expires_at).getTime();
              if (uExp > exExp) {
                existing.expires_at = u.subscription.expires_at;
                existing.plan = u.subscription.plan || existing.plan;
                existing.status = u.subscription.status || existing.status;
              }
            }
          } else if (u.subscription && u.subscription.expires_at) {
            seenEmails.add(em);
            subs.push({
              id: `sub_reg_${em.replace(/[^a-z0-9]/gi, "_")}`,
              user_email: em,
              payer_name: u.name || em.split("@")[0],
              phone: u.phone || "919979314819",
              plan: u.subscription.plan || "starter",
              status: u.subscription.status || "active",
              amount: u.subscription.plan === "pro" ? 4999 : u.subscription.plan === "premium" ? 2990 : 990,
              source: "user_registration",
              created_at: u.created_at || new Date().toISOString(),
              expires_at: u.subscription.expires_at
            });
          }
        }
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(subs)
      };
    }

    if (path === "/admin/stats" && event.httpMethod === "GET") {
      await getPersistentState();
      const grantedCount = Object.keys(globalPlatformConfig.granted_subscriptions || {}).length;
      const totalUsers = Math.max(1, registeredUsersList.length);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          // Dukaan keys
          users: totalUsers,
          shops: totalUsers,
          active_subscriptions: Math.max(1, grantedCount),
          pending_subscriptions: 0,
          total_revenue: 14900,
          active_trials: 0,
          starter_count: 0,
          business_count: 0,
          premium_count: Math.max(1, grantedCount),

          // NexoraOS Admin keys
          total_cafes: totalUsers,
          total_users: totalUsers,
          active_subs: Math.max(1, grantedCount),
          trial_subs: 1,
          invoice_count: 1,
          total_orders: 14
        })
      };
    }

    if (path === "/admin/cafes" && event.httpMethod === "GET") {
      await getPersistentState();
      const cafesList = [];
      for (const u of registeredUsersList) {
        cafesList.push({
          id: u.cafe_id || u.id || "cafe_main",
          name: u.store_name || `${u.name || "Owner"}'s Café`,
          owner: { email: u.email, name: u.name },
          subscription: {
            plan: "cafe",
            billing_cycle: "monthly",
            status: "active",
            expires_at: new Date(Date.now() + 365 * 86400000).toISOString()
          },
          staff_count: 2,
          order_count: 12
        });
      }
      return { statusCode: 200, headers, body: JSON.stringify(cafesList) };
    }

    if (path.startsWith("/admin/cafes/") && event.httpMethod === "GET") {
      const parts = path.split("/");
      const cafeId = parts[3];
      await getPersistentState();

      const matchedUser = registeredUsersList.find(u => (u.cafe_id === cafeId || u.id === cafeId || u.email === cafeId)) || registeredUsersList[0] || {};
      const cleanShopKey = (matchedUser.email || 'default_store').replace(/[^a-z0-9_]/g, '_');
      const store = await getCafeStore(cleanShopKey);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          cafe: store.cafe || { id: cafeId, name: matchedUser.store_name || "Nexora Café", phone: "9876543210", gstin: "27AAAAA0000A1Z5", tax_rate: 5, address: "Main High Street" },
          users: store.staff || [
            { id: "u_1", name: matchedUser.name || "Owner", email: matchedUser.email || "owner@cafe.com", role: "owner", created_at: new Date().toISOString() }
          ],
          subscriptions: [
            { id: "sub_1", plan: "cafe", billing_cycle: "monthly", status: "active", started_at: new Date().toISOString(), expires_at: new Date(Date.now() + 365 * 86400000).toISOString(), amount: 149 }
          ],
          invoices: [
            { id: "inv_1", created_at: new Date().toISOString(), label: "Café Plan Monthly", payment_id: "pay_rzp_mock_149", amount: 149 }
          ],
          orders_total: (store.orders || []).length || 12
        })
      };
    }

    if (path === "/admin/invoices" && event.httpMethod === "GET") {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify([
          { id: "inv_1", created_at: new Date().toISOString(), cafe_name: "Nexora Café", label: "Café Plan Monthly", payment_id: "pay_rzp_mock_149", amount: 149 }
        ])
      };
    }

    if (path === "/admin/invoices/export" && event.httpMethod === "GET") {
      const csv = `Date,Café,Plan,Payment ID,Amount\n${new Date().toISOString().slice(0,10)},Nexora Café,Café Plan Monthly,pay_rzp_mock_149,149\n`;
      return {
        statusCode: 200,
        headers: {
          ...headers,
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="nexoraos-invoices-${new Date().toISOString().slice(0,10)}.csv"`
        },
        body: csv
      };
    }

    if (path === "/admin/users" && event.httpMethod === "GET") {
      await getPersistentState();
      const usersMap = new Map();

      // Master Admin
      usersMap.set(ADMIN_EMAIL.toLowerCase(), {
        id: "usr_admin_master",
        name: "Super Administrator",
        email: ADMIN_EMAIL,
        is_admin: true,
        is_verified: true,
        subscription: { plan: "premium", status: "active", expires_at: new Date(Date.now() + 365 * 10 * 86400000).toISOString() },
        created_at: new Date().toISOString()
      });

      // Registered users
      for (const u of registeredUsersList) {
        if (!u || !u.email) continue;
        const em = u.email.toLowerCase().trim();
        const granted = globalPlatformConfig.granted_subscriptions?.[em];
        const queued = globalPlatformConfig.queued_subscriptions?.[em] || u.upcoming_subscription || null;
        const isFrozen = !!globalPlatformConfig.frozen_merchants?.[em];
        const isVerified = globalPlatformConfig.verified_merchants?.[em] !== undefined 
          ? globalPlatformConfig.verified_merchants[em] 
          : (u.is_verified ?? true);

        // Pick best subscription (the one with the latest expiry date)
        let bestSub = granted || u.subscription || { plan: "starter", status: "active" };
        if (granted && u.subscription?.expires_at) {
          const gExp = granted.expires_at ? new Date(granted.expires_at).getTime() : 0;
          const uExp = new Date(u.subscription.expires_at).getTime();
          if (uExp > gExp) {
            bestSub = { ...granted, ...u.subscription };
          }
        }

        usersMap.set(em, {
          ...u,
          is_admin: em === ADMIN_EMAIL.toLowerCase(),
          is_frozen: isFrozen,
          is_verified: isVerified,
          subscription: bestSub,
          upcoming_subscription: queued
        });
      }

      // Any granted subscriptions not in usersMap yet
      if (globalPlatformConfig.granted_subscriptions) {
        for (const [rawEm, sub] of Object.entries(globalPlatformConfig.granted_subscriptions)) {
          const lower = (rawEm || "").toLowerCase().trim();
          if (!lower) continue;
          if (!usersMap.has(lower)) {
            usersMap.set(lower, {
              id: `usr_${lower.replace(/[^a-z0-9]/gi, "_")}`,
              name: sub.payer_name || lower.split("@")[0],
              email: lower,
              is_admin: lower === ADMIN_EMAIL.toLowerCase(),
              is_verified: true,
              subscription: sub,
              upcoming_subscription: globalPlatformConfig.queued_subscriptions?.[lower] || null,
              created_at: sub.granted_at || new Date().toISOString()
            });
          } else {
            const existingUser = usersMap.get(lower);
            const exExp = existingUser.subscription?.expires_at ? new Date(existingUser.subscription.expires_at).getTime() : 0;
            const subExp = sub.expires_at ? new Date(sub.expires_at).getTime() : 0;
            if (subExp >= exExp) {
              existingUser.subscription = sub;
            }
          }
        }
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(Array.from(usersMap.values()))
      };
    }

    // 10B. ADMIN USERS CLOUD SYNC
    if (path === "/admin/users/sync" && event.httpMethod === "POST") {
      await getPersistentState();
      const usersToSync = Array.isArray(body.users) ? body.users : [];
      for (const u of usersToSync) {
        if (u && u.email) {
          recordRegisteredUser(u);
        }
      }
      await savePersistentState();
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true, count: registeredUsersList.length }) };
    }

    if (path === "/admin/gst-requests" && event.httpMethod === "GET") {
      await getPersistentState();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(gstRequests)
      };
    }

    if (path === "/admin/gst-requests" && event.httpMethod === "POST") {
      await getPersistentState();
      const authHeader = event.headers.authorization || event.headers.Authorization || "";
      const user = parseToken(authHeader);
      const reqRecord = {
        id: `gst_${Date.now()}`,
        shop_id: body.shop_id || (user?.shop_id || "shop_default"),
        shop_name: body.shop_name || "Apni Dukaan",
        user_email: body.email || user?.email || "merchant@officialdukaan.in",
        gstin: (body.gstin || "").trim().toUpperCase(),
        legal_name: body.legal_name || body.shop_name || "Registered Entity",
        status: "pending",
        submitted_at: new Date().toISOString()
      };
      gstRequests.unshift(reqRecord);
      await savePersistentState();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ ok: true, request: reqRecord, requests: gstRequests })
      };
    }

    if (path.startsWith("/admin/gst-requests/") && event.httpMethod === "POST") {
      await getPersistentState();
      const parts = path.split("/");
      const reqId = parts[3];
      const action = parts[4] || "approve";
      const idx = gstRequests.findIndex(r => r.id === reqId);
      if (idx >= 0) {
        gstRequests[idx].status = action === "approve" ? "approved" : "rejected";
        gstRequests[idx].processed_at = new Date().toISOString();
        if (action === "approve" && gstRequests[idx].user_email) {
          if (!globalPlatformConfig.verified_merchants) globalPlatformConfig.verified_merchants = {};
          globalPlatformConfig.verified_merchants[gstRequests[idx].user_email.toLowerCase()] = true;
        }
        await savePersistentState();
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ ok: true, message: `GST status set to ${action}`, request: gstRequests[idx] })
        };
      }
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ detail: "GST request not found" })
      };
    }

    // 11. SHOPS MANAGEMENT
    if (path === "/shops" && event.httpMethod === "GET") {
      const authHeader = event.headers.authorization || event.headers.Authorization || "";
      const user = parseToken(authHeader);
      const uName = user?.name || "My";
      const defaultShop = {
        id: "shop_main",
        name: `${uName}'s Store`,
        owner_name: uName,
        phone: user?.phone || "",
        address: "India",
        upi_id: "",
        store_category: "General Store",
        gst_status: "pending",
        gst_enabled: false,
        financial_year: "2026-27",
        store_active: true
      };
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify([defaultShop])
      };
    }

    if (path === "/shops" && event.httpMethod === "POST") {
      const newShop = {
        id: `shop_${Date.now()}`,
        ...body,
        store_active: true
      };
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(newShop)
      };
    }

    if (path.startsWith("/shops/") && (event.httpMethod === "PUT" || event.httpMethod === "POST")) {
      const shopId = path.replace("/shops/", "");
      const updatedShop = {
        id: shopId,
        ...body
      };
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(updatedShop)
      };
    }

    if (path.startsWith("/shops/") && event.httpMethod === "GET") {
      const shopId = path.replace("/shops/", "");
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ id: shopId, name: "Apni Dukaan" })
      };
    }

    // 11.9 LANDING PAGE MAINTENANCE (Public & Admin Synced)
    if (path === "/platform/landing-maintenance" && event.httpMethod === "GET") {
      await getPersistentState();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          ok: true,
          landing_maintenance: globalPlatformConfig.landing_maintenance || {
            enabled: false,
            ends_at: null,
            message: "We are currently deploying scheduled platform upgrades with 0 downtime. Dukaan will resume in a few moments.",
            title: "Scheduled System Maintenance"
          },
          announcement: globalPlatformConfig.announcement || ""
        })
      };
    }

    if (path === "/platform/landing-maintenance" && event.httpMethod === "POST") {
      await getPersistentState();
      if (body && typeof body === "object") {
        if (body.landing_maintenance && typeof body.landing_maintenance === "object") {
          globalPlatformConfig.landing_maintenance = {
            ...(globalPlatformConfig.landing_maintenance || {}),
            ...body.landing_maintenance
          };
        } else {
          globalPlatformConfig.landing_maintenance = {
            ...(globalPlatformConfig.landing_maintenance || {}),
            ...body
          };
        }
        if (typeof body.announcement === "string") {
          globalPlatformConfig.announcement = body.announcement;
        }
      }
      globalPlatformConfig.ota_version = (globalPlatformConfig.ota_version || 1) + 1;
      globalPlatformConfig.updated_at = new Date().toISOString();
      await savePersistentState();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          ok: true,
          landing_maintenance: globalPlatformConfig.landing_maintenance,
          announcement: globalPlatformConfig.announcement
        })
      };
    }

    // 12. PLATFORM CONFIG (Maintenance, Dynamic Pricing, Branding, OTA, Emergency Switch)
    if (path === "/platform/config" && event.httpMethod === "GET") {
      await getPersistentState();
      if (globalPlatformConfig.pricing?.starter?.monthly === 499 || globalPlatformConfig.pricing?.business?.monthly === 999 || globalPlatformConfig.pricing?.premium?.monthly === 1999) {
        globalPlatformConfig.pricing = {
          starter: { monthly: 79, yearly: 799 },
          business: { monthly: 119, yearly: 1199 },
          premium: { monthly: 239, yearly: 2239 },
          pro: { monthly: 499, yearly: 4999 }
        };
      }
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(globalPlatformConfig)
      };
    }

    if (path === "/platform/config" && event.httpMethod === "POST") {
      await getPersistentState();
      let modeChanged = false;
      if (typeof body.maintenance_mode === "boolean") {
        if (globalPlatformConfig.maintenance_mode !== body.maintenance_mode) {
          modeChanged = true;
        }
        globalPlatformConfig.maintenance_mode = body.maintenance_mode;
      }
      if (typeof body.announcement === "string") {
        globalPlatformConfig.announcement = body.announcement;
      }
      if (body.landing_maintenance && typeof body.landing_maintenance === "object") {
        globalPlatformConfig.landing_maintenance = {
          ...(globalPlatformConfig.landing_maintenance || {}),
          ...body.landing_maintenance
        };
      }
      if (body.pricing && typeof body.pricing === "object") {
        globalPlatformConfig.pricing = { ...globalPlatformConfig.pricing, ...body.pricing };
      }
      if (typeof body.trial_days === "number") {
        globalPlatformConfig.trial_days = body.trial_days;
      }
      if (typeof body.receipt_branding_enabled === "boolean") {
        globalPlatformConfig.receipt_branding_enabled = body.receipt_branding_enabled;
      }
      if (typeof body.payment_alert_chime === "boolean") {
        globalPlatformConfig.payment_alert_chime = body.payment_alert_chime;
      }
      if (typeof body.kill_switch_active === "boolean") {
        globalPlatformConfig.kill_switch_active = body.kill_switch_active;
        globalPlatformConfig.kill_switch_at = body.kill_switch_active ? new Date().toISOString() : null;
      }

      // Auto-bump OTA version on maintenance mode or announcement updates so merchants immediately reload / react!
      if (modeChanged || body.announcement !== undefined || typeof body.kill_switch_active === "boolean") {
        globalPlatformConfig.ota_version = (globalPlatformConfig.ota_version || 1) + 1;
      }

      globalPlatformConfig.updated_at = new Date().toISOString();
      await savePersistentState();

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ ok: true, config: globalPlatformConfig })
      };
    }

    // 13. OTA FORCE UPDATE
    if (path === "/platform/force-update" && event.httpMethod === "POST") {
      await getPersistentState();
      globalPlatformConfig.ota_version = (globalPlatformConfig.ota_version || 1) + 1;
      globalPlatformConfig.updated_at = new Date().toISOString();
      await savePersistentState();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ ok: true, ota_version: globalPlatformConfig.ota_version, timestamp: globalPlatformConfig.updated_at })
      };
    }

    // 14. EMERGENCY SESSION KILL SWITCH
    if (path === "/platform/kill-switch" && event.httpMethod === "POST") {
      await getPersistentState();
      if (typeof body.kill_switch_active === "boolean") {
        globalPlatformConfig.kill_switch_active = body.kill_switch_active;
      } else {
        globalPlatformConfig.kill_switch_active = !globalPlatformConfig.kill_switch_active;
      }
      globalPlatformConfig.kill_switch_at = globalPlatformConfig.kill_switch_active ? new Date().toISOString() : null;
      globalPlatformConfig.ota_version = (globalPlatformConfig.ota_version || 1) + 1;
      await savePersistentState();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ ok: true, active: globalPlatformConfig.kill_switch_active, kill_switch_at: globalPlatformConfig.kill_switch_at })
      };
    }

    
    // 16. CAREERS & HIRING PORTAL ENGINE
    if (path === "/careers/check" && event.httpMethod === "POST") {
      await getCareersPersistentState(true);
      jobApplications = deduplicateJobApplications(jobApplications);
      const email = (body.email || "").trim().toLowerCase();
      const phone = (body.phone || "").trim().replace(/\D/g, "");
      
      const app = jobApplications.find(a => {
        const aEmail = (a.email || "").trim().toLowerCase();
        const aPhone = (a.phone || "").trim().replace(/\D/g, "");
        return (email && aEmail === email) || (phone && aPhone.endsWith(phone.slice(-10)));
      });

      if (app) {
        return { statusCode: 200, headers, body: JSON.stringify({ exists: true, application: app }) };
      }
      return { statusCode: 200, headers, body: JSON.stringify({ exists: false }) };
    }

    if (path === "/careers/apply" && event.httpMethod === "POST") {
      await getCareersPersistentState();
      const email = (body.email || "").trim().toLowerCase();
      const phone = (body.phone || "").trim().replace(/\D/g, "");
      const name = (body.name || "").trim();

      if (!name || !email || !phone) {
        return { statusCode: 400, headers, body: JSON.stringify({ detail: "Name, email, and phone number are required." }) };
      }

      const newApp = {
        id: body.id || "APP-" + Date.now().toString().slice(-6),
        name,
        email,
        phone,
        whatsapp: (body.whatsapp || phone).trim(),
        role: body.role || "Field Sales Intern",
        city: body.city || "Navsari",
        address: body.address || "",
        dob: body.dob || "",
        gender: body.gender || "",
        education: body.education || "12th Pass",
        institute: body.institute || "",
        aadhar_number: body.aadhar_number || "",
        aadhar_doc: body.aadhar_doc || "",
        marksheet_doc: body.marksheet_doc || "",
        resume_doc: body.resume_doc || "",
        portfolio_url: body.portfolio_url || "",
        why_hire: body.why_hire || "",
        status: body.status || "under_review",
        admin_note: body.admin_note || "",
        created_at: body.created_at || new Date().toISOString(),
        reviewed_at: body.reviewed_at || null
      };

      const existingIdx = jobApplications.findIndex(a => 
        (a.email && a.email.toLowerCase().trim() === email) || 
        (a.phone && a.phone.replace(/\D/g, "").endsWith(phone.slice(-10)))
      );
      if (existingIdx >= 0) {
        // If already reviewed (approved/denied) by admin, preserve that status!
        const curStatus = jobApplications[existingIdx].status;
        if ((curStatus === "approved" || curStatus === "denied") && newApp.status === "under_review") {
          newApp.status = curStatus;
          newApp.reviewed_at = jobApplications[existingIdx].reviewed_at;
          newApp.admin_note = jobApplications[existingIdx].admin_note;
        }
        jobApplications[existingIdx] = { ...jobApplications[existingIdx], ...newApp };
      } else {
        jobApplications.unshift(newApp);
      }

      jobApplications = deduplicateJobApplications(jobApplications);
      await saveCareersPersistentState();
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true, application: newApp }) };
    }

    if (path === "/admin/careers/applications" && event.httpMethod === "GET") {
      await getCareersPersistentState(true);
      jobApplications = deduplicateJobApplications(jobApplications);
      return { statusCode: 200, headers, body: JSON.stringify(jobApplications) };
    }

    if (path === "/admin/careers/status" && event.httpMethod === "POST") {
      await getCareersPersistentState();
      const { id, email, phone, status, admin_note, aadhar_number, name } = body;
      const cleanEmail = (email || "").trim().toLowerCase();
      const cleanPhone = (phone || "").trim().replace(/\D/g, "");

      // Find all matching applications by id OR email OR phone
      let matchedIndices = [];
      jobApplications.forEach((a, i) => {
        const aEmail = (a.email || "").trim().toLowerCase();
        const aPhone = (a.phone || "").trim().replace(/\D/g, "");
        if (id && a.id === id) matchedIndices.push(i);
        else if (cleanEmail && aEmail && aEmail === cleanEmail) matchedIndices.push(i);
        else if (cleanPhone && aPhone && aPhone.endsWith(cleanPhone.slice(-10))) matchedIndices.push(i);
      });

      if (matchedIndices.length === 0) {
        // Candidate not found in memory yet: create / upsert!
        if (cleanEmail || cleanPhone || name) {
          const newApp = {
            id: id || "APP-" + Date.now().toString().slice(-6),
            name: name || "Candidate",
            email: cleanEmail || "candidate@dukaan.in",
            phone: cleanPhone || "7016430577",
            whatsapp: body.whatsapp || cleanPhone || "7016430577",
            role: body.role || "Field Sales Intern",
            city: body.city || "Bardoli",
            address: body.address || "",
            education: body.education || "12th Pass",
            aadhar_number: aadhar_number || "",
            aadhar_doc: body.aadhar_doc || "",
            marksheet_doc: body.marksheet_doc || "",
            resume_doc: body.resume_doc || "",
            status: status || "under_review",
            admin_note: admin_note || "",
            created_at: body.created_at || new Date().toISOString(),
            reviewed_at: new Date().toISOString()
          };
          jobApplications.unshift(newApp);
          matchedIndices.push(0);
        } else {
          return { statusCode: 404, headers, body: JSON.stringify({ detail: "Application not found." }) };
        }
      }

      // Update ALL matched records
      matchedIndices.forEach(idx => {
        jobApplications[idx].status = status || "under_review";
        if (admin_note !== undefined) jobApplications[idx].admin_note = admin_note;
        jobApplications[idx].reviewed_at = new Date().toISOString();
        if (id) jobApplications[idx].id = id;
        if (aadhar_number) jobApplications[idx].aadhar_number = aadhar_number;
        if (name) jobApplications[idx].name = name;
        if (body.education) jobApplications[idx].education = body.education;
        if (body.role) jobApplications[idx].role = body.role;
        if (body.city) jobApplications[idx].city = body.city;
      });

      jobApplications = deduplicateJobApplications(jobApplications);
      await saveCareersPersistentState();

      const updated = jobApplications.find(a => 
        (id && a.id === id) || 
        (cleanEmail && (a.email || "").toLowerCase().trim() === cleanEmail) ||
        (cleanPhone && (a.phone || "").replace(/\D/g, "").endsWith(cleanPhone.slice(-10)))
      ) || jobApplications[0];

      return { statusCode: 200, headers, body: JSON.stringify({ ok: true, application: updated }) };
    }

    // 15. PROMO & COUPON CODES ENGINE (Cloud-synced & live across checkout)
    if ((path === "/promo-codes" || path === "/admin/coupon-codes") && event.httpMethod === "GET") {
      await getPersistentState();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(promoCodes)
      };
    }

    if ((path === "/promo-codes" || path === "/admin/coupon-codes") && event.httpMethod === "POST") {
      await getPersistentState();
      const codeUpper = (body.code || "").trim().toUpperCase();
      if (!codeUpper) {
        return { statusCode: 400, headers, body: JSON.stringify({ detail: "Coupon code name is required." }) };
      }
      const discountType = body.discount_type === "flat" ? "flat" : "percent";
      const existingIdx = promoCodes.findIndex(p => p.code === codeUpper);
      const newPromo = {
        code: codeUpper,
        discount_type: discountType,
        discount_percent: discountType === "percent" ? (Number(body.discount_percent) || 20) : 0,
        discount_flat: discountType === "flat" ? (Number(body.discount_flat) || Number(body.discount_amount) || 100) : 0,
        max_discount: Number(body.max_discount) || 500,
        min_amount: Number(body.min_amount) || 0,
        max_uses: Number(body.max_uses) || 500,
        usage_count: existingIdx >= 0 ? (promoCodes[existingIdx].usage_count || 0) : 0,
        active: body.active !== undefined ? !!body.active : true,
        expires_at: body.expires_at || "2027-12-31",
        created_at: existingIdx >= 0 ? (promoCodes[existingIdx].created_at || new Date().toISOString()) : new Date().toISOString()
      };
      if (existingIdx >= 0) {
        promoCodes[existingIdx] = newPromo;
      } else {
        promoCodes.unshift(newPromo);
      }
      globalPlatformConfig.promo_codes = promoCodes;
      globalPlatformConfig.ota_version = (globalPlatformConfig.ota_version || 1) + 1;
      await savePersistentState();
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true, promo: newPromo, promoCodes }) };
    }

    if (path.startsWith("/promo-codes/") && event.httpMethod === "DELETE") {
      await getPersistentState();
      const codeToDelete = decodeURIComponent(path.replace("/promo-codes/", "")).trim().toUpperCase();
      promoCodes = promoCodes.filter(p => p.code !== codeToDelete);
      globalPlatformConfig.promo_codes = promoCodes;
      globalPlatformConfig.ota_version = (globalPlatformConfig.ota_version || 1) + 1;
      await savePersistentState();
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true, deleted: codeToDelete, promoCodes }) };
    }

    if ((path === "/admin/coupon-codes/sync" || path === "/promo-codes/sync") && event.httpMethod === "POST") {
      await getPersistentState();
      if (Array.isArray(body.promo_codes)) {
        promoCodes = body.promo_codes;
        globalPlatformConfig.promo_codes = promoCodes;
        globalPlatformConfig.ota_version = (globalPlatformConfig.ota_version || 1) + 1;
        await savePersistentState();
        return { statusCode: 200, headers, body: JSON.stringify({ ok: true, promoCodes }) };
      }
      return { statusCode: 400, headers, body: JSON.stringify({ detail: "Invalid promo_codes array" }) };
    }

    if (path === "/promo-codes/validate" && event.httpMethod === "POST") {
      await getPersistentState();
      const codeUpper = (body.code || "").trim().toUpperCase();
      const amount = Number(body.amount) || 0;
      const promo = promoCodes.find(p => p.code === codeUpper);
      if (!promo) {
        return { statusCode: 400, headers, body: JSON.stringify({ valid: false, detail: "Invalid coupon code." }) };
      }
      if (!promo.active) {
        return { statusCode: 400, headers, body: JSON.stringify({ valid: false, detail: "This coupon code is currently paused or inactive." }) };
      }
      if (promo.expires_at && new Date(promo.expires_at).getTime() < Date.now()) {
        return { statusCode: 400, headers, body: JSON.stringify({ valid: false, detail: "This coupon code has expired." }) };
      }
      if (promo.max_uses && (promo.usage_count || 0) >= promo.max_uses) {
        return { statusCode: 400, headers, body: JSON.stringify({ valid: false, detail: "This coupon has reached its maximum redemption limit." }) };
      }
      if (amount < promo.min_amount) {
        return { statusCode: 400, headers, body: JSON.stringify({ valid: false, detail: `Minimum order amount for this code is ₹${promo.min_amount}.` }) };
      }

      let discount = 0;
      if (promo.discount_type === "flat") {
        discount = Math.min(amount, promo.discount_flat || 0);
      } else {
        const perc = Number(promo.discount_percent) || 0;
        discount = Math.min((amount * perc) / 100, promo.max_discount || amount);
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          valid: true,
          code: promo.code,
          discount_type: promo.discount_type || "percent",
          discount_percent: promo.discount_percent || 0,
          discount_flat: promo.discount_flat || 0,
          discount_amount: Math.round(discount),
          final_amount: Math.max(0, Math.round(amount - discount))
        })
      };
    }

    // 16. IN-APP CUSTOMER SUPPORT DESK
    if (path === "/support/tickets" && event.httpMethod === "GET") {
      await getPersistentState();
      return { statusCode: 200, headers, body: JSON.stringify(supportTickets) };
    }

    if (path === "/support/tickets" && event.httpMethod === "POST") {
      await getPersistentState();
      const authHeader = event.headers.authorization || event.headers.Authorization || "";
      const user = parseToken(authHeader);
      const newTicket = {
        id: `TCK_${Date.now().toString().slice(-4)}`,
        merchant_name: body.merchant_name || user?.name || "Merchant",
        merchant_email: body.merchant_email || user?.email || "merchant@store.in",
        phone: body.phone || user?.phone || "",
        subject: body.subject || "General Dukaan Query",
        priority: body.priority || "medium",
        status: "open",
        message: body.message || "",
        created_at: new Date().toISOString()
      };
      supportTickets.unshift(newTicket);
      await savePersistentState();
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true, ticket: newTicket }) };
    }

    if (path.startsWith("/support/tickets/") && (event.httpMethod === "PUT" || event.httpMethod === "POST")) {
      await getPersistentState();
      const ticketId = path.replace("/support/tickets/", "").replace("/status", "");
      const idx = supportTickets.findIndex(t => t.id === ticketId);
      if (idx >= 0) {
        if (body.status) supportTickets[idx].status = body.status;
        if (body.admin_note) supportTickets[idx].admin_note = body.admin_note;
        await savePersistentState();
        return { statusCode: 200, headers, body: JSON.stringify({ ok: true, ticket: supportTickets[idx] }) };
      }
      return { statusCode: 404, headers, body: JSON.stringify({ detail: "Ticket not found" }) };
    }

    // 17. MERCHANT FEEDBACK & NPS RATING WALL
    if (path === "/merchant/feedback" && event.httpMethod === "GET") {
      await getPersistentState();
      return { statusCode: 200, headers, body: JSON.stringify(merchantFeedbacks) };
    }

    if (path === "/merchant/feedback" && event.httpMethod === "POST") {
      await getPersistentState();
      const authHeader = event.headers.authorization || event.headers.Authorization || "";
      const user = parseToken(authHeader);
      const newFeedback = {
        id: `fb_${Date.now()}`,
        merchant_name: body.merchant_name || user?.name || "Verified Merchant",
        shop_name: body.shop_name || "Apni Dukaan",
        rating: Math.min(5, Math.max(1, Number(body.rating) || 5)),
        comment: (body.comment || "").trim(),
        created_at: new Date().toISOString()
      };
      merchantFeedbacks.unshift(newFeedback);
      await savePersistentState();
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true, feedback: newFeedback }) };
    }

    // 18. REFERRAL & PARTNER PROGRAM HUB
    if (path === "/admin/referrals" && event.httpMethod === "GET") {
      await getPersistentState();
      return { statusCode: 200, headers, body: JSON.stringify(referralCodes) };
    }

    if (path === "/admin/referrals/approve" && event.httpMethod === "POST") {
      await getPersistentState();
      const { id } = body;
      const item = referralCodes.find(r => r.id === id);
      if (item) {
        item.status = "approved";
        await savePersistentState();
        return { statusCode: 200, headers, body: JSON.stringify({ ok: true, referral: item }) };
      }
      return { statusCode: 404, headers, body: JSON.stringify({ detail: "Referral not found" }) };
    }

    // 19. RAZORPAY INSTANT PAYMENT RE-SYNC
    if (path === "/admin/payment-resync" && event.httpMethod === "POST") {
      const paymentId = (body.payment_id || "").trim();
      const email = (body.email || "").trim().toLowerCase();
      const plan = body.plan || "business";
      if (!paymentId || !email) {
        return { statusCode: 400, headers, body: JSON.stringify({ detail: "Payment ID and merchant email are required." }) };
      }
      const syncRecord = {
        id: `sub_resync_${Date.now()}`,
        user_email: email,
        payer_name: email.split("@")[0],
        plan,
        status: "active",
        amount: plan === "premium" ? 2990 : 999,
        payment_id: paymentId,
        source: "razorpay_resync",
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 365 * 86400000).toISOString()
      };
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          ok: true,
          message: `Payment ${paymentId} successfully synced and plan ${plan.toUpperCase()} activated for 365 days.`,
          subscription: syncRecord
        })
      };
    }

    // 20. PUBLIC ONLINE STORE DIRECTORY (/stores)
    if (path === "/stores" && event.httpMethod === "GET") {
      const publicStores = [
        {
          id: "store_1",
          name: "Yug Super Mart & FMCG",
          owner: "Priyen Yug",
          category: "Grocery & Kirana",
          city: "Navsari",
          state: "Gujarat",
          phone: "919876543210",
          verified: true,
          rating: 4.9,
          items_count: 420,
          catalog_preview: ["Amul Butter", "Tata Salt", "Maggi 70g", "Fortune Oil"]
        },
        {
          id: "store_2",
          name: "Sharma Daily Needs & Dairy",
          owner: "Rajesh Sharma",
          category: "General Store",
          city: "Mumbai",
          state: "Maharashtra",
          phone: "919123456780",
          verified: true,
          rating: 4.8,
          items_count: 310,
          catalog_preview: ["Parle-G", "Britannia Good Day", "Dettol Soap"]
        },
        {
          id: "store_3",
          name: "Sanjivani Medicos & Pharmacy",
          owner: "Dr. Sandeep Mehta",
          category: "Medical Store & Pharmacy",
          city: "Jaipur",
          state: "Rajasthan",
          phone: "919822334455",
          verified: true,
          rating: 5.0,
          items_count: 560,
          catalog_preview: ["Paracetamol 650mg", "Azithromycin 500mg", "Dabur Chyawanprash"]
        },
        {
          id: "store_4",
          name: "Balaji Provisions & Wholesale",
          owner: "Venkatesh Rao",
          category: "Supermarket",
          city: "Bengaluru",
          state: "Karnataka",
          phone: "919744112233",
          verified: true,
          rating: 4.7,
          items_count: 890,
          catalog_preview: ["Aashirvaad Atta 10kg", "Red Label Tea 500g", "Surf Excel 1kg"]
        }
      ];
      return { statusCode: 200, headers, body: JSON.stringify(publicStores) };
    }

    // 21. HARDWARE SOUNDBOX & QR STANDEES
    if (path === "/admin/soundbox" && event.httpMethod === "GET") {
      await getPersistentState();
      return { statusCode: 200, headers, body: JSON.stringify(globalPlatformConfig.soundbox_devices || []) };
    }

    if (path === "/admin/soundbox" && event.httpMethod === "POST") {
      await getPersistentState();
      const newDev = {
        id: `SND_${Date.now().toString().slice(-4)}`,
        serial: body.serial || `DUK-SB-${Math.floor(10000 + Math.random() * 90000)}`,
        model: body.model || "4G 3W Audio Soundbox",
        shop_name: body.shop_name || "New Dukaan",
        battery: "100%",
        status: body.status || "online",
        sim: body.sim || "Jio IoT",
        assigned_email: (body.assigned_email || body.email || "").trim().toLowerCase(),
        created_at: new Date().toISOString()
      };
      if (!globalPlatformConfig.soundbox_devices) globalPlatformConfig.soundbox_devices = [];
      globalPlatformConfig.soundbox_devices.push(newDev);
      await savePersistentState();
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true, device: newDev, devices: globalPlatformConfig.soundbox_devices }) };
    }

    // 22. CUSTOM DOMAINS / WHITE-LABEL DNS
    if (path === "/admin/custom-domains" && event.httpMethod === "GET") {
      await getPersistentState();
      return { statusCode: 200, headers, body: JSON.stringify(globalPlatformConfig.custom_domains || []) };
    }

    if (path === "/admin/custom-domains" && event.httpMethod === "POST") {
      await getPersistentState();
      const authHeader = event.headers.authorization || event.headers.Authorization || "";
      const user = parseToken(authHeader);
      const newDomain = {
        id: `cd_${Date.now()}`,
        user_email: body.user_email || user?.email || "merchant@store.in",
        shop_name: body.shop_name || "My Store",
        domain: (body.domain || "").trim().toLowerCase(),
        status: "pending_dns",
        ssl: "provisioning",
        cname_target: "custom.officialdukaan.in",
        created_at: new Date().toISOString()
      };
      if (!globalPlatformConfig.custom_domains) globalPlatformConfig.custom_domains = [];
      globalPlatformConfig.custom_domains.push(newDomain);
      await savePersistentState();
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true, domain: newDomain }) };
    }

    if (path.startsWith("/admin/custom-domains/") && event.httpMethod === "POST") {
      await getPersistentState();
      const domainId = path.split("/")[3];
      const idx = (globalPlatformConfig.custom_domains || []).findIndex(d => d.id === domainId);
      if (idx >= 0) {
        globalPlatformConfig.custom_domains[idx].status = body.status || "active";
        globalPlatformConfig.custom_domains[idx].ssl = "active";
        await savePersistentState();
        return { statusCode: 200, headers, body: JSON.stringify({ ok: true, domain: globalPlatformConfig.custom_domains[idx] }) };
      }
      return { statusCode: 404, headers, body: JSON.stringify({ detail: "Domain record not found" }) };
    }

    
    // ==========================================
    // 23. PRODUCTS CRUD & MULTI-DEVICE SYNC
    // ==========================================
    if ((path === "/products" || path === "/products/") && event.httpMethod === "GET") {
      const authHeader = event.headers.authorization || event.headers.Authorization || "";
      const user = parseToken(authHeader);
      const shopKey = getShopKey(event, user);
      const isNexora = isNexoraRequest(event, path);
      const store = isNexora ? await getCafeStore(shopKey) : await getShopStore(shopKey);

      const q = (event.queryStringParameters?.q || "").toLowerCase().trim();
      const category = (event.queryStringParameters?.category || "").toLowerCase().trim();

      let list = store.products || [];
      if (q) {
        list = list.filter(p => (p.name || "").toLowerCase().includes(q) || (p.category || "").toLowerCase().includes(q) || (p.barcode && p.barcode.includes(q)));
      }
      if (category && category !== "all") {
        list = list.filter(p => (p.category || "").toLowerCase() === category || p.category_id === category);
      }
      return { statusCode: 200, headers, body: JSON.stringify(list) };
    }

    if (path === "/products/bulk-sync" && event.httpMethod === "POST") {
      const authHeader = event.headers.authorization || event.headers.Authorization || "";
      const user = parseToken(authHeader);
      const shopKey = getShopKey(event, user);
      const isNexora = isNexoraRequest(event, path);
      const store = isNexora ? await getCafeStore(shopKey) : await getShopStore(shopKey);

      const incoming = Array.isArray(body.products) ? body.products : [];
      if (incoming.length > 0) {
        const existingIds = new Set((store.products || []).map(p => p.id));
        const merged = [...(store.products || [])];
        for (const p of incoming) {
          if (p && p.name && !existingIds.has(p.id)) {
            merged.push(p);
            existingIds.add(p.id);
          }
        }
        store.products = merged;
        if (isNexora) await saveCafeStore(shopKey, store);
        else await saveShopStore(shopKey, store);
      }
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true, count: store.products.length, products: store.products }) };
    }

    if ((path === "/products" || path === "/products/") && event.httpMethod === "POST") {
      const authHeader = event.headers.authorization || event.headers.Authorization || "";
      const user = parseToken(authHeader);
      const shopKey = getShopKey(event, user);
      const isNexora = isNexoraRequest(event, path);
      const store = isNexora ? await getCafeStore(shopKey) : await getShopStore(shopKey);

      const priceVal = Number(body.price !== undefined ? body.price : (body.selling_price || 0));
      const newProd = {
        id: body.id || ('prod_' + Date.now() + '_' + Math.floor(100 + Math.random() * 900)),
        name: (body.name || "New Product").trim(),
        category_id: body.category_id || "",
        category: body.category || "General",
        price: priceVal,
        selling_price: priceVal,
        purchase_price: Number(body.purchase_price || body.costPrice || 0),
        stock: body.unlimited_stock ? 0 : Number(body.stock || 0),
        min_stock: Number(body.min_stock || 5),
        unlimited_stock: Boolean(body.unlimited_stock),
        prep_time: Number(body.prep_time || 5),
        available: body.available !== false,
        barcode: body.barcode ? String(body.barcode).trim() : "",
        batch_number: body.batch_number ? String(body.batch_number).trim() : "",
        expiry_date: body.expiry_date ? String(body.expiry_date).trim() : "",
        created_at: new Date().toISOString()
      };

      store.products = [newProd, ...(store.products || []).filter(p => p.id !== newProd.id)];
      if (isNexora) await saveCafeStore(shopKey, store);
      else await saveShopStore(shopKey, store);
      return { statusCode: 200, headers, body: JSON.stringify(newProd) };
    }

    if (path.startsWith("/products/") && path.endsWith("/stock") && event.httpMethod === "POST") {
      const authHeader = event.headers.authorization || event.headers.Authorization || "";
      const user = parseToken(authHeader);
      const shopKey = getShopKey(event, user);
      const isNexora = isNexoraRequest(event, path);
      const store = isNexora ? await getCafeStore(shopKey) : await getShopStore(shopKey);

      const parts = path.split("/");
      const prodId = parts[2];
      const delta = Number(body.qty || 0);
      const idx = (store.products || []).findIndex(p => p.id === prodId);
      if (idx >= 0) {
        store.products[idx].stock = Math.max(0, Number(store.products[idx].stock || 0) + delta);
        store.products[idx].updated_at = new Date().toISOString();
        if (isNexora) await saveCafeStore(shopKey, store);
        else await saveShopStore(shopKey, store);
        return { statusCode: 200, headers, body: JSON.stringify({ ok: true, product: store.products[idx] }) };
      }
      return { statusCode: 404, headers, body: JSON.stringify({ detail: "Product not found" }) };
    }

    if (path.startsWith("/products/") && !path.includes("/stock") && (event.httpMethod === "PUT" || event.httpMethod === "POST" || event.httpMethod === "PATCH")) {
      const authHeader = event.headers.authorization || event.headers.Authorization || "";
      const user = parseToken(authHeader);
      const shopKey = getShopKey(event, user);
      const isNexora = isNexoraRequest(event, path);
      const store = isNexora ? await getCafeStore(shopKey) : await getShopStore(shopKey);

      const parts = path.split("/");
      const prodId = parts[2];
      const idx = (store.products || []).findIndex(p => p.id === prodId);
      if (idx >= 0) {
        const mergedProd = { ...store.products[idx], ...body, id: prodId, updated_at: new Date().toISOString() };
        if (mergedProd.price !== undefined && mergedProd.selling_price === undefined) mergedProd.selling_price = mergedProd.price;
        if (mergedProd.selling_price !== undefined && mergedProd.price === undefined) mergedProd.price = mergedProd.selling_price;
        store.products[idx] = mergedProd;
        if (isNexora) await saveCafeStore(shopKey, store);
        else await saveShopStore(shopKey, store);
        return { statusCode: 200, headers, body: JSON.stringify(store.products[idx]) };
      } else {
        const newProd = { id: prodId, ...body, updated_at: new Date().toISOString() };
        if (newProd.price !== undefined && newProd.selling_price === undefined) newProd.selling_price = newProd.price;
        if (newProd.selling_price !== undefined && newProd.price === undefined) newProd.price = newProd.selling_price;
        store.products = [newProd, ...(store.products || [])];
        if (isNexora) await saveCafeStore(shopKey, store);
        else await saveShopStore(shopKey, store);
        return { statusCode: 200, headers, body: JSON.stringify(newProd) };
      }
    }

    if (path.startsWith("/products/") && event.httpMethod === "DELETE") {
      const authHeader = event.headers.authorization || event.headers.Authorization || "";
      const user = parseToken(authHeader);
      const shopKey = getShopKey(event, user);
      const isNexora = isNexoraRequest(event, path);
      const store = isNexora ? await getCafeStore(shopKey) : await getShopStore(shopKey);

      const parts = path.split("/");
      const prodId = parts[2];
      store.products = (store.products || []).filter(p => p.id !== prodId);
      if (isNexora) await saveCafeStore(shopKey, store);
      else await saveShopStore(shopKey, store);
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true, id: prodId }) };
    }

    // ==========================================
    // 24. ORDERS & INVOICES
    // ==========================================
    if (path === "/orders" && event.httpMethod === "GET") {
      const authHeader = event.headers.authorization || event.headers.Authorization || "";
      const user = parseToken(authHeader);
      const shopKey = getShopKey(event, user);
      const isNexora = isNexoraRequest(event, path);
      const store = isNexora ? await getCafeStore(shopKey) : await getShopStore(shopKey);

      const status = event.queryStringParameters?.status;
      const payment = event.queryStringParameters?.payment_method;
      const q = (event.queryStringParameters?.q || "").toLowerCase().trim();
      const limit = parseInt(event.queryStringParameters?.limit || "100", 10);

      let orders = store.orders || [];
      if (status && status !== "all") {
        orders = orders.filter(o => o.status === status);
      }
      if (payment && payment !== "all") {
        orders = orders.filter(o => o.payment_method === payment);
      }
      if (q) {
        orders = orders.filter(o => (o.order_no && o.order_no.toLowerCase().includes(q)) || (o.customer_name && o.customer_name.toLowerCase().includes(q)) || (o.customer_phone && o.customer_phone.includes(q)));
      }
      return { statusCode: 200, headers, body: JSON.stringify(orders.slice(0, limit)) };
    }

    if (path === "/orders" && event.httpMethod === "POST") {
      const authHeader = event.headers.authorization || event.headers.Authorization || "";
      const user = parseToken(authHeader);
      const shopKey = getShopKey(event, user);
      const isNexora = isNexoraRequest(event, path);
      const store = isNexora ? await getCafeStore(shopKey) : await getShopStore(shopKey);

      const items = Array.isArray(body.items) ? body.items : [];
      const discount = Number(body.discount || 0);
      const subtotal = items.reduce((acc, it) => acc + (Number(it.price || it.selling_price || 0) * Number(it.qty || 1)), 0);
      const taxRate = Number(body.tax_rate || 0);
      const tax = (Math.max(0, subtotal - discount) * taxRate) / 100;
      const total = body.total !== undefined ? Number(body.total) : Math.round((Math.max(0, subtotal - discount + tax)) * 100) / 100;
      const payment_method = body.payment_method || null;
      const customer_id = body.customer_id || null;

      const orderNo = body.order_no || ('OD-' + Math.floor(1000 + Math.random() * 9000));
      const initialStatus = body.status || (payment_method === "udhaar" ? "udhaar" : (!payment_method || payment_method === "pending" ? "received" : "paid"));

      const newOrder = {
        id: body.id || ('ord_' + Date.now() + '_' + Math.floor(100 + Math.random() * 900)),
        order_no: orderNo,
        total,
        subtotal,
        discount,
        tax,
        tax_rate: taxRate,
        payment_method: payment_method || "cash",
        payment_splits: body.payment_splits || null,
        order_type: body.order_type || "dine_in",
        table_id: body.table_id || null,
        status: initialStatus,
        customer_id,
        customer_name: body.customer_name || "Walk-in Customer",
        customer_phone: body.customer_phone || "",
        items,
        amount_received: body.amount_received !== undefined ? Number(body.amount_received) : total,
        change: payment_method === "cash" && Number(body.amount_received) > total ? Number(body.amount_received) - total : 0,
        created_at: new Date().toISOString()
      };

      if (body.table_id && Array.isArray(store.tables)) {
        const tbl = store.tables.find(t => t.id === body.table_id || String(t.number) === body.table_id);
        if (tbl) {
          tbl.status = "occupied";
          tbl.occupied_at = new Date().toISOString();
        }
      }

      for (const item of items) {
        const pIdx = (store.products || []).findIndex(p => p.id === (item.product_id || item.id));
        if (pIdx >= 0 && !store.products[pIdx].unlimited_stock) {
          store.products[pIdx].stock = Math.max(0, Number(store.products[pIdx].stock || 0) - Number(item.qty || 1));
        }
      }

      if (customer_id || (body.customer_phone && body.customer_name)) {
        const cIdx = (store.customers || []).findIndex(c => c.id === customer_id || (body.customer_phone && c.phone === body.customer_phone));
        const isUdhaar = payment_method === "udhaar";
        if (cIdx >= 0) {
          store.customers[cIdx].total_purchases = Number(store.customers[cIdx].total_purchases || 0) + total;
          store.customers[cIdx].total_paid = Number(store.customers[cIdx].total_paid || 0) + (isUdhaar ? 0 : total);
          store.customers[cIdx].total_pending = Number(store.customers[cIdx].total_pending || 0) + (isUdhaar ? total : 0);
          store.customers[cIdx].updated_at = new Date().toISOString();
          newOrder.customer_name = store.customers[cIdx].name;
          newOrder.customer_phone = store.customers[cIdx].phone;
        } else if (isUdhaar) {
          const newCust = {
            id: customer_id || ('c_' + Date.now()),
            name: body.customer_name || "Customer",
            phone: body.customer_phone || "",
            notes: "Added via Udhaar checkout",
            total_purchases: total,
            total_paid: 0,
            total_pending: total,
            created_at: new Date().toISOString()
          };
          store.customers = [newCust, ...(store.customers || [])];
        }
      }

      store.orders = [newOrder, ...(store.orders || [])];
      if (isNexora) await saveCafeStore(shopKey, store);
      else await saveShopStore(shopKey, store);
      return { statusCode: 200, headers, body: JSON.stringify(newOrder) };
    }

    if (path.startsWith("/orders/") && event.httpMethod === "GET") {
      const authHeader = event.headers.authorization || event.headers.Authorization || "";
      const user = parseToken(authHeader);
      const shopKey = getShopKey(event, user);
      const isNexora = isNexoraRequest(event, path);
      const store = isNexora ? await getCafeStore(shopKey) : await getShopStore(shopKey);

      const parts = path.split("/");
      const orderId = parts[2];
      const order = (store.orders || []).find(o => o.id === orderId || o.order_no === orderId);
      if (order) {
        return { statusCode: 200, headers, body: JSON.stringify(order) };
      }
      return { statusCode: 404, headers, body: JSON.stringify({ detail: "Order not found" }) };
    }

    if (path.startsWith("/orders/") && event.httpMethod === "PATCH") {
      const authHeader = event.headers.authorization || event.headers.Authorization || "";
      const user = parseToken(authHeader);
      const shopKey = getShopKey(event, user);
      const isNexora = isNexoraRequest(event, path);
      const store = isNexora ? await getCafeStore(shopKey) : await getShopStore(shopKey);

      const parts = path.split("/");
      const orderId = parts[2];
      const subAction = parts[3];

      const ord = (store.orders || []).find(o => o.id === orderId || o.order_no === orderId);
      if (!ord) {
        return { statusCode: 404, headers, body: JSON.stringify({ detail: "Order not found" }) };
      }

      if (subAction === "confirm-cash") {
        ord.payment_method = "cash";
        ord.status = ord.status === "completed" ? "completed" : "paid";
        ord.updated_at = new Date().toISOString();
        if (isNexora) await saveCafeStore(shopKey, store);
        else await saveShopStore(shopKey, store);
        return { statusCode: 200, headers, body: JSON.stringify(ord) };
      }

      if (body.status) {
        ord.status = body.status;
      }
      Object.assign(ord, body, { updated_at: new Date().toISOString() });

      if (ord.table_id && (ord.status === "completed" || ord.status === "cancelled")) {
        const hasOtherActive = (store.orders || []).some(o => o.id !== ord.id && o.table_id === ord.table_id && !["completed", "cancelled"].includes(o.status));
        if (!hasOtherActive && Array.isArray(store.tables)) {
          const tbl = store.tables.find(t => t.id === ord.table_id || String(t.number) === ord.table_id);
          if (tbl && tbl.status === "occupied") {
            tbl.status = "available";
            delete tbl.occupied_at;
          }
        }
      }

      if (isNexora) await saveCafeStore(shopKey, store);
      else await saveShopStore(shopKey, store);
      return { statusCode: 200, headers, body: JSON.stringify(ord) };
    }

    if (path.startsWith("/orders/") && event.httpMethod === "DELETE") {
      const authHeader = event.headers.authorization || event.headers.Authorization || "";
      const user = parseToken(authHeader);
      const shopKey = getShopKey(event, user);
      const isNexora = isNexoraRequest(event, path);
      const store = isNexora ? await getCafeStore(shopKey) : await getShopStore(shopKey);

      const parts = path.split("/");
      const orderId = parts[2];
      store.orders = (store.orders || []).filter(o => o.id !== orderId && o.order_no !== orderId);
      if (isNexora) await saveCafeStore(shopKey, store);
      else await saveShopStore(shopKey, store);
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true, id: orderId }) };
    }

    // ==========================================
    // 25. CUSTOMERS & KHATA LEDGER
    // ==========================================
    if (path === "/customers" && event.httpMethod === "GET") {
      const authHeader = event.headers.authorization || event.headers.Authorization || "";
      const user = parseToken(authHeader);
      const shopKey = getShopKey(event, user);
      const isNexora = isNexoraRequest(event, path);
      const store = isNexora ? await getCafeStore(shopKey) : await getShopStore(shopKey);

      const q = (event.queryStringParameters?.q || "").toLowerCase().trim();
      let list = store.customers || [];
      if (q) {
        list = list.filter(c => (c.name && c.name.toLowerCase().includes(q)) || (c.phone && c.phone.includes(q)) || (c.email && c.email.toLowerCase().includes(q)));
      }
      return { statusCode: 200, headers, body: JSON.stringify(list) };
    }

    if (path === "/customers" && event.httpMethod === "POST") {
      const authHeader = event.headers.authorization || event.headers.Authorization || "";
      const user = parseToken(authHeader);
      const shopKey = getShopKey(event, user);
      const isNexora = isNexoraRequest(event, path);
      const store = isNexora ? await getCafeStore(shopKey) : await getShopStore(shopKey);

      const newCust = {
        id: body.id || ('c_' + Date.now()),
        name: (body.name || "Customer").trim(),
        phone: (body.phone || "").trim(),
        email: (body.email || "").trim(),
        notes: (body.notes || "").trim(),
        total_orders: 0,
        total_spend: 0,
        total_purchases: Number(body.total_purchases || 0),
        total_paid: Number(body.total_paid || 0),
        total_pending: Number(body.total_pending || 0),
        created_at: body.created_at || new Date().toISOString()
      };

      const existingIdx = (store.customers || []).findIndex(c => c.id === newCust.id || (newCust.phone && c.phone === newCust.phone));
      if (existingIdx >= 0) {
        store.customers[existingIdx] = { ...store.customers[existingIdx], ...newCust };
      } else {
        store.customers = [newCust, ...(store.customers || [])];
      }
      if (isNexora) await saveCafeStore(shopKey, store);
      else await saveShopStore(shopKey, store);
      return { statusCode: 200, headers, body: JSON.stringify(newCust) };
    }

    if (path.startsWith("/customers/") && (event.httpMethod === "PUT" || event.httpMethod === "POST" || event.httpMethod === "PATCH")) {
      const authHeader = event.headers.authorization || event.headers.Authorization || "";
      const user = parseToken(authHeader);
      const shopKey = getShopKey(event, user);
      const isNexora = isNexoraRequest(event, path);
      const store = isNexora ? await getCafeStore(shopKey) : await getShopStore(shopKey);

      const parts = path.split("/");
      const cId = parts[2];
      const idx = (store.customers || []).findIndex(c => c.id === cId);
      if (idx >= 0) {
        store.customers[idx] = { ...store.customers[idx], ...body, id: cId, updated_at: new Date().toISOString() };
        if (isNexora) await saveCafeStore(shopKey, store);
        else await saveShopStore(shopKey, store);
        return { statusCode: 200, headers, body: JSON.stringify(store.customers[idx]) };
      }
      const created = { id: cId, ...body };
      store.customers = [created, ...(store.customers || [])];
      if (isNexora) await saveCafeStore(shopKey, store);
      else await saveShopStore(shopKey, store);
      return { statusCode: 200, headers, body: JSON.stringify(created) };
    }

    if (path.startsWith("/customers/") && event.httpMethod === "DELETE") {
      const authHeader = event.headers.authorization || event.headers.Authorization || "";
      const user = parseToken(authHeader);
      const shopKey = getShopKey(event, user);
      const isNexora = isNexoraRequest(event, path);
      const store = isNexora ? await getCafeStore(shopKey) : await getShopStore(shopKey);

      const parts = path.split("/");
      const cId = parts[2];
      store.customers = (store.customers || []).filter(c => c.id !== cId);
      if (isNexora) await saveCafeStore(shopKey, store);
      else await saveShopStore(shopKey, store);
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true, id: cId }) };
    }

    if (path.startsWith("/customers/") && event.httpMethod === "GET") {
      const authHeader = event.headers.authorization || event.headers.Authorization || "";
      const user = parseToken(authHeader);
      const shopKey = getShopKey(event, user);
      const isNexora = isNexoraRequest(event, path);
      const store = isNexora ? await getCafeStore(shopKey) : await getShopStore(shopKey);

      const parts = path.split("/");
      const cId = parts[2];
      const cust = (store.customers || []).find(c => c.id === cId);
      if (cust) {
        const matchingOrders = (store.orders || []).filter(o => o.customer_id === cId || (cust.phone && o.customer_phone === cust.phone));
        return { statusCode: 200, headers, body: JSON.stringify({ ...cust, orders: matchingOrders }) };
      }
      return { statusCode: 404, headers, body: JSON.stringify({ detail: "Customer not found" }) };
    }

    // ==========================================
    // 26. UDHAAR REPAYMENT
    // ==========================================
    if (path === "/udhaar" && event.httpMethod === "GET") {
      const authHeader = event.headers.authorization || event.headers.Authorization || "";
      const user = parseToken(authHeader);
      const shopKey = getShopKey(event, user);
      const store = await getShopStore(shopKey);

      const debtors = (store.customers || []).filter(c => Number(c.total_pending || 0) > 0);
      const udhaarOrders = (store.orders || []).filter(o => o.payment_method === "udhaar" || o.status === "udhaar");
      return { statusCode: 200, headers, body: JSON.stringify({ customers: debtors, orders: udhaarOrders }) };
    }

    if (path === "/udhaar/pay" && event.httpMethod === "POST") {
      const authHeader = event.headers.authorization || event.headers.Authorization || "";
      const user = parseToken(authHeader);
      const shopKey = getShopKey(event, user);
      const store = await getShopStore(shopKey);

      const cId = body.customer_id;
      const amt = Number(body.amount || 0);

      const cIdx = (store.customers || []).findIndex(c => c.id === cId);
      if (cIdx >= 0) {
        const currentPending = Number(store.customers[cIdx].total_pending || 0);
        store.customers[cIdx].total_pending = Math.max(0, currentPending - amt);
        store.customers[cIdx].total_paid = Number(store.customers[cIdx].total_paid || 0) + amt;
        store.customers[cIdx].updated_at = new Date().toISOString();

        let rem = amt;
        for (const ord of (store.orders || [])) {
          if (rem <= 0) break;
          if (ord.customer_id === cId && (ord.status === "udhaar" || Number(ord.pending_amount || 0) > 0)) {
            const curOrdPending = Number(ord.pending_amount || ord.total || 0);
            const payTowards = Math.min(rem, curOrdPending);
            ord.pending_amount = curOrdPending - payTowards;
            ord.paid_amount = Number(ord.paid_amount || 0) + payTowards;
            if (ord.pending_amount <= 0) ord.status = "paid";
            rem -= payTowards;
          }
        }

        await saveShopStore(shopKey, store);
        return { statusCode: 200, headers, body: JSON.stringify({ ok: true, customer: store.customers[cIdx] }) };
      }
      return { statusCode: 404, headers, body: JSON.stringify({ detail: "Customer not found" }) };
    }

    // ==========================================
    // 27. DASHBOARD LIVE METRICS (DUKAAN & NEXORAOS)
    // ==========================================
    if (path === "/dashboard" && event.httpMethod === "GET") {
      const authHeader = event.headers.authorization || event.headers.Authorization || "";
      const user = parseToken(authHeader);
      const shopKey = getShopKey(event, user);
      const isNexora = isNexoraRequest(event, path);
      const store = isNexora ? await getCafeStore(shopKey) : await getShopStore(shopKey);

      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

      let todaySales = 0;
      let todayOrders = 0;
      let todayCash = 0;
      let todayUpi = 0;
      let todayUdhaar = 0;

      const hoursMap = {};
      for (let h = 8; h <= 22; h++) {
        const ampm = h >= 12 ? 'PM' : 'AM';
        const displayH = h % 12 === 0 ? 12 : h % 12;
        hoursMap[h] = { hour: `${displayH} ${ampm}`, value: 0 };
      }

      const prodCountMap = {};

      for (const o of (store.orders || [])) {
        const ordDate = new Date(o.created_at);
        const ordTime = ordDate.getTime();
        const tot = Number(o.total || 0);

        if (ordTime >= startOfDay) {
          todaySales += tot;
          todayOrders += 1;
          if (o.payment_method === "cash") todayCash += tot;
          else if (o.payment_method === "upi") todayUpi += tot;
          else if (o.payment_method === "udhaar") todayUdhaar += tot;

          const h = ordDate.getHours();
          if (hoursMap[h]) hoursMap[h].value += tot;
        }

        for (const it of (o.items || [])) {
          const name = it.name || "Item";
          if (!prodCountMap[name]) prodCountMap[name] = { name, count: 0, total: 0 };
          const q = Number(it.qty || 1);
          const p = Number(it.price || it.selling_price || 0);
          prodCountMap[name].count += q;
          prodCountMap[name].total += q * p;
        }
      }

      const sales_by_hour = Object.values(hoursMap);
      const top_products = Object.values(prodCountMap).sort((a, b) => b.total - a.total).slice(0, 5);

      const active_tables = (store.tables || []).filter(t => t.status === "occupied").length;
      const kitchen_pending = (store.orders || []).filter(o => ["received", "preparing", "pending"].includes(o.status)).length;

      // Low stock from inventory + products
      const lowStockProducts = (store.products || []).filter(p => !p.unlimited_stock && Number(p.stock || 0) <= Number(p.min_stock || 5));
      const lowStockInventory = (store.inventory || []).filter(i => Number(i.current_stock || 0) <= Number(i.min_stock || 0));
      const mergedLowStock = [
        ...lowStockInventory.map(i => ({ id: i.id, name: i.name, category: i.category, current_stock: i.current_stock, unit: i.unit, min_stock: i.min_stock })),
        ...lowStockProducts.map(p => ({ id: p.id, name: p.name, category: p.category, current_stock: p.stock, unit: "units", min_stock: p.min_stock }))
      ];

      const totalUdhaarPending = (store.customers || []).reduce((acc, c) => acc + Number(c.total_pending || 0), 0);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          // NexoraOS keys
          total_sales: todaySales,
          orders_count: todayOrders,
          active_tables,
          kitchen_pending,
          sales_by_hour,
          top_products,
          low_stock: mergedLowStock,
          recent_orders: (store.orders || []).slice(0, 10),

          // Dukaan keys
          today_sales: todaySales,
          today_orders: todayOrders,
          today: { sales: todaySales, orders: todayOrders, cash: todayCash, upi: todayUpi, udhaar: todayUdhaar },
          total_products: (store.products || []).length,
          total_pending: totalUdhaarPending,
          allProductsCount: (store.products || []).length
        })
      };
    }

    // ==========================================
    // 28. TABLES (NEXORAOS)
    // ==========================================
    if (path === "/tables" && event.httpMethod === "GET") {
      const authHeader = event.headers.authorization || event.headers.Authorization || "";
      const user = parseToken(authHeader);
      const shopKey = getShopKey(event, user);
      const store = await getCafeStore(shopKey);
      return { statusCode: 200, headers, body: JSON.stringify(store.tables || []) };
    }

    if (path === "/tables" && event.httpMethod === "POST") {
      const authHeader = event.headers.authorization || event.headers.Authorization || "";
      const user = parseToken(authHeader);
      const shopKey = getShopKey(event, user);
      const store = await getCafeStore(shopKey);

      const newTable = {
        id: body.id || ('tbl_' + Date.now() + '_' + Math.floor(100 + Math.random() * 900)),
        number: Number(body.number || ((store.tables || []).length + 1)),
        capacity: Number(body.capacity || 4),
        status: body.status || "available",
        created_at: new Date().toISOString()
      };
      store.tables = [...(store.tables || []), newTable];
      await saveCafeStore(shopKey, store);
      return { statusCode: 200, headers, body: JSON.stringify(newTable) };
    }

    if (path.startsWith("/tables/") && (event.httpMethod === "PATCH" || event.httpMethod === "PUT" || event.httpMethod === "POST")) {
      const authHeader = event.headers.authorization || event.headers.Authorization || "";
      const user = parseToken(authHeader);
      const shopKey = getShopKey(event, user);
      const store = await getCafeStore(shopKey);

      const parts = path.split("/");
      const tableId = parts[2];
      const tblIdx = (store.tables || []).findIndex(t => t.id === tableId || String(t.number) === tableId);
      if (tblIdx >= 0) {
        store.tables[tblIdx] = { ...store.tables[tblIdx], ...body, id: store.tables[tblIdx].id, updated_at: new Date().toISOString() };
        if (body.status === "occupied" && !store.tables[tblIdx].occupied_at) {
          store.tables[tblIdx].occupied_at = new Date().toISOString();
        } else if (body.status === "available") {
          delete store.tables[tblIdx].occupied_at;
        }
        await saveCafeStore(shopKey, store);
        return { statusCode: 200, headers, body: JSON.stringify(store.tables[tblIdx]) };
      }
      return { statusCode: 404, headers, body: JSON.stringify({ detail: "Table not found" }) };
    }

    if (path.startsWith("/tables/") && event.httpMethod === "DELETE") {
      const authHeader = event.headers.authorization || event.headers.Authorization || "";
      const user = parseToken(authHeader);
      const shopKey = getShopKey(event, user);
      const store = await getCafeStore(shopKey);

      const parts = path.split("/");
      const tableId = parts[2];
      store.tables = (store.tables || []).filter(t => t.id !== tableId && String(t.number) !== tableId);
      await saveCafeStore(shopKey, store);
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true, id: tableId }) };
    }

    // ==========================================
    // 29. CATEGORIES (NEXORAOS)
    // ==========================================
    if (path === "/categories" && event.httpMethod === "GET") {
      const authHeader = event.headers.authorization || event.headers.Authorization || "";
      const user = parseToken(authHeader);
      const shopKey = getShopKey(event, user);
      const store = await getCafeStore(shopKey);
      return { statusCode: 200, headers, body: JSON.stringify(store.categories || []) };
    }

    if (path === "/categories" && event.httpMethod === "POST") {
      const authHeader = event.headers.authorization || event.headers.Authorization || "";
      const user = parseToken(authHeader);
      const shopKey = getShopKey(event, user);
      const store = await getCafeStore(shopKey);

      const newCat = {
        id: body.id || ('cat_' + Date.now() + '_' + Math.floor(100 + Math.random() * 900)),
        name: (body.name || "New Category").trim(),
        created_at: new Date().toISOString()
      };
      store.categories = [...(store.categories || []), newCat];
      await saveCafeStore(shopKey, store);
      return { statusCode: 200, headers, body: JSON.stringify(newCat) };
    }

    if (path.startsWith("/categories/") && event.httpMethod === "DELETE") {
      const authHeader = event.headers.authorization || event.headers.Authorization || "";
      const user = parseToken(authHeader);
      const shopKey = getShopKey(event, user);
      const store = await getCafeStore(shopKey);

      const parts = path.split("/");
      const catId = parts[2];
      store.categories = (store.categories || []).filter(c => c.id !== catId);
      await saveCafeStore(shopKey, store);
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true, id: catId }) };
    }

    // ==========================================
    // 30. INVENTORY (NEXORAOS)
    // ==========================================
    if (path === "/inventory" && event.httpMethod === "GET") {
      const authHeader = event.headers.authorization || event.headers.Authorization || "";
      const user = parseToken(authHeader);
      const shopKey = getShopKey(event, user);
      const store = await getCafeStore(shopKey);
      return { statusCode: 200, headers, body: JSON.stringify(store.inventory || []) };
    }

    if (path === "/inventory" && event.httpMethod === "POST") {
      const authHeader = event.headers.authorization || event.headers.Authorization || "";
      const user = parseToken(authHeader);
      const shopKey = getShopKey(event, user);
      const store = await getCafeStore(shopKey);

      const newItem = {
        id: body.id || ('inv_' + Date.now() + '_' + Math.floor(100 + Math.random() * 900)),
        name: (body.name || "Item").trim(),
        category: body.category || "General",
        unit: body.unit || "kg",
        current_stock: Number(body.current_stock || 0),
        min_stock: Number(body.min_stock || 0),
        cost: Number(body.cost || 0),
        supplier: body.supplier || "",
        created_at: new Date().toISOString()
      };
      store.inventory = [...(store.inventory || []), newItem];
      await saveCafeStore(shopKey, store);
      return { statusCode: 200, headers, body: JSON.stringify(newItem) };
    }

    if (path === "/inventory/stock" && event.httpMethod === "POST") {
      const authHeader = event.headers.authorization || event.headers.Authorization || "";
      const user = parseToken(authHeader);
      const shopKey = getShopKey(event, user);
      const store = await getCafeStore(shopKey);

      const itemId = body.item_id;
      const qty = Number(body.qty || 0);
      const type = body.type || "in";

      const idx = (store.inventory || []).findIndex(i => i.id === itemId);
      if (idx >= 0) {
        if (type === "in") {
          store.inventory[idx].current_stock = Number(store.inventory[idx].current_stock || 0) + qty;
        } else {
          store.inventory[idx].current_stock = Math.max(0, Number(store.inventory[idx].current_stock || 0) - qty);
        }
        store.inventory[idx].updated_at = new Date().toISOString();
        await saveCafeStore(shopKey, store);
        return { statusCode: 200, headers, body: JSON.stringify(store.inventory[idx]) };
      }
      return { statusCode: 404, headers, body: JSON.stringify({ detail: "Inventory item not found" }) };
    }

    if (path.startsWith("/inventory/") && (event.httpMethod === "PATCH" || event.httpMethod === "PUT" || event.httpMethod === "POST")) {
      const authHeader = event.headers.authorization || event.headers.Authorization || "";
      const user = parseToken(authHeader);
      const shopKey = getShopKey(event, user);
      const store = await getCafeStore(shopKey);

      const parts = path.split("/");
      const invId = parts[2];
      const idx = (store.inventory || []).findIndex(i => i.id === invId);
      if (idx >= 0) {
        store.inventory[idx] = { ...store.inventory[idx], ...body, id: invId, updated_at: new Date().toISOString() };
        await saveCafeStore(shopKey, store);
        return { statusCode: 200, headers, body: JSON.stringify(store.inventory[idx]) };
      }
      return { statusCode: 404, headers, body: JSON.stringify({ detail: "Item not found" }) };
    }

    if (path.startsWith("/inventory/") && event.httpMethod === "DELETE") {
      const authHeader = event.headers.authorization || event.headers.Authorization || "";
      const user = parseToken(authHeader);
      const shopKey = getShopKey(event, user);
      const store = await getCafeStore(shopKey);

      const parts = path.split("/");
      const invId = parts[2];
      store.inventory = (store.inventory || []).filter(i => i.id !== invId);
      await saveCafeStore(shopKey, store);
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true, id: invId }) };
    }

    // ==========================================
    // 31. STAFF (NEXORAOS)
    // ==========================================
    if (path === "/staff" && event.httpMethod === "GET") {
      const authHeader = event.headers.authorization || event.headers.Authorization || "";
      const user = parseToken(authHeader);
      const shopKey = getShopKey(event, user);
      const store = await getCafeStore(shopKey);
      return { statusCode: 200, headers, body: JSON.stringify(store.staff || []) };
    }

    if (path === "/staff" && event.httpMethod === "POST") {
      const authHeader = event.headers.authorization || event.headers.Authorization || "";
      const user = parseToken(authHeader);
      const shopKey = getShopKey(event, user);
      const store = await getCafeStore(shopKey);

      const newStaff = {
        id: body.id || ('stf_' + Date.now() + '_' + Math.floor(100 + Math.random() * 900)),
        name: (body.name || "Staff Member").trim(),
        email: (body.email || "").trim().toLowerCase(),
        role: body.role || "cashier",
        created_at: new Date().toISOString()
      };
      store.staff = [...(store.staff || []), newStaff];
      await saveCafeStore(shopKey, store);
      return { statusCode: 200, headers, body: JSON.stringify(newStaff) };
    }

    if (path.startsWith("/staff/") && event.httpMethod === "DELETE") {
      const authHeader = event.headers.authorization || event.headers.Authorization || "";
      const user = parseToken(authHeader);
      const shopKey = getShopKey(event, user);
      const store = await getCafeStore(shopKey);

      const parts = path.split("/");
      const staffId = parts[2];
      store.staff = (store.staff || []).filter(s => s.id !== staffId);
      await saveCafeStore(shopKey, store);
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true, id: staffId }) };
    }

    // ==========================================
    // 32. CAFES & SETTINGS (NEXORAOS)
    // ==========================================
    if (path === "/cafes/mine" && event.httpMethod === "GET") {
      const authHeader = event.headers.authorization || event.headers.Authorization || "";
      const user = parseToken(authHeader);
      const shopKey = getShopKey(event, user);
      const store = await getCafeStore(shopKey);

      const currentCafe = store.cafe || { id: "cafe_" + shopKey, name: user?.cafe_name || user?.store_name || "My Café", is_pro: true };
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          cafes: [currentCafe],
          current_id: currentCafe.id,
          max_cafes: 3,
          is_pro: true
        })
      };
    }

    if (path === "/cafes/switch" && event.httpMethod === "POST") {
      const authHeader = event.headers.authorization || event.headers.Authorization || "";
      const user = parseToken(authHeader);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          ok: true,
          token: makeToken(user),
          cafe_id: body.cafe_id
        })
      };
    }

    if (path === "/cafes" && event.httpMethod === "POST") {
      const authHeader = event.headers.authorization || event.headers.Authorization || "";
      const user = parseToken(authHeader);
      const shopKey = getShopKey(event, user);
      const store = await getCafeStore(shopKey);

      const newCafe = {
        id: 'cafe_' + Date.now(),
        name: (body.name || "New Café").trim(),
        tax_rate: 5,
        upi_enabled: true,
        is_pro: true
      };
      store.cafe = newCafe;
      await saveCafeStore(shopKey, store);
      return { statusCode: 200, headers, body: JSON.stringify(newCafe) };
    }

    if (path === "/cafe" && (event.httpMethod === "PATCH" || event.httpMethod === "PUT" || event.httpMethod === "POST")) {
      const authHeader = event.headers.authorization || event.headers.Authorization || "";
      const user = parseToken(authHeader);
      const shopKey = getShopKey(event, user);
      const store = await getCafeStore(shopKey);

      store.cafe = { ...(store.cafe || {}), ...body, updated_at: new Date().toISOString() };
      await saveCafeStore(shopKey, store);
      return { statusCode: 200, headers, body: JSON.stringify(store.cafe) };
    }

    // ==========================================
    // 33. SUBSCRIPTIONS (NEXORAOS)
    // ==========================================
    if (path === "/subscription" && event.httpMethod === "GET") {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          subscription: {
            plan: "pro_monthly",
            tier: "Pro",
            status: "active",
            expires_at: new Date(Date.now() + 365 * 86400000).toISOString(),
            is_pro: true,
            max_cafes: 3,
            features: ["All café operations", "Unlimited orders", "Up to 3 café locations", "KDS & QR Ordering", "Priority 24/7 Support"]
          },
          invoices: [
            { id: "inv_sub_1", order_no: "SUB-8821", plan: "pro_monthly", amount: 149, date: new Date().toISOString(), status: "paid" }
          ]
        })
      };
    }

    if (path === "/subscription/create-order" && event.httpMethod === "POST") {
      const plan = body.plan || "monthly";
      const amount = plan.includes("yearly") ? 119900 : 14900;
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          order_id: "order_" + Date.now() + "_" + Math.floor(100 + Math.random() * 900),
          key: process.env.REACT_APP_RAZORPAY_KEY_ID || "rzp_test_51K3n29482910a",
          amount,
          currency: "INR"
        })
      };
    }

    if (path === "/subscription/verify" && event.httpMethod === "POST") {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          ok: true,
          message: "Subscription activated successfully! Enjoy full access to NexoraOS Café Suite."
        })
      };
    }

    // ==========================================
    // 34. REPORTS & ANALYTICS (NEXORAOS)
    // ==========================================
    if (path === "/reports" && event.httpMethod === "GET") {
      const authHeader = event.headers.authorization || event.headers.Authorization || "";
      const user = parseToken(authHeader);
      const shopKey = getShopKey(event, user);
      const store = await getCafeStore(shopKey);

      const rangeDays = parseInt(event.queryStringParameters?.range || "7", 10);
      const cutoff = Date.now() - (rangeDays * 86400000);

      const filteredOrders = (store.orders || []).filter(o => new Date(o.created_at).getTime() >= cutoff);

      const total_sales = filteredOrders.reduce((acc, o) => acc + Number(o.total || 0), 0);
      const orders_count = filteredOrders.length;
      const aov = orders_count > 0 ? Math.round((total_sales / orders_count) * 100) / 100 : 0;
      const total_tax = filteredOrders.reduce((acc, o) => acc + Number(o.tax || 0), 0);
      const total_discount = filteredOrders.reduce((acc, o) => acc + Number(o.discount || 0), 0);

      // Daily breakdown
      const dailyMap = {};
      for (let i = rangeDays - 1; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000);
        const key = d.toLocaleDateString([], { month: "short", day: "numeric" });
        dailyMap[key] = { date: key, value: 0 };
      }
      for (const o of filteredOrders) {
        const key = new Date(o.created_at).toLocaleDateString([], { month: "short", day: "numeric" });
        if (dailyMap[key]) dailyMap[key].value += Number(o.total || 0);
      }

      // Payment mix
      const payMap = { cash: 0, upi: 0, card: 0, other: 0 };
      for (const o of filteredOrders) {
        const pm = (o.payment_method || "cash").toLowerCase();
        if (payMap[pm] !== undefined) payMap[pm] += Number(o.total || 0);
        else payMap.other += Number(o.total || 0);
      }
      const payments = Object.entries(payMap)
        .filter(([_, val]) => val > 0)
        .map(([method, value]) => ({ method, value }));

      // Top products
      const prodMap = {};
      for (const o of filteredOrders) {
        for (const it of (o.items || [])) {
          const name = it.name || "Item";
          if (!prodMap[name]) prodMap[name] = { name, count: 0, total: 0 };
          const q = Number(it.qty || 1);
          const p = Number(it.price || it.selling_price || 0);
          prodMap[name].count += q;
          prodMap[name].total += q * p;
        }
      }
      const top_products = Object.values(prodMap).sort((a, b) => b.total - a.total).slice(0, 10);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          total_sales,
          orders_count,
          aov,
          total_tax,
          total_discount,
          daily: Object.values(dailyMap),
          payments: payments.length > 0 ? payments : [{ method: "cash", value: total_sales }],
          top_products
        })
      };
    }

    // ==========================================
    // 35. PUBLIC QR MENU, ORDERS & TV (NEXORAOS)
    // ==========================================
    if (path === "/public/menu" && event.httpMethod === "GET") {
      const cafeId = event.queryStringParameters?.cafe_id || event.queryStringParameters?.c;
      const tableId = event.queryStringParameters?.table_id || event.queryStringParameters?.t;
      const shopKey = cafeId ? String(cafeId).toLowerCase().trim().replace(/[^a-z0-9_]/g, '_') : 'default_store';
      const store = await getCafeStore(shopKey);

      const table = (store.tables || []).find(t => t.id === tableId || String(t.number) === tableId);
      const availableProducts = (store.products || []).filter(p => p.available !== false);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          cafe: store.cafe || { id: cafeId || "cafe_main", name: "My Café", tax_rate: 5, upi_enabled: true },
          table: table || null,
          categories: store.categories || [],
          products: availableProducts
        })
      };
    }

    if (path === "/public/active-orders" && event.httpMethod === "GET") {
      const cafeId = event.queryStringParameters?.cafe_id || event.queryStringParameters?.c;
      const tableId = event.queryStringParameters?.table_id || event.queryStringParameters?.t;
      const shopKey = cafeId ? String(cafeId).toLowerCase().trim().replace(/[^a-z0-9_]/g, '_') : 'default_store';
      const store = await getCafeStore(shopKey);

      let orders = (store.orders || []).filter(o => !["completed", "cancelled"].includes(o.status));
      if (tableId) {
        orders = orders.filter(o => o.table_id === tableId);
      }
      return { statusCode: 200, headers, body: JSON.stringify(orders.slice(0, 10)) };
    }

    if (path === "/public/order" && event.httpMethod === "POST") {
      const cafeId = body.cafe_id || event.queryStringParameters?.cafe_id || 'default_store';
      const shopKey = String(cafeId).toLowerCase().trim().replace(/[^a-z0-9_]/g, '_');
      const store = await getCafeStore(shopKey);

      const items = Array.isArray(body.items) ? body.items : [];
      const subtotal = items.reduce((acc, it) => acc + (Number(it.price || 0) * Number(it.qty || 1)), 0);
      const taxRate = Number(body.tax_rate || store.cafe?.tax_rate || 5);
      const tax = (subtotal * taxRate) / 100;
      const total = Math.round((subtotal + tax) * 100) / 100;

      const orderNo = 'OD-' + Math.floor(1000 + Math.random() * 9000);
      const newOrder = {
        id: 'ord_' + Date.now() + '_' + Math.floor(100 + Math.random() * 900),
        order_no: orderNo,
        total,
        subtotal,
        tax,
        tax_rate: taxRate,
        discount: 0,
        payment_method: body.payment_method || "upi",
        status: "received",
        order_type: "dine_in",
        table_id: body.table_id || null,
        customer_name: body.name || "Table Guest",
        customer_phone: body.phone || "",
        items,
        created_at: new Date().toISOString()
      };

      if (body.table_id && Array.isArray(store.tables)) {
        const tbl = store.tables.find(t => t.id === body.table_id || String(t.number) === body.table_id);
        if (tbl) {
          tbl.status = "occupied";
          tbl.occupied_at = new Date().toISOString();
        }
      }

      store.orders = [newOrder, ...(store.orders || [])];
      await saveCafeStore(shopKey, store);
      return { statusCode: 200, headers, body: JSON.stringify(newOrder) };
    }

    if (path === "/public/tv" && event.httpMethod === "GET") {
      const cafeId = event.queryStringParameters?.cafe_id || event.queryStringParameters?.c;
      const shopKey = cafeId ? String(cafeId).toLowerCase().trim().replace(/[^a-z0-9_]/g, '_') : 'default_store';
      const store = await getCafeStore(shopKey);

      const active = (store.orders || []).filter(o => ["preparing", "almost_ready", "ready"].includes(o.status));
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          cafe_name: store.cafe?.name || "My Café",
          orders: active.slice(0, 30)
        })
      };
    }


    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ detail: `Route ${path} not found on serverless API` })
    };
  } catch (err) {
    console.error("API Error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ detail: err.message || "Internal server error" })
    };
  }
};
