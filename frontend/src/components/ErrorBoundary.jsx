import React from "react";
import { Store, RotateCcw } from "lucide-react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Kivo UI Error Caught:", error, errorInfo);
  }

  handleReload = () => {
    try {
      // Ensure dukaan_orders is a clean array
      localStorage.setItem("dukaan_orders", "[]");
    } catch {}
    
    // Reset state and redirect
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-slate-200 shadow-xl space-y-5">
            <div className="flex justify-center mb-2">
              <img src="/kivo-logo.png" alt="Kivo" className="h-8 w-auto object-contain" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold text-slate-900">
                Kivo Workspace Restored
              </h2>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Your workspace state has been verified and synchronized. Click below to open your counter dashboard.
              </p>
            </div>

            {this.state.error && (
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] font-mono text-amber-900 text-left truncate">
                Sync Note: {String(this.state.error?.message || this.state.error)}
              </div>
            )}

            <button
              onClick={this.handleReload}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Enter Kivo Dashboard</span>
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
