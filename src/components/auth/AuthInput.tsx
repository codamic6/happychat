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
    <div className="space-y-2 group w-full">
      <div className="relative">
        {/* Outer Glow Effect */}
        <div className={cn(
          "absolute -inset-[1px] rounded-2xl transition-all duration-500 opacity-0 group-focus-within:opacity-100 blur-sm pointer-events-none",
          error ? "bg-destructive/40" : "bg-primary/30"
        )} />
        
        <div className="relative overflow-hidden rounded-2xl">
          {Icon && (
            <div className={cn(
              "absolute left-4 top-1/2 -translate-y-1/2 transition-colors z-20",
              isFocused ? "text-primary" : "text-muted-foreground"
            )}>
              <Icon className="w-5 h-5" />
            </div>
          )}
          
          <Input
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={cn(
              "h-14 bg-[#0d0d0d]/90 border border-white/5 rounded-2xl transition-all duration-300 relative z-10",
              Icon ? "pl-12" : "pl-5",
              "focus-visible:ring-1 focus-visible:ring-primary/50 focus-visible:ring-offset-0",
              "placeholder:transition-opacity placeholder:duration-300",
              "text-white font-medium",
              // Hide placeholder when label is floating to keep it clean
              isFloating ? "placeholder:opacity-100" : "placeholder:opacity-0",
              error && "border-destructive/50 focus-visible:ring-destructive",
              className
            )}
            {...props}
          />
          
          <motion.label
            initial={false}
            animate={{
              top: isFloating ? 8 : "50%",
              y: isFloating ? 0 : "-50%",
              scale: isFloating ? 0.75 : 1,
              left: isFloating ? (Icon ? 44 : 16) : (Icon ? 48 : 20),
              opacity: isFloating ? 0.6 : 0.4,
              color: error ? "var(--destructive)" : (isFocused ? "var(--primary)" : "var(--muted-foreground)")
            }}
            transition={{ type: "spring", stiffness: 400, damping: 35 }}
            className="absolute pointer-events-none font-black uppercase tracking-[0.2em] text-[10px] z-20 origin-left"
          >
            {label}
          </motion.label>
        </div>
      </div>
      
      {error && (
        <motion.p
          initial={{ opacity: 0, x: -5 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-[9px] font-black uppercase tracking-[0.2em] text-destructive pl-4"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}
