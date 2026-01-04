"use client";

import clsx from "clsx";

interface LoadingProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Loading({ size = "md", className }: LoadingProps) {
  const sizes = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-3",
    lg: "h-12 w-12 border-4",
  };

  return (
    <div
      className={clsx(
        "animate-spin rounded-full border-amber-500 border-t-transparent",
        sizes[size],
        className
      )}
    />
  );
}

export function LoadingScreen({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] gap-4">
      <Loading size="lg" />
      {message && (
        <p className="text-zinc-500 dark:text-zinc-400">{message}</p>
      )}
    </div>
  );
}
