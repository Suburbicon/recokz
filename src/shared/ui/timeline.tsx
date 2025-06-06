import * as React from "react";
import { cn } from "@/shared/lib/cn";
import { cva, type VariantProps } from "class-variance-authority";

const TimelineContext = React.createContext<{
  totalItems: number;
  currentIndex: number;
}>({
  totalItems: 0,
  currentIndex: 0,
});

const timelineVariants = cva("relative flex flex-col gap-4", {
  variants: {
    variant: {
      default: "",
      active: "",
    },
    size: {
      sm: "text-sm",
      md: "text-base",
      lg: "text-lg",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "md",
  },
});

const timelineItemVariants = cva("relative flex gap-4", {
  variants: {
    variant: {
      default: "",
      active: "",
    },
    size: {
      sm: "text-sm",
      md: "text-base",
      lg: "text-lg",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "md",
  },
});

const timelineBulletVariants = cva(
  "flex items-center justify-center rounded-full border-2",
  {
    variants: {
      variant: {
        default: "bg-white border-white",
        active: "border-secondary bg-secondary text-secondary-foreground",
      },
      size: {
        sm: "h-4 w-4",
        md: "h-6 w-6",
        lg: "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  },
);

const timelineLineVariants = cva("absolute w-0.5 left-1/2 -translate-x-1/2", {
  variants: {
    variant: {
      default: "bg-white",
      active: "bg-primary",
    },
    size: {
      sm: "top-[20px] h-[calc(100%-20px+16px)]",
      md: "top-[24px] h-[calc(100%-24px+16px)]",
      lg: "top-[32px] h-[calc(100%-32px+16px)]",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "md",
  },
});

interface TimelineProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof timelineVariants> {
  active?: number;
}

interface TimelineItemProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title">,
    VariantProps<typeof timelineItemVariants> {
  bullet?: React.ReactNode;
  title?: React.ReactNode;
  active?: boolean;
}

const Timeline = React.forwardRef<HTMLDivElement, TimelineProps>(
  ({ className, variant, size, active, children, ...props }, ref) => {
    const childrenArray = React.Children.toArray(children);
    return (
      <TimelineContext.Provider
        value={{
          totalItems: childrenArray.length,
          currentIndex: 0,
        }}
      >
        <div
          ref={ref}
          className={cn(timelineVariants({ variant, size, className }))}
          {...props}
        >
          {React.Children.map(children, (child, index) => {
            if (React.isValidElement<TimelineItemProps>(child)) {
              return (
                <TimelineContext.Provider
                  key={index}
                  value={{
                    totalItems: childrenArray.length,
                    currentIndex: index,
                  }}
                >
                  {React.cloneElement(child, {
                    active: index === active,
                    variant,
                    size,
                  })}
                </TimelineContext.Provider>
              );
            }
            return child;
          })}
        </div>
      </TimelineContext.Provider>
    );
  },
);
Timeline.displayName = "Timeline";

const TimelineItem = React.forwardRef<HTMLDivElement, TimelineItemProps>(
  (
    { className, variant, size, bullet, title, active, children, ...props },
    ref,
  ) => {
    const { totalItems, currentIndex } = React.useContext(TimelineContext);
    const isLast = currentIndex === totalItems - 1;

    return (
      <div
        ref={ref}
        className={cn(timelineItemVariants({ variant, size, className }))}
        {...props}
      >
        <div className="flex flex-col items-center relative">
          <div
            className={cn(
              timelineBulletVariants({
                variant: active ? "active" : variant,
                size,
              }),
            )}
          >
            {bullet}
          </div>
          {!isLast && (
            <div
              className={cn(
                timelineLineVariants({
                  variant: active ? "active" : variant,
                  size,
                }),
              )}
            />
          )}
        </div>
        <div className="flex flex-col gap-1">
          {title && <div className="font-medium">{title}</div>}
          <div>{children}</div>
        </div>
      </div>
    );
  },
);
TimelineItem.displayName = "TimelineItem";

export { Timeline, TimelineItem };
