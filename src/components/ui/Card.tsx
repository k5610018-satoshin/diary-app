"use client";

import { HTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, hoverable = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(
          "bg-white dark:bg-zinc-800 rounded-2xl p-6 shadow-sm border border-zinc-200/60 dark:border-zinc-700/60",
          "backdrop-blur-sm transition-all duration-300",
          hoverable &&
            "hover:shadow-xl hover:shadow-amber-500/10 hover:-translate-y-1 cursor-pointer hover:border-amber-300/60 dark:hover:border-amber-600/40",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";
