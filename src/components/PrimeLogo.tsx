import logo from "@/assets/primeit-logo.png";
import { forwardRef } from "react";

interface Props { className?: string; variant?: "dark" | "light"; size?: "sm" | "md" | "lg" }

export const PrimeLogo = forwardRef<HTMLImageElement, Props>(({ className = "", size = "md" }, ref) => {
  const sizes = { sm: "h-10", md: "h-14", lg: "h-20" };
  return <img ref={ref} src={logo} alt="PrimeIT" className={`${sizes[size]} w-auto object-contain ${className}`} />;
});

PrimeLogo.displayName = "PrimeLogo";
