"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: "group toast group-[.toaster]:bg-[#f8f9fa] group-[.toaster]:text-slate-700 group-[.toaster]:border-slate-200 group-[.toaster]:shadow-md font-sans rounded-lg border p-4 text-xs font-semibold flex items-center gap-2",
          description: "group-[.toast]:text-slate-500",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success: "group-[.toaster]:!bg-[#e6f4ea] group-[.toaster]:!text-[#137333] group-[.toaster]:!border-[#a8dab5] group-[.toast]:!shadow-sm",
          error: "group-[.toaster]:!bg-[#fce8e6] group-[.toaster]:!text-[#c5221f] group-[.toaster]:!border-[#fad2cf] group-[.toast]:!shadow-sm",
          warning: "group-[.toaster]:!bg-[#fef7e0] group-[.toaster]:!text-[#b06000] group-[.toaster]:!border-[#feebc8] group-[.toast]:!shadow-sm",
          info: "group-[.toaster]:!bg-[#e8f0fe] group-[.toaster]:!text-[#1a73e8] group-[.toaster]:!border-[#d2e3fc] group-[.toast]:!shadow-sm",
        }
      }}
      {...props}
    />
  );
};

export { Toaster };
