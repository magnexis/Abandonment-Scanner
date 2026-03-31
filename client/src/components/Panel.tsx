import type React from "react";
import clsx from "clsx";

export function Panel({
  className,
  children,
  ...props
}: {
  className?: string;
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLElement>) {
  return (
    <section
      {...props}
      className={clsx("rounded-2xl border border-border bg-panel/90 shadow-panel backdrop-blur transition-all duration-200", className)}
    >
      {children}
    </section>
  );
}
