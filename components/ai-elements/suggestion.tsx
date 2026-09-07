"use client";

import { Button } from "@/components/ui/button";
import {
  ScrollArea,
  ScrollBar,
} from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

export type SuggestionsProps = ComponentProps<typeof ScrollArea>;

export const Suggestions = ({
  className,
  children,
  ...props
}: SuggestionsProps) => (
  <ScrollArea className="w-full overflow-x-auto whitespace-nowrap" {...props}>
    <div className={cn("flex w-max flex-nowrap items-center gap-1.5", className)}>
      {children}
    </div>
    <ScrollBar className="hidden" orientation="horizontal" />
  </ScrollArea>
);

export type SuggestionProps = Omit<ComponentProps<typeof Button>, "onClick"> & {
  suggestion: string;
  onClick?: (suggestion: string) => void;
  selected?: boolean;
  preview?: string;
};

export const Suggestion = ({
  suggestion,
  onClick,
  className,
  variant = "outline",
  size = "sm",
  children,
  selected,
  preview,
  style,
  ...props
}: SuggestionProps) => {
  const handleClick = () => {
    onClick?.(suggestion);
  };

  return (
    <Button
      className={cn(
        "cursor-pointer rounded-full px-2.5 py-1 h-7 text-xs transition-[box-shadow,transform,filter]",
        preview &&
          "h-8 overflow-hidden border-0 bg-transparent bg-cover bg-center px-3 font-semibold text-white ring-0 [text-shadow:0_1px_2px_rgb(0_0_0/0.55)] hover:bg-transparent hover:text-white hover:brightness-110",
        selected
          ? preview
            ? "ring-2 ring-foreground/80"
            : "text-foreground bg-accent border-accent-foreground/20 hover:bg-accent"
          : !preview && "text-muted-foreground hover:bg-accent/50",
        className
      )}
      onClick={handleClick}
      size={size}
      type="button"
      variant={variant}
      data-selected={selected}
      style={
        preview
          ? {
              backgroundImage: `linear-gradient(rgb(0 0 0 / 0.22), rgb(0 0 0 / 0.22)), ${preview}`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              ...style,
            }
          : style
      }
      {...props}
    >
      {children || suggestion}
    </Button>
  );
};
