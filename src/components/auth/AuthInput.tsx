'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { useState } from 'react';

interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: LucideIcon;
  error?: string;
}

export function AuthInput({ label, icon: Icon, error, className, ...props }: AuthInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = props.value && props.value.toString().length > 0;
  const isFloating = isFocused || hasValue;

  return (
    <div className="space-y-2 group">
      <div className="relative">
        {/* Outer Glow */}
        <div className={cn(
          "absolute inset-0 rounded-xl transition-all duration-500 blur-sm pointer-events-none opacity-0 group-focus-within:opacity-100",
          error ? "bg-destructive/20" : "bg-primary/20"
        )} />
        
        <div className="relative">
          {Icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors z-20">
              <Icon className="w-5 h-5" />
            </div>
          )}
          
          <Input
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={cn(
              "h-14 bg-[#0d0d0d]/80 border-white/5 rounded-xl transition-all duration-300 relative z-10",
              Icon ? "pl-12" : "pl-4",
              "focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0",
              "placeholder:transition-opacity placeholder:duration-300",
              // Hide placeholder when the label is sitting in the middle to prevent overlap
              isFloating ? "placeholder:opacity-100" : "placeholder:opacity-0",
              error && "border-destructive/50 focus-visible:ring-destructive",
              className
            )}
            {...props}
          />
          
          <motion.label
            initial={false}
            animate={{
              top: isFloating ? -10 : "50%",
              scale: isFloating ? 0.85 : 1,
              left: isFloating ? (Icon ? 36 : 12) : (Icon ? 48 : 16),
              opacity: isFloating ? 1 : 0.5,
              color: error ? "var(--destructive)" : (isFocused ? "var(--primary)" : "var(--muted-foreground)")
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute pointer-events-none font-bold uppercase tracking-widest text-[10px] -translate-y-1/2 z-20 px-2"
            style={{ 
              backgroundColor: isFloating ? '#050505' : 'transparent',
            }}
          >
            {label}
          </motion.label>
        </div>
      </div>
      
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[10px] font-black uppercase tracking-widest text-destructive pl-2"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}
