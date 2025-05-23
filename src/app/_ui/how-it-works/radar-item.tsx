import { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

export const RadarItem = ({
  children,
  className,
  size = "lg",
  absolute,
}: {
  children: ReactNode;
  className?: string;
  size?: "md" | "lg";
  absolute?: boolean;
}) => {
  return (
    <div
      className={cn(
        "bg-white-4 flex items-center justify-center rounded-full border border-white-10",
        {
          "lg:h-13 lg:px-6 h-10 px-4": size === "md",
          "lg:h-17.5 lg:w-17.5 h-11 w-11": size === "lg",
        },
        absolute && "absolute",
        className,
      )}
    >
      {children}
    </div>
  );
};
