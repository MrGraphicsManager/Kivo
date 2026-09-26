import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, formatApiError } from "./api";

const AuthCtx = createContext(null);

const DEFAULT_SHOP = {
  id: "shop_main",
  name: "My Store",
  owner_name: "Merchant",
  phone: "9876543210",
  address: "Main Market, India",
  upi_id: "",
  store_category: "Kirana & General Store",
  gst_status: "pending",
  gst_enabled: false,
  financial_year: "2026-27",
  store_active: true,
};

export const ADMIN_EMAIL = "contact@officialdukaan.in";
export const isAdminEmail = (email) => (email || "").toLowerCase().trim() === ADMIN_EMAIL;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [shops, setShops] = useState([]);
  const [currentShopId, setCurrentShopId] = useState(localStorage.getItem("dukaan_shop_id") || DEFAULT_SHOP.id);
  const [lang, setLang] = useState(localStorage.getItem("dukaan_lang") || "en");

  const setActiveShop = useCallback((id) => {
    setCurrentShopId(id);
    if (id) localStorage.setItem("dukaan_shop_id", id);
    else localStorage.removeItem("dukaan_shop_id");
  }, []);

  const updateShop = useCallback(async (shopData) => {
    try {
      const targetId = shopData.id || currentShopId;
      if (!targetId) throw new Error("Shop id is required");
      const { data } = await api.put("/shops/" + encodeURIComponent(targetId), shopData);
      setShops((prev) => (Array.isArray(prev) ? prev.map(s => s.id === targetId ? data : s) : [data]));
      return data;
    } catch (err) {
      throw err;
    }
  }, [currentShopId]);

  const loadShops = useCallback(async (fallbackId) => {
    const { data } = await api.get("/shops");
    if (!Array.isArray(data) || data.length === 0) {
      setShops([]);
      setActiveShop(null);
      throw new Error("No shops available for this account.");
    }
    setShops(data);
    const stored = localStorage.getItem("dukaan_shop_id");
    const validStored = data.find((shop) => shop.id === stored);
    const next = validStored?.id || fallbackId || data[0]?.id || null;
    setActiveShop(next);
    return data;
  }, [setActiveShop]);

  const updateUser = useCallback((updater) => {
    setUser((prev) => {
      const current = prev || {};
      const next = typeof updater === "function" ? updater(current) : { ...current, ...updater };
        return next;
    });
  }, []);

  const refresh = useCallback(async () => {
    try {
      const { data } = await api.get("/auth/me");
      if (data && data.email) {
        const cleanEmail = (data.email || "").toLowerCase().trim();
        // If this is an admin account, ensure session is authenticated in this browser tab
        if (isAdminEmail(cleanEmail) || data.is_admin) {
          const isSessionAuth = sessionStorage.getItem("dukaan_admin_authenticated");
          if (!isSessionAuth) {
            setUser(null);
            return null;
          }
        }
        // Subscription state is authoritative on the server. Browser storage is never used to grant access.
        let activeSubscription = data.subscription;
        let serverUpcoming = null;
        try {
          const subRes = await api.get("/subscriptions/me");
          activeSubscription = subRes.data?.active || activeSubscription || null;
          serverUpcoming = subRes.data?.upcoming || subRes.data?.scheduled || subRes.data?.queued || null;
        } catch {}

        const finalSub = activeSubscription || null;
        const upcomingSub = serverUpcoming || null;

        const isUserAdmin = isAdminEmail(cleanEmail);
        const finalUser = {
          ...data,
          is_admin: isUserAdmin,
          subscription: finalSub,
          upcoming_subscription: upcomingSub,
          is_premium: data.is_premium || (finalSub?.plan === "premium" || finalSub?.plan === "pro"),
          is_pro: data.is_pro || (finalSub?.plan === "pro")
        };
        setUser(finalUser);
        await loadShops(finalUser.default_shop_id);
        return finalUser;
      }
    } catch {
      // Authentication failures never fall back to browser-stored identity.
      setUser(null);
      return null;
    }
  }, [loadShops]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 60000);
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    const onVis = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [refresh]);

  const register = async (name, email, password, referralCode = "") => {
    const cleanName = (name || "").trim();
    const cleanEmail = (email || "").toLowerCase().trim();

    if (!cleanName) return { ok: false, error: "Please enter your name or shop name." };
    if (!cleanEmail) return { ok: false, error: "Please enter your email address." };
    if (!password) return { ok: false, error: "Please enter a password." };
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password) || !/[!@#$%^&*(),.?":{}|<>\-_+=\[\]\\/\`~]/.test(password)) {
      return { ok: false, error: "Password must be at least 8 characters and include a capital letter, a number, and a symbol." };
    }

    try {
      const { data } = await api.post("/auth/register", {
        name: cleanName,
        email: cleanEmail,
        password,
        ...(referralCode ? { referral_code: referralCode.trim().toUpperCase() } : {})
      });

      return {
        ok: Boolean(data?.ok),
        needVerification: Boolean(data?.need_verification),
        email: data?.email || cleanEmail,
        user: data?.user || null,
        shop_id: data?.shop_id || null,
        message: data?.message || "Account created. Please verify your email.",
      };
    } catch (err) {
      return {
        ok: false,
        error: formatApiError(err.response?.data?.detail) || "Unable to create your account. Please try again."
      };
    }
  };

  const login = async (email, password) => {
    const cleanEmail = (email || "").toLowerCase().trim();
    if (!cleanEmail) return { ok: false, error: "Please enter your email address." };
    if (!password) return { ok: false, error: "Please enter your password." };

    const isUserAdmin = isAdminEmail(cleanEmail);

    try {
      const { data } = await api.post("/auth/login", { 
        email: cleanEmail, 
        password,
        name: undefined 
      });

      if (data?.need_verification || data?.step === "email") {
        return {
          ok: false,
          needVerification: true,
          step: "email",
          email: cleanEmail,
          error: data?.message || "Please verify your email address to continue."
        };
      }

      if (data?.need_phone_verification || data?.step === "phone") {
        return {
          ok: false,
          needPhoneVerification: true,
          step: "phone",
          email: cleanEmail,
          error: data?.message || "Please verify your mobile number to continue."
        };
      }

      
      if (isUserAdmin) {
        sessionStorage.setItem("dukaan_admin_authenticated", "true");
      } else {
        sessionStorage.removeItem("dukaan_admin_authenticated");
      }

      const u = await refresh();
      const finalSub = data?.user?.subscription || u?.subscription || null;
      const finalUser = {
        ...(data?.user || {}),
        ...(u || {}),
        name: data?.user?.name || u?.name || cleanEmail.split("@")[0],
        email: cleanEmail,
        is_admin: isUserAdmin,
        subscription: finalSub,
        is_premium: Boolean((data?.user || {}).is_premium || (u || {}).is_premium || finalSub?.plan === "premium" || finalSub?.plan === "pro"),
        is_pro: Boolean((data?.user || {}).is_pro || (u || {}).is_pro || finalSub?.plan === "pro")
      };
      setUser(finalUser);
      return { ok: true, user: finalUser };
    } catch (err) {
      const status = err.response?.status;
      const detail = err.response?.data?.detail;

      if (detail && typeof detail === "object" && detail.need_verification) {
        return { 
          ok: false, 
          error: detail.message || "Please verify your email address first.", 
          needVerification: true, 
          email: cleanEmail 
        };
      }
      if (status === 404) {
        return { ok: false, error: formatApiError(detail) || "No account found with this email. Please register." };
      }
      if (status === 401) {
        return { ok: false, error: formatApiError(detail) || "Incorrect password. Please try again." };
      }
      if (status === 403) {
        return { 
          ok: false, 
          error: formatApiError(detail) || "Please verify your email address to continue.", 
          needVerification: true, 
          email: cleanEmail 
        };
      }

      return { ok: false, error: formatApiError(detail) || "Unable to sign in. Please try again." };
    }
  };

  const verifyEmail = async (email, codeOrToken) => {
    const cleanEmail = (email || "").toLowerCase().trim();
    const cleanInput = (codeOrToken || "").trim();

    try {
      const { data } = await api.post("/auth/verify-email", { 
        email: cleanEmail, 
        code: cleanInput, 
        token: cleanInput 
      });
      const u = await refresh();
      const verifiedUser = {
        ...(u || data?.user || { email: cleanEmail }),
        is_verified: true,
        email_verified: true
      };
      setUser(verifiedUser);
      return { ok: true, user: verifiedUser };
    } catch (err) {
      if (err.response?.status === 400) {
        return { 
          ok: false, 
          error: formatApiError(err.response?.data?.detail) || "Invalid verification code. Please check your email and try again." 
        };
      }
      // A verification code must be validated by the server.
      return { 
        ok: false, 
        error: formatApiError(err.response?.data?.detail) || "Invalid verification code. Please try again." 
      };
    }
  };

  const resendVerification = async (email) => {
    const cleanEmail = (email || "").toLowerCase().trim();
    try {
      const { data } = await api.post("/auth/resend-verification", { email: cleanEmail });
      return { ok: true, code: data?.verification_code, message: data?.message };
    } catch (err) {
      return { 
        ok: false, 
        error: formatApiError(err.response?.data?.detail) || "Failed to resend verification email." 
      };
    }
  };

  const sendPhoneOtp = async (phone, email) => {
    const cleanPhone = (phone || "").trim().replace(/\D/g, "").slice(-10);
    const cleanEmail = (email || user?.email || "").toLowerCase().trim();
    if (!cleanPhone || cleanPhone.length !== 10) {
      return { ok: false, error: "Please enter a valid 10-digit mobile number." };
    }

    try {
      const { data } = await api.post("/auth/phone/send-otp", {
        phone: cleanPhone,
        email: cleanEmail
      });
      return {
        ok: true,
        phone: cleanPhone,
        demo_otp: data?.demo_otp,
        sms_gateway_active: data?.sms_gateway_active,
        message: data?.message || `6-digit OTP dispatched to +91 ${cleanPhone}`
      };
    } catch (err) {
      return {
        ok: false,
        phone: cleanPhone,
        error: formatApiError(err.response?.data?.detail) || "Unable to send verification OTP. Please try again."
      };
    }
  };

  const verifyPhoneOtp = async (phone, otp, email) => {
    const cleanPhone = (phone || "").trim().replace(/\D/g, "").slice(-10);
    const cleanOtp = (otp || "").trim();
    const cleanEmail = (email || user?.email || "").toLowerCase().trim();

    if (!cleanPhone || cleanPhone.length !== 10) {
      return { ok: false, error: "Please enter a valid 10-digit mobile number." };
    }
    if (!cleanOtp || cleanOtp.length < 6) {
      return { ok: false, error: "Please enter the 6-digit OTP." };
    }

    try {
      const { data } = await api.post("/auth/phone/verify-otp", {
        phone: cleanPhone,
        otp: cleanOtp,
        email: cleanEmail
      });


      const verifiedUser = {
        ...(user || {}),
        ...(data?.user || {}),
        email: cleanEmail || user?.email || "",
        phone: cleanPhone,
        phone_verified: true,
        is_verified: true,
        email_verified: true
      };

      setUser(verifiedUser);
      await refresh();
      return { ok: true, user: verifiedUser };
    } catch (err) {
      if (err.response?.status === 400) {
        return {
          ok: false,
          error: formatApiError(err.response?.data?.detail) || "Invalid or expired OTP. Please enter the correct 6-digit code."
        };
      }
      return {
        ok: false,
        error: formatApiError(err.response?.data?.detail) || "Invalid or expired OTP. Please try again."
      };
    }
  };

  const loginWithSocial = async ({ email, name, provider = "google", avatar, idToken }) => {
    const cleanEmail = (email || "").toLowerCase().trim();
    if (!cleanEmail || !idToken) {
      return { ok: false, error: "Verified social identity is required." };
    }

    try {
      const { data } = await api.post("/auth/social-login", {
        email: cleanEmail,
        name: (name || "").trim(),
        provider,
        id_token: idToken,
        avatar: avatar || ""
      });

      if (!data?.user) {
        return { ok: false, error: "Social authentication could not be verified." };
      }

      const socialUser = data.user;
      setUser(socialUser);

      if (socialUser.is_admin) {
        sessionStorage.setItem("dukaan_admin_authenticated", "true");
      } else {
        sessionStorage.removeItem("dukaan_admin_authenticated");
      }

      await loadShops(socialUser.default_shop_id);
      return { ok: true, user: socialUser };
    } catch (err) {
      return {
        ok: false,
        error: formatApiError(err.response?.data?.detail) || "Social authentication failed."
      };
    }
  };

  const updateProfile = async ({ name, phone, avatar }) => {
    const updatedFields = {};
    if (name !== undefined) updatedFields.name = name.trim();
    if (phone !== undefined) updatedFields.phone = phone.trim();
    if (avatar !== undefined) updatedFields.avatar = avatar;

    updateUser(updatedFields);

    try {
      await api.post("/auth/update-profile", updatedFields);
    } catch (e) {
      console.warn("Backend update-profile offline fallback:", e);
    }

    return { ok: true, user: { ...(user || {}), ...updatedFields } };
  };

  const changePassword = async (currentPassword, newPassword) => {
    if (!newPassword || newPassword.length < 8) {
      return { ok: false, error: "New password must be at least 8 characters long." };
    }
    if (!/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword) || !/[!@#$%^&*(),.?":{}|<>\-_+=\[\]\\/\`~]/.test(newPassword)) {
      return { ok: false, error: "Password must contain at least one capital letter, number, and special symbol." };
    }
    try {
      await api.post("/auth/change-password", {
        current_password: currentPassword,
        new_password: newPassword
      });
      return { ok: true, message: "Password updated successfully!" };
    } catch (e) {
      return { ok: false, error: formatApiError(e.response?.data?.detail) || "Unable to update password." };
    }
  };

  const loginWithGoogle = (payload) => loginWithSocial({ ...payload, provider: "google" });
  const loginWithApple = (payload) => loginWithSocial({ ...payload, provider: "apple" });

  const logout = async () => {
    try { await api.post("/auth/logout"); } catch {}
    sessionStorage.removeItem("dukaan_admin_authenticated");
    localStorage.removeItem("dukaan_user");
    setUser(null);
  };

  const lockAdminConsole = async () => {
    sessionStorage.removeItem("dukaan_admin_authenticated");
    await logout();
  };

  const verifyAdminSession = async (password) => {
    return login(ADMIN_EMAIL, password);
  };

  const changeLang = (l) => { setLang(l); localStorage.setItem("dukaan_lang", l); };

  return (
    <AuthCtx.Provider value={{
      user, shops, currentShopId, setActiveShop, loadShops, updateShop,
      login, register, verifyEmail, resendVerification, sendPhoneOtp, verifyPhoneOtp, logout, refresh, lang, setLang: changeLang,
      loginWithGoogle, loginWithApple, updateUser, updateProfile, changePassword,
      lockAdminConsole, verifyAdminSession, ADMIN_EMAIL, isAdminEmail
    }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);


// Backward-compatible UI helper; server auth remains the source of truth.
export const getPersistentSubscription = () => null;
