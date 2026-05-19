"use client";

import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

export const Select = SelectPrimitive.Root;
export const SelectGroup = SelectPrimitive.Group;
export const SelectValue = SelectPrimitive.Value;

export function SelectTrigger({
  className,
  children,
  ...props
}: ComponentProps<typeof SelectPrimitive.Trigger>) {
  return (
    <SelectPrimitive.Trigger
      className={cn(
        "inline-flex items-center justify-between gap-2 w-full px-3 py-3 rounded-md border-2 border-border bg-card",
        "text-base font-semibold",
        "focus:outline-none focus:ring-2 focus:ring-ring",
        "data-[placeholder]:text-muted-foreground data-[placeholder]:font-normal",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDown className="w-4 h-4 opacity-60 shrink-0" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

export function SelectContent({
  className,
  children,
  ...props
}: ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        position="popper"
        sideOffset={4}
        className={cn(
          "relative z-50 max-h-[300px] min-w-[var(--radix-select-trigger-width)] overflow-hidden",
          "rounded-md border-2 border-border bg-card shadow-lg",
          className,
        )}
        {...props}
      >
        <SelectPrimitive.Viewport className="p-1">
          {children}
        </SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

export function SelectItem({
  className,
  children,
  ...props
}: ComponentProps<typeof SelectPrimitive.Item> & { children: ReactNode }) {
  return (
    <SelectPrimitive.Item
      className={cn(
        "relative flex items-center gap-2 pl-9 pr-3 py-2.5 rounded-sm text-base cursor-pointer",
        "outline-none data-[highlighted]:bg-muted data-[state=checked]:bg-primary/10",
        className,
      )}
      {...props}
    >
      <span className="absolute left-2 flex items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <Check className="w-4 h-4 text-primary" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText asChild>
        <span className="flex items-center gap-2">{children}</span>
      </SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}
