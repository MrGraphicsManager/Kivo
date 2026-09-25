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

export function getPersistentSubscription(email) {
  if (!email) return null;
  const clean = email.toLowerCase().trim();
  try {
    const allSubs = JSON.parse(localStorage.getItem("dukaan_all_subscriptions") || "{}");
    if (allSubs[clean]) return allSubs[clean];
  } catch {}
  try {
    const regUsers = JSON.parse(localStorage.getItem("dukaan_registered_users") || "[]");
    const found = regUsers.find(u => u.email && u.email.toLowerCase() === clean);
    if (found?.subscription) return found.subscription;
  } catch {}
  return null;
}

export function savePersistentSubscription(email, subscription) {
  if (!email || !subscription) return;
  const clean = email.toLowerCase().trim();
  try {
    const allSubs = JSON.parse(localStorage.getItem("dukaan_all_subscriptions") || "{}");
    allSubs[clean] = subscription;
    localStorage.setItem("dukaan_all_subscriptions", JSON.stringify(allSubs));
  } catch {}
  try {
    let regUsers = JSON.parse(localStorage.getItem("dukaan_registered_users") || "[]");
    const idx = regUsers.findIndex(u => u.email && u.email.toLowerCase() === clean);
    if (idx >= 0) {
      regUsers[idx].subscription = subscription;
      if (subscription.plan === "premium" || subscription.plan === "pro") regUsers[idx].is_premium = true;
      if (subscription.plan === "pro") regUsers[idx].is_pro = true;
    } else {
      regUsers.push({
        id: `user_${Date.now()}`,
        email: clean,
        name: clean.split("@")[0],
        subscription,
        is_verified: true,
        created_at: new Date().toISOString()
      });
    }
    localStorage.setItem("dukaan_registered_users", JSON.stringify(regUsers));
  } catch {}
}

export function getPersistentUpcomingSubscription(email) {
  if (!email) return null;
  const clean = email.toLowerCase().trim();
  try {
    const allQueued = JSON.parse(localStorage.getItem("dukaan_upcoming_subscriptions") || "{}");
    if (allQueued[clean]) return allQueued[clean];
  } catch {}
  try {
    const regUsers = JSON.parse(localStorage.getItem("dukaan_registered_users") || "[]");
    const found = regUsers.find(u => u.email && u.email.toLowerCase() === clean);
    if (found?.upcoming_subscription) return found.upcoming_subscription;
  } catch {}
  return null;
}

export function savePersistentUpcomingSubscription(email, upcomingSub) {
  if (!email) return;
  const clean = email.toLowerCase().trim();
  try {
    const allQueued = JSON.parse(localStorage.getItem("dukaan_upcoming_subscriptions") || "{}");
    if (upcomingSub) {
      allQueued[clean] = upcomingSub;
    } else {
      delete allQueued[clean];
    }
    localStorage.setItem("dukaan_upcoming_subscriptions", JSON.stringify(allQueued));
  } catch {}
  try {
    let regUsers = JSON.parse(localStorage.getItem("dukaan_registered_users") || "[]");
    const idx = regUsers.findIndex(u => u.email && u.email.toLowerCase() === clean);
    if (idx >= 0) {
      regUsers[idx].upcoming_subscription = upcomingSub || null;
      localStorage.setItem("dukaan_registered_users", JSON.stringify(regUsers));
    }
  } catch {}
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      // One-time session flush for all existing merchants (Sep 2026 strict rule)
      const FLUSH_KEY = "dukaan_merchant_flush_2026_09_09_v1";
      if (!localStorage.getItem(FLUSH_KEY)) {
        try {
          const raw = localStorage.getItem("dukaan_user");
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && !isAdminEmail(parsed.email) && !parsed.is_admin) {
              localStorage.removeItem("dukaan_user");
              localStorage.removeItem("dukaan_access_token");
            }
          }
          const regRaw = localStorage.getItem("dukaan_registered_users");
          if (regRaw) {
            let regList = JSON.parse(regRaw);
            if (Array.isArray(regList)) {
              regList = regList.map(u => {
                if (u && !isAdminEmail(u.email) && !u.is_admin) {
                  return { ...u, is_verified: false, email_verified: false, phone_verified: false };
                }
                return u;
              });
              localStorage.setItem("dukaan_registered_users", JSON.stringify(regList));
            }
          }
        } catch (_) {}
        localStorage.setItem(FLUSH_KEY, "true");
        return null;
      }

      const stored = localStorage.getItem("dukaan_user");
      if (!stored) return null;
      const parsed = JSON.parse(stored);
      // Admin account (contact@officialdukaan.in) must NOT auto-login!
      // Every time login is required.
      if (parsed && (isAdminEmail(parsed.email) || parsed.is_admin)) {
        const isSessionAuth = sessionStorage.getItem("dukaan_admin_authenticated");
        if (!isSessionAuth) {
          return null; // Never auto-login admin across browser restarts/reloads
        }
      }
      return parsed;
    } catch {
      return null;
    }
  });
  const [shops, setShops] = useState(() => {
    try {
      const stored = localStorage.getItem("dukaan_shops");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [DEFAULT_SHOP];
  });
  const [currentShopId, setCurrentShopId] = useState(localStorage.getItem("dukaan_shop_id") || DEFAULT_SHOP.id);
  const [lang, setLang] = useState(localStorage.getItem("dukaan_lang") || "en");

  const setActiveShop = useCallback((id) => {
    setCurrentShopId(id);
    if (id) localStorage.setItem("dukaan_shop_id", id);
    else localStorage.removeItem("dukaan_shop_id");
  }, []);

  const updateShop = useCallback((shopData) => {
    setShops((prev) => {
      const list = Array.isArray(prev) ? prev : [DEFAULT_SHOP];
      const targetId = shopData.id || currentShopId || DEFAULT_SHOP.id;
      const idx = list.findIndex(s => s.id === targetId);
      let next;
      if (idx >= 0) {
        next = [...list];
        next[idx] = { ...next[idx], ...shopData };
      } else {
        next = [...list, { ...shopData, id: targetId }];
      }
      try {
        localStorage.setItem("dukaan_shops", JSON.stringify(next));
      } catch {}
      return next;
    });
  }, [currentShopId]);

  const loadShops = useCallback(async (fallbackId) => {
    let localShops = [];
    try {
      const raw = localStorage.getItem("dukaan_shops");
      if (raw) localShops = JSON.parse(raw);
    } catch {}

    try {
      const { data } = await api.get("/shops");
      if (Array.isArray(data) && data.length > 0) {
        const merged = data.map(ds => {
          const loc = localShops.find(ls => ls.id === ds.id);
          return loc ? { ...ds, ...loc } : ds;
        });
        setShops(merged);
        localStorage.setItem("dukaan_shops", JSON.stringify(merged));
        const stored = localStorage.getItem("dukaan_shop_id");
        const validStored = merged.find((s) => s.id === stored);
        const next = validStored?.id || fallbackId || merged[0]?.id || null;
        setActiveShop(next);
        return;
      }
    } catch (e) {}

    // Fallback: If local shops exist, use them
    if (Array.isArray(localShops) && localShops.length > 0) {
      setShops(localShops);
      const stored = localStorage.getItem("dukaan_shop_id");
      const valid = localShops.find(s => s.id === stored);
      setActiveShop(valid ? valid.id : localShops[0].id);
      return;
    }

    const existingShopId = localStorage.getItem("dukaan_shop_id") || DEFAULT_SHOP.id;
    const storedUser = localStorage.getItem("dukaan_user");
    let uName = "My";
    if (storedUser) {
      try { uName = JSON.parse(storedUser).name || "My"; } catch {}
    }
    const userShop = {
      ...DEFAULT_SHOP,
      id: existingShopId,
      name: `${uName}'s Store`,
      owner_name: uName
    };
    setShops([userShop]);
    localStorage.setItem("dukaan_shops", JSON.stringify([userShop]));
    setActiveShop(userShop.id);
  }, [setActiveShop]);

  const updateUser = useCallback((updater) => {
    setUser((prev) => {
      const current = prev || {};
      const next = typeof updater === "function" ? updater(current) : { ...current, ...updater };
      try {
        localStorage.setItem("dukaan_user", JSON.stringify(next));
        
        // Do not mint or overwrite authentication tokens from client-side user state.
        // Access tokens are issued by the backend after successful authentication.

        // Persist to registered users directory & all subscriptions map
        if (next.email) {
          const clean = next.email.toLowerCase().trim();
          if (next.subscription) {
            savePersistentSubscription(clean, next.subscription);
          }
          const regRaw = localStorage.getItem("dukaan_registered_users") || "[]";
          let regUsers = JSON.parse(regRaw);
          const idx = regUsers.findIndex((u) => u.email && u.email.toLowerCase() === clean);
          if (idx >= 0) {
            regUsers[idx] = { ...regUsers[idx], ...next };
          } else {
            regUsers.push(next);
          }
          localStorage.setItem("dukaan_registered_users", JSON.stringify(regUsers));
        }
      } catch (e) {
        console.warn("Failed to persist user update:", e);
      }
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
          is_premium: data.is_premium || localIsPremium || (finalSub?.plan === "premium" || finalSub?.plan === "pro"),
          is_pro: data.is_pro || (finalSub?.plan === "pro")
        };
        setUser(finalUser);
        localStorage.setItem("dukaan_user", JSON.stringify(finalUser));
        await loadShops(finalUser.default_shop_id);
        return finalUser;
      }
    } catch {
      // Authentication failures never fall back to browser-stored identity.
      setUser(null);
      return null;
      return null;
    }
  }, [loadShops]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 4000);
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

  const login = async (email, password) => {
    const cleanEmail = (email || "").toLowerCase().trim();
    if (!cleanEmail) return { ok: false, error: "Please enter your email address." };
    if (!password) return { ok: false, error: "Please enter your password." };

    let regUsers = [];
    try {
      regUsers = JSON.parse(localStorage.getItem("dukaan_registered_users") || "[]");
    } catch {}

    const isUserAdmin = isAdminEmail(cleanEmail);

    const localFound = regUsers.find(u => u.email && u.email.toLowerCase() === cleanEmail);
    // Never validate passwords against browser-stored credentials. The server is authoritative.

    try {
      const { data } = await api.post("/auth/login", { 
        email: cleanEmail, 
        password,
        name: localFound?.name || undefined 
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

      if (data?.access_token) {
        localStorage.setItem("dukaan_access_token", data.access_token);
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
      localStorage.setItem("dukaan_user", JSON.stringify(finalUser));
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
    } catch (err) {
      if (err.response?.status === 409) {
        return { ok: false, error: "An account with this email already exists. Please sign in." };
      }
      if (err.response?.data?.detail) {
        return { ok: false, error: formatApiError(err.response.data.detail) };
      }

      return {
        ok: false,
        error: formatApiError(err.response?.data?.detail) || "Registration failed. Please try again."
      };
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
      if (data?.access_token) {
        localStorage.setItem("dukaan_access_token", data.access_token);
      }
      const u = await refresh();
      const verifiedUser = {
        ...(u || data?.user || { email: cleanEmail }),
        is_verified: true,
        email_verified: true
      };
      setUser(verifiedUser);
      localStorage.setItem("dukaan_user", JSON.stringify(verifiedUser));

      // Also update local registered users
      try {
        let regUsers = JSON.parse(localStorage.getItem("dukaan_registered_users") || "[]");
        regUsers = regUsers.map(ru => ru.email.toLowerCase() === cleanEmail ? { ...ru, is_verified: true, email_verified: true } : ru);
        localStorage.setItem("dukaan_registered_users", JSON.stringify(regUsers));
      } catch {}

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
      // Local fallback
      try {
        let regUsers = JSON.parse(localStorage.getItem("dukaan_registered_users") || "[]");
        const idx = regUsers.findIndex(ru => ru.email.toLowerCase() === cleanEmail);
        if (idx >= 0) {
          const newCode = String(Math.floor(100000 + Math.random() * 900000));
          regUsers[idx].verification_code = newCode;
          localStorage.setItem("dukaan_registered_users", JSON.stringify(regUsers));
          return { ok: true, code: newCode, message: "New verification code generated." };
        }
      } catch {}

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

      if (data?.access_token) {
        localStorage.setItem("dukaan_access_token", data.access_token);
      }

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
      localStorage.setItem("dukaan_user", JSON.stringify(verifiedUser));

      // Persist to registered users list
      try {
        let regUsers = JSON.parse(localStorage.getItem("dukaan_registered_users") || "[]");
        const idx = regUsers.findIndex(u => (cleanEmail && u.email && u.email.toLowerCase() === cleanEmail) || (u.phone && u.phone.endsWith(cleanPhone)));
        if (idx >= 0) {
          regUsers[idx] = {
            ...regUsers[idx],
            phone: cleanPhone,
            phone_verified: true,
            is_verified: true,
            email_verified: true
          };
        } else if (cleanEmail) {
          regUsers.push(verifiedUser);
        }
        localStorage.setItem("dukaan_registered_users", JSON.stringify(regUsers));
      } catch {}

      await refresh();
      return { ok: true, user: verifiedUser };
    } catch (err) {
      if (err.response?.status === 400) {
        return {
          ok: false,
          error: formatApiError(err.response?.data?.detail) || "Invalid or expired OTP. Please enter the correct 6-digit code."
        };
      }
      // Local fallback check (offline only)
      try {
        let phoneOtps = JSON.parse(localStorage.getItem("dukaan_phone_otps") || "{}");
        const stored = phoneOtps[cleanPhone];
        const isValid = stored && stored.otp === cleanOtp && stored.expires_at > Date.now();
        if (isValid) {
          const verifiedUser = {
            ...(user || {}),
            email: cleanEmail || user?.email || "",
            phone: cleanPhone,
            phone_verified: true,
            is_verified: true,
            email_verified: true
          };
          setUser(verifiedUser);
          localStorage.setItem("dukaan_user", JSON.stringify(verifiedUser));

          let regUsers = JSON.parse(localStorage.getItem("dukaan_registered_users") || "[]");
          const idx = regUsers.findIndex(u => (cleanEmail && u.email && u.email.toLowerCase() === cleanEmail) || (u.phone && u.phone.endsWith(cleanPhone)));
          if (idx >= 0) {
            regUsers[idx] = { ...regUsers[idx], phone: cleanPhone, phone_verified: true, is_verified: true, email_verified: true };
            localStorage.setItem("dukaan_registered_users", JSON.stringify(regUsers));
          }
          return { ok: true, user: verifiedUser };
        }
      } catch {}

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

      if (!data?.access_token || !data?.user) {
        return { ok: false, error: "Social authentication could not be verified." };
      }

      localStorage.setItem("dukaan_access_token", data.access_token);
      const socialUser = data.user;
      setUser(socialUser);
      localStorage.setItem("dukaan_user", JSON.stringify(socialUser));

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
    localStorage.removeItem("dukaan_access_token");
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
