import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/shared/lib/cn";
import { InputHTMLAttributes } from "react";

const inputVariants = cva(
  "border-input flex w-full min-w-0 border bg-transparent shadow-xs file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      inputSize: {
        lg: "h-15.75 rounded-2xl px-8 py-1 text-base",
        md: "h-9 rounded-md px-3 py-2 text-sm",
      },
    },
    defaultVariants: {
      inputSize: "md",
    },
  },
);

export type InputProps = InputHTMLAttributes<HTMLInputElement> &
  VariantProps<typeof inputVariants>;

function Input({ className, type, inputSize, ...props }: InputProps) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(inputVariants({ inputSize, className }))}
      {...props}
    />
  );
}

export { Input, inputVariants };
