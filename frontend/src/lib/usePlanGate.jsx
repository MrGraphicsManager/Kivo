import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, ArrowRight } from "lucide-react";

const TIER = { starter: 1, business: 2, cafe: 2.5, premium: 3, pro: 4 };
const NAMES = { business: "Business", premium: "Premium", pro: "Kivo Pro" };

/**
 * Wrap a feature/link. If user's plan is below `requiredPlan`, clicks show an upgrade dialog
 * and children render inline with a lock overlay via `renderLocked`.
 */
export function usePlanGate(requiredPlan) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const nav = useNavigate();
  const current = user?.subscription?.plan || "";
  const isAdmin = !!user?.is_admin;
  const isProBonus = !!(user?.is_pro || user?.subscription?.pro_bonus || user?.subscription?.plan === "pro" || user?.subscription?.plan === "cafe");
  const locked = !isAdmin && !isProBonus && (TIER[current] || 0) < (TIER[requiredPlan] || 0);

  const gate = (fn) => (e) => {
    if (locked) {
      if (e) { e.preventDefault(); e.stopPropagation(); }
      setOpen(true);
      return;
    }
    return fn?.(e);
  };

  const dialog = (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Crown className="w-5 h-5 text-brand-terracotta"/> {NAMES[requiredPlan]} plan required</DialogTitle></DialogHeader>
        <p className="text-sm text-brand-indigo/70">
          This feature is available on the <b>{NAMES[requiredPlan]}</b> plan and above. Upgrade to unlock customers, udhaar tracking and reports.
        </p>
        <DialogFooter>
          <Button variant="ghost" onClick={()=>setOpen(false)}>Not now</Button>
          <Button data-testid="upgrade-cta" onClick={()=>nav(`/subscribe?plan=${requiredPlan}`)} className="bg-brand-terracotta hover:bg-brand-terracotta/90 text-white">
            Upgrade to {NAMES[requiredPlan]} <ArrowRight className="w-4 h-4 ml-1"/>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return { locked, gate, dialog };
}
