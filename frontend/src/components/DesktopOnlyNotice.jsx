import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Monitor, 
  Laptop, 
  Copy, 
  Check, 
  Share2, 
  ArrowLeft, 
  Keyboard, 
  Printer, 
  FileSpreadsheet, 
  Smartphone, 
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

/**
 * Notice component rendered when a mobile device / screen attempts to access
 * the Dukaan Dashboard (/app/*) or Subscription Checkout (/subscribe).
 * Pure white theme with crisp slate typography.
 *
 * @param {string} target - 'dashboard' | 'subscription'
 */
export default function DesktopOnlyNotice({ target = 'dashboard' }) {
  const [copied, setCopied] = useState(false);

  const pcUrl = target === 'subscription' ? 'https://officialdukaan.in/subscribe' : 'https://officialdukaan.in/app';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(pcUrl);
      setCopied(true);
      toast.success('Link copied to clipboard! Open it on your PC or Laptop.', {
        duration: 4000,
      });
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      toast.error('Unable to copy link. Please manually copy: ' + pcUrl);
    }
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `Open Kivo POS on your Counter PC / Laptop:\n${pcUrl}\n\n(Keyboard shortcuts, thermal printer and khata ledger)`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const isSub = target === 'subscription';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between p-4 sm:p-6 relative overflow-hidden selection:bg-brand-terracotta selection:text-white">
      
      {/* Ambient subtle glowing background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[450px] h-[450px] bg-orange-100/60 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-indigo-100/50 rounded-full blur-[130px] pointer-events-none" />

      {/* Top Header Bar */}
      <header className="relative z-10 max-w-md mx-auto w-full flex items-center justify-between pt-2 pb-4 border-b border-slate-200 px-1">
        <Link to="/" className="flex items-center gap-2 group shrink-0">
          <img 
            src="/kivo-logo.png" 
            alt="Kivo" 
            className="h-7 sm:h-8 w-auto object-contain drop-shadow-sm" 
          />
        </Link>

        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-50 border border-orange-200 text-[10px] font-bold text-orange-700 shrink-0">
          <Monitor className="w-3 h-3 text-orange-600" />
          <span>Desktop Recommended</span>
        </span>
      </header>

      {/* Main Notice Card */}
      <main className="relative z-10 max-w-md mx-auto w-full my-auto py-5 space-y-4">
        
        {/* Visual Illustration Badge */}
        <div className="text-center">
          <div className="relative inline-block">
            <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-tr from-brand-terracotta to-orange-500 p-0.5 shadow-md mx-auto mb-3">
              <div className="w-full h-full rounded-[22px] bg-white flex items-center justify-center relative overflow-hidden">
                <Monitor className="w-9 h-9 sm:w-10 sm:h-10 text-slate-900" />
                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-brand-terracotta flex items-center justify-center shadow-md border-2 border-white">
                  <Laptop className="w-3.5 h-3.5 text-white" />
                </div>
              </div>
            </div>
            <div className="absolute -top-1 -right-2 bg-amber-400 text-slate-950 text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-md flex items-center gap-0.5">
              <Sparkles className="w-2.5 h-2.5" /> PC / Laptop
            </div>
          </div>

          <h1 className="font-display text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-snug px-1">
            {isSub 
              ? 'Subscriptions are Available on Desktop & Laptop' 
              : 'Kivo Counter POS is Built for Desktop & Laptop'}
          </h1>
          
          <p className="mt-2.5 text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md mx-auto px-2 font-medium">
            {isSub
              ? 'To subscribe, configure billing plans, and set up your shop POS terminal, please open Kivo on your computer.'
              : 'The Kivo Store Management & Billing Terminal is exclusively optimized for PC screens, billing counters, and laptop keyboards.'}
          </p>
        </div>

        {/* 3 Value Pillars for Why Desktop is Required */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-sm">
          <div className="text-[11px] font-extrabold tracking-wider uppercase text-slate-400 font-mono">
            Counter POS Benefits:
          </div>

          <div className="grid gap-2.5">
            <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                <Keyboard className="w-4 h-4" />
              </div>
              <div className="text-left">
                <h4 className="text-xs font-bold text-slate-900">F1–F6 Speed Billing Shortcuts</h4>
                <p className="text-[11px] text-slate-600 leading-tight mt-0.5">
                  Instant billing using keyboard hotkeys and USB barcode scanners for 2-second checkouts.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                <Printer className="w-4 h-4" />
              </div>
              <div className="text-left">
                <h4 className="text-xs font-bold text-slate-900">Thermal Receipt Printing (2" & 3")</h4>
                <p className="text-[11px] text-slate-600 leading-tight mt-0.5">
                  Direct driver communication with thermal slip printers and counter cash drawers.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center shrink-0 mt-0.5">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div className="text-left">
                <h4 className="text-xs font-bold text-slate-900">Dual-Pane Store & Khata Ledger</h4>
                <p className="text-[11px] text-slate-600 leading-tight mt-0.5">
                  Expansive multi-column tables for live inventory stock, GST reports, and customer udhaar.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="space-y-2.5 pt-2">
          <Button
            onClick={handleCopyLink}
            data-testid="copy-pc-link-btn"
            className="w-full h-12 rounded-xl bg-brand-terracotta hover:bg-brand-terracotta/90 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 active:scale-98 transition-all"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-200" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Link Copied to Clipboard!' : 'Copy Link to Open on PC'}</span>
          </Button>

          <div className="grid grid-cols-2 gap-2.5">
            <Button
              onClick={handleShareWhatsApp}
              data-testid="share-whatsapp-btn"
              variant="outline"
              className="h-11 rounded-xl border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Send to WhatsApp</span>
            </Button>

            <Button
              asChild
              variant="outline"
              className="h-11 rounded-xl border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
            >
              <Link to="/">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Home</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Helpful Laptop resize hint */}
        <p className="text-center text-[10px] text-slate-500 font-medium">
          Using a laptop or tablet? Please maximize your browser window for the full counter experience.
        </p>

      </main>

      {/* Footer */}
      <footer className="relative z-10 max-w-xl mx-auto w-full text-center pt-4 pb-2 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
        <span>officialdukaan.in</span>
        <span>© 2026 Kivo · Business Made Simple</span>
      </footer>

    </div>
  );
}
