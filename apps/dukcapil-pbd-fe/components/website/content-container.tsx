import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { cn } from "@/lib/utils";

type ContentContainerProps = ComponentPropsWithoutRef<"div"> & {
  children: ReactNode;
};

export function ContentContainer({
  children,
  className,
  ...props
}: ContentContainerProps) {
  return (
    <div
      className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", className)}
      {...props}
    >
      {children}
    </div>
  );
}

