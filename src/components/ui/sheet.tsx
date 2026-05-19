"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;
export const SheetPortal = DialogPrimitive.Portal;

export function SheetOverlay({
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      className={cn(
        "fixed inset-0 z-50 bg-black/70 backdrop-blur-sm sheet-overlay",
        className,
      )}
      {...props}
    />
  );
}

export function SheetContent({
  className,
  children,
  title,
  ...props
}: ComponentProps<typeof DialogPrimitive.Content> & {
  title: string;
  children: ReactNode;
}) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <DialogPrimitive.Content
        className={cn(
          "fixed z-50 bg-card border-2 border-border shadow-xl outline-none sheet-content-mobile",
          // Mobile: sheet from bottom
          "bottom-0 inset-x-0 rounded-t-2xl pb-[env(safe-area-inset-bottom)]",
          // Desktop: centered dialog
          "md:bottom-auto md:inset-x-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2",
          "md:rounded-xl md:max-w-lg md:w-full",
          className,
        )}
        {...props}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <DialogPrimitive.Title className="font-display text-2xl leading-none">
            {title}
          </DialogPrimitive.Title>
          <DialogPrimitive.Close
            aria-label="Cerrar"
            className="inline-flex items-center justify-center w-9 h-9 rounded-md hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </DialogPrimitive.Close>
        </div>
        <DialogPrimitive.Description className="sr-only">
          {title}
        </DialogPrimitive.Description>

        {/* Content */}
        <div className="p-5 md:p-6">{children}</div>
      </DialogPrimitive.Content>
    </SheetPortal>
  );
}
