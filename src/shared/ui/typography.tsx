import { ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/shared/lib/cn";

const textStyles = cva("font-medium rounded-full active:opacity-80", {
  variants: {
    color: {
      white: "text-white",
      "light-green": "text-light-green",
      "accent-blue": "text-blue",
      "dark-blue": "text-dark-blue",
      "gray-100": "text-gray-100",
      "gray-200": "text-gray-200",
      "gray-300": "text-gray-300",
      "white-50": "text-white-50",
      "white-75": "text-white-75",
      green: "text-accent-green",
    },
    size: {
      "h1-reg": "xl:text-[70px] text-[50px] leading-[1.05] tracking-[-0.04em]",
      "h2-med":
        "lg:text-[54px] text-[32px] leading-[1] font-medium tracking-[-0.04em]",
      "h3-med": "text-[32px] leading-[1.1] font-medium",
      "h4-med": "sm:text-[24px] text-[20px] leading-[1.15] font-medium",
      "h5-bold": "text-[18px] leading-[1.3] font-medium",
      subtitle: "text-[22px] leading-[1.35] font-extralight tracking-[-0.03em]",
      "body-18": "text-[18px] leading-[1.3] font-light",
      "body-16": "sm:text-[16px] text-[14px] leading-[1.35] font-light",
      "body-14": "text-[14px] leading-[1.4] font-light",
      "cap-18": "lg:text-[18px] text-[12px] leading-auto font-light",
      "cap-14": "lg:text-[14px] text-[12px] leading-[1.2] font-light",
    },
  },
  defaultVariants: {
    size: "body-18",
    color: "white",
  },
});

type TextVariants = VariantProps<typeof textStyles>;

interface Props extends TextVariants {
  children: ReactNode;
  className?: string;
}

export function Typography({ children, className, ...props }: Props) {
  return <div className={cn(textStyles(props), className)}>{children}</div>;
}
