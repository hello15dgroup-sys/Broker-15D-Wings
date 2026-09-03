import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Rocket, 
  Search, 
  FileText, 
  Users, 
  CreditCard,
  ChevronRight,
  CheckCircle2,
  X
} from 'lucide-react';

interface FeatureTourModalProps {
  onComplete: () => void;
}

export const FeatureTourModal: React.FC<FeatureTourModalProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "Welcome to 15D Wings Broker CRM",
      description: "Stop stressing operators and burning them out. We've built an all-in-one ecosystem that gives you certainty and control.",
      icon: <Rocket className="w-8 h-8 text-purple-600" />,
      color: "bg-purple-100"
    },
    {
      title: "Live Market Rates",
      description: "Click 'Book Flight' to instantly see live market rates and estimates. No more waiting hours for operators to reply.",
      icon: <Search className="w-8 h-8 text-blue-600" />,
      color: "bg-blue-100"
    },
    {
      title: "Generate Proposals",
      description: "Create beautiful, white-labeled proposals for your clients in seconds. Win more deals with professional presentation.",
      icon: <FileText className="w-8 h-8 text-emerald-600" />,
      color: "bg-emerald-100"
    },
    {
      title: "Client & Operator CRM",
      description: "Manage all your clients and verified operators in one place. Send custom onboarding links to build your operator network.",
      icon: <Users className="w-8 h-8 text-amber-600" />,
      color: "bg-amber-100"
    },
    {
      title: "Same-Day Payment Settlement",
      description: "Our payment engine guarantees certainty. Funds are secured in escrow and settled same-day, protecting both you and the operator.",
      icon: <CreditCard className="w-8 h-8 text-rose-600" />,
      color: "bg-rose-100"
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-lg bg-white rounded-[2rem] shadow-2xl overflow-hidden relative"
      >
        <button 
          onClick={onComplete}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8 md:p-10">
          <div className="flex justify-center mb-8">
            <div className="flex gap-2">
              {steps.map((_, idx) => (
                <div 
                  key={idx} 
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === currentStep ? "w-8 bg-purple-600" : 
                    idx < currentStep ? "w-2 bg-purple-300" : "w-2 bg-gray-200"
                  }`}
                />
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="text-center"
            >
              <div className={`w-20 h-20 mx-auto rounded-3xl ${steps[currentStep].color} flex items-center justify-center mb-6 shadow-inner`}>
                {steps[currentStep].icon}
              </div>
              
              <h2 className="text-2xl font-sync font-bold text-gray-900 mb-4 tracking-tight uppercase">
                {steps[currentStep].title}
              </h2>
              
              <p className="text-gray-600 font-sans leading-relaxed text-sm md:text-base">
                {steps[currentStep].description}
              </p>
            </motion.div>
          </AnimatePresence>

          <div className="mt-10">
            <button
              onClick={handleNext}
              className="w-full py-4 bg-gray-900 hover:bg-black text-white rounded-2xl font-bold font-sync uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-gray-900/20"
            >
              <span>{currentStep === steps.length - 1 ? "ENTER WORKSPACE" : "NEXT"}</span>
              {currentStep === steps.length - 1 ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
