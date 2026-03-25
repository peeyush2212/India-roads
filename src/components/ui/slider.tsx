import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

export interface SliderProps extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  label?: string;
  valueLabel?: string;
}

export function Slider({ className, label, valueLabel, ...props }: SliderProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {(label || valueLabel) && (
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">{label}</div>
          <div className="text-xs text-muted-foreground tabular-nums">{valueLabel}</div>
        </div>
      )}
      <SliderPrimitive.Root
        className={cn(
          "relative flex w-full touch-none select-none items-center",
          props.disabled && "opacity-60"
        )}
        {...props}
      >
        <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
          <SliderPrimitive.Range className="absolute h-full bg-primary" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb className="block h-4 w-4 rounded-full border border-border bg-background shadow transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
      </SliderPrimitive.Root>
    </div>
  );
}
