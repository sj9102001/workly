'use client';

import { toast as sonnerToast } from "sonner";

export function useToast() {
  return {
    toast: (options: {
      title?: string;
      description?: string;
      variant?: "default" | "destructive" | "success";
    }) => {
      const { title, description, variant = "default" } = options;
      const message = title
        ? `${title}${description ? ": " + description : ""}`
        : description;

      if (variant === "destructive") {
        sonnerToast.error(message);
      } else if (variant === "success") {
        sonnerToast.success(message);
      } else {
        sonnerToast(message);
      }
    },
  };
}
