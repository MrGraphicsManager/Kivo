import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Store, LayoutDashboard, BarChart3, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';

const steps = [
  { text: "Setting up your Kivo...", icon: Store, duration: 280 },
  { text: "Preparing your dashboard...", icon: LayoutDashboard, duration: 280 },
  { text: "Loading your business...", icon: BarChart3, duration: 280 },
  { text: "Almost ready...", icon: Sparkles, duration: 240 },
  { text: "Welcome to Kivo!", icon: CheckCircle2, duration: 180 },
];

const TOTAL_DURATION = steps.reduce((acc, step) => acc + step.duration, 0); // ~1260ms

const OnboardingLoader = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const onCompleteRef = useRef(onComplete);
  const hasFinishedRef = useRef(false);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const triggerComplete = () => {
    if (!hasFinishedRef.current) {
      hasFinishedRef.current = true;
      if (typeof onCompleteRef.current === "function") {
        onCompleteRef.current();
      }
    }
  };

  useEffect(() => {
    let currentDuration = 0;
    const stepTimeouts = [];

    steps.forEach((step, index) => {
      if (index === 0) return;
      currentDuration += steps[index - 1].duration;
      const timeout = setTimeout(() => {
        setCurrentStep(index);
      }, currentDuration);
      stepTimeouts.push(timeout);
    });

    const finishTimeout = setTimeout(triggerComplete, TOTAL_DURATION);
    const fallbackTimeout = setTimeout(triggerComplete, TOTAL_DURATION + 600);

    return () => {
      stepTimeouts.forEach(clearTimeout);
      clearTimeout(finishTimeout);
      clearTimeout(fallbackTimeout);
    };
  }, []); // Strictly empty dependency array so parent re-renders never cancel completion

  useEffect(() => {
    const startTime = Date.now();
    let animationFrame;

    const updateProgress = () => {
      const elapsedTime = Date.now() - startTime;
      const currentProgress = Math.min((elapsedTime / TOTAL_DURATION) * 100, 100);
      setProgress(currentProgress);

      if (elapsedTime < TOTAL_DURATION) {
        animationFrame = requestAnimationFrame(updateProgress);
      }
    };

    animationFrame = requestAnimationFrame(updateProgress);

    return () => cancelAnimationFrame(animationFrame);
  }, []);

  const CurrentIcon = steps[currentStep]?.icon || Sparkles;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#F8FAFC]/95 backdrop-blur-xl text-slate-900 min-h-screen select-none px-4">
      {/* Top Logo */}
      <motion.div 
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="absolute top-10 flex items-center justify-center"
      >
        <img src="/kivo-logo.png" alt="Kivo" className="h-9 w-auto object-contain" />
      </motion.div>

      <div className="w-full max-w-sm px-6 flex flex-col items-center">
        {/* Step Indicator */}
        <div className="h-32 flex flex-col items-center justify-center relative w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center text-center absolute"
            >
              <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center mb-3 text-blue-600 shadow-sm">
                <CurrentIcon size={26} strokeWidth={2} />
              </div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                {steps[currentStep]?.text || "Loading..."}
              </h2>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Progress Bar */}
        <div className="w-full mt-6">
          <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden p-0.5 border border-slate-300">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 rounded-full"
              style={{ width: `${progress}%` }}
              layout
            />
          </div>
        </div>

        {/* Manual continue if user doesn't want to wait */}
        <button
          onClick={triggerComplete}
          className="mt-8 text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1.5 transition-colors py-1.5 px-3 rounded-lg hover:bg-slate-100 cursor-pointer"
        >
          <span>Continue directly</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default OnboardingLoader;
