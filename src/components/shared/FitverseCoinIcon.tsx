import { ImgHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import coinImage from "@/assets/about/coin.png";

type FitverseCoinIconProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt">;

export function FitverseCoinIcon({ className, ...props }: FitverseCoinIconProps) {
  return (
    <img
      src={coinImage}
      alt=""
      aria-hidden="true"
      draggable={false}
      className={cn("inline-block object-contain scale-[1.3] origin-center", className)}
      {...props}
    />
  );
}