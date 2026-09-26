import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { api } from '@/lib/api';
import { toast } from 'sonner';

function decodeGoogleJwt(jwt) {
  if (!jwt || typeof jwt !== 'string') return null;
  const parts = jwt.split('.');
  if (parts.length < 2) return null;
  try {
    let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4 !== 0) {
      base64 += '=';
    }
    const binaryStr = atob(base64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    const decoded = new TextDecoder('utf-8').decode(bytes);
    return JSON.parse(decoded);
  } catch (e1) {
    try {
      let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      while (base64.length % 4 !== 0) base64 += '=';
      return JSON.parse(decodeURIComponent(escape(atob(base64))));
    } catch (e2) {
      console.warn('JWT Decode failed:', e1, e2);
      return null;
    }
  }
}

export default function GoogleAuthCallback() {
  const nav = useNavigate();
  const location = useLocation();
  const { loginWithGoogle } = useAuth();
  const [statusText, setStatusText] = useState('Connecting to Google Accounts...');
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    const processGoogleAuth = async () => {
      try {
        const getParam = (key) => {
          const sources = [
            window.location.hash.replace(/^#/, ''),
            window.location.search.replace(/^\?/, ''),
            (location.hash || '').replace(/^#/, ''),
            (location.search || '').replace(/^\?/, '')
          ];
          for (const src of sources) {
            if (!src) continue;
            const p = new URLSearchParams(src);
            const val = p.get(key);
            if (val) return val;
          }
          const m = window.location.href.match(new RegExp('[#?&]' + key + '=([^&]+)'));
          if (m) {
            try { return decodeURIComponent(m[1]); } catch(e) { return m[1]; }
          }
          return null;
        };

        const error = getParam('error');
        const errorDesc = getParam('error_description');

        if (error) {
          toast.error('Google Sign-In cancelled or error: ' + (errorDesc || error));
          nav('/login');
          return;
        }

        let idToken = getParam('id_token') || getParam('credential');
        let accessToken = getParam('access_token');
        const code = getParam('code');

        // If Google returned authorization code, exchange it via serverless endpoint
        if (code && !idToken && !accessToken) {
          setStatusText('Exchanging authorization code with Google...');
          try {
            const redirectUri = `${window.location.origin}/auth/google/callback`;
            const { data } = await api.post('/auth/google-exchange', { code, redirect_uri: redirectUri });
            if (data?.id_token) idToken = data.id_token;
            if (data?.access_token) accessToken = data.access_token;
          } catch (e) {
            console.warn('Code exchange error:', e);
          }
        }

        let email = '';
        let name = 'Google User';
        let avatar = '';

        // 1. Decode ID Token JWT with robust UTF-8 support
        if (idToken) {
          const payload = decodeGoogleJwt(idToken);
          if (payload) {
            email = payload.email || email;
            name = payload.name || payload.given_name || name;
            avatar = payload.picture || avatar;
          }
        }

        // 2. Query Google UserInfo API if access_token is present and profile needs enrichment
        if (accessToken && (!email || !avatar)) {
          setStatusText('Retrieving your Google profile...');
          const endpoints = [
            'https://www.googleapis.com/oauth2/v3/userinfo',
            'https://openidconnect.googleapis.com/v1/userinfo',
            'https://www.googleapis.com/userinfo/v2/me'
          ];
          for (const ep of endpoints) {
            try {
              const res = await fetch(ep, {
                headers: { Authorization: 'Bearer ' + accessToken },
              });
              if (res.ok) {
                const profile = await res.json();
                if (profile.email) email = profile.email;
                if (profile.name) name = profile.name || profile.given_name;
                if (profile.picture) avatar = profile.picture;
                if (email) break;
              }
            } catch (e) {
              console.warn('Could not fetch userinfo from Google API endpoint:', ep, e);
            }
          }
        }

        if (!email) {
          console.error('Google Auth Failed. Current URL was:', window.location.href);
          toast.error('Could not retrieve email from Google. Please try signing in again.');
          nav('/login');
          return;
        }

        setStatusText('Signing in as ' + email + '...');
        const loginRes = await loginWithGoogle({
          email,
          name,
          avatar,
          idToken: idToken || accessToken,
        });

        if (loginRes.ok) {
          const userObj = loginRes.user;
          const sub = userObj?.subscription || null;
          const isSubActive = (s) => {
            if (!s) return false;
            const st = (s.status || "").toLowerCase();
            const valid = st === "active" || st === "trial" || s.is_trial === true;
            if (!valid) return false;
            if (!s.expires_at) return true;
            const exp = new Date(s.expires_at).getTime();
            return !isNaN(exp) && exp > Date.now();
          };
          if (userObj?.is_admin || userObj?.email?.toLowerCase() === "contact@officialdukaan.in") {
            nav('/admin');
            return;
          }

          sessionStorage.removeItem("dukaan_mobile_auth");
          const hasSub = Boolean(isSubActive(sub));
          nav(hasSub ? '/app' : '/subscribe');
        } else {
          toast.error(loginRes.error || 'Failed to complete Google authentication.');
          nav('/login');
        }
      } catch (err) {
        console.error('Google Auth Callback Error:', err);
        toast.error('An error occurred while signing in with Google.');
        nav('/login');
      }
    };

    processGoogleAuth();
  }, [location, loginWithGoogle, nav]);

  return (
    <div className='min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center'>
      <div className='bg-white p-8 rounded-3xl border border-slate-200 shadow-xl max-w-sm w-full space-y-4'>
        <div className='w-14 h-14 mx-auto rounded-2xl bg-slate-50 border border-slate-200 grid place-items-center shadow-xs'>
          <svg width='28' height='28' viewBox='0 0 24 24'>
            <path fill='#4285F4' d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z' />
            <path fill='#34A853' d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z' />
            <path fill='#FBBC05' d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z' />
            <path fill='#EA4335' d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z' />
          </svg>
        </div>
        <div className='space-y-1'>
          <h2 className='font-bold text-slate-900 text-lg'>Google Accounts</h2>
          <p className='text-xs text-slate-500 font-medium'>{statusText}</p>
        </div>
        <div className='pt-2'>
          <div className='w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto' />
        </div>
      </div>
    </div>
  );
}
