"use client";

import { Toaster } from "sonner";

export function ToasterProvider() {
  return (
    <Toaster
      richColors
      position="top-center"
      toastOptions={{
        style: {
          borderRadius: "20px",
          border: "1px solid rgba(24, 33, 38, 0.08)",
        },
      }}
    />
  );
}
