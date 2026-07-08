import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

export default function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgClass = type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800';
  const Icon = type === 'success' ? CheckCircle2 : AlertCircle;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg max-w-md ${bgClass}`}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      <span className="text-sm font-medium">{message}</span>
      <button
        onClick={onClose}
        className="p-1 hover:bg-black/5 rounded-full transition-colors ml-auto"
        aria-label="Close notification"
      >
        <X className="w-4 h-4 opacity-65" />
      </button>
    </motion.div>
  );
}
