import { Leaf, Moon, Sparkles, Waves } from "lucide-react";
import type { UserAvatarPreference } from "@/lib/me-api";

const colorClassMap: Record<string, string> = {
  clay: "bg-clay text-white",
  dusk: "bg-dusk text-white",
  moss: "bg-moss text-white",
  rosewood: "bg-rosewood text-white"
};

export function AvatarView({
  avatar,
  fallbackName,
  size = "md"
}: {
  avatar?: UserAvatarPreference;
  fallbackName: string;
  size?: "lg" | "md" | "sm";
}) {
  const sizeClass = size === "lg" ? "h-16 w-16 text-lg" : size === "sm" ? "h-10 w-10 text-xs" : "h-12 w-12 text-sm";
  const iconSize = size === "lg" ? 24 : size === "sm" ? 17 : 20;

  if (avatar?.type === "url" && avatar.url) {
    return <ImageAvatar sizeClass={sizeClass} url={avatar.url} />;
  }

  if (avatar?.type === "upload" && avatar.url) {
    return <ImageAvatar sizeClass={sizeClass} url={avatar.url} />;
  }

  const label = avatar?.type === "style" && avatar.initial ? avatar.initial : fallbackName.trim().slice(0, 1).toUpperCase() || "M";
  const colorClass = avatar?.type === "style" ? colorClassMap[avatar.color] ?? colorClassMap.rosewood : colorClassMap.rosewood;

  return (
    <div className={`${sizeClass} flex shrink-0 items-center justify-center rounded-full font-semibold shadow-button ${colorClass}`}>
      {avatar?.type === "style" && avatar.initial ? label : <AvatarIcon icon={avatar?.type === "style" ? avatar.icon : "spark"} size={iconSize} />}
    </div>
  );
}

function ImageAvatar({ sizeClass, url }: { sizeClass: string; url: string }) {
  return (
    <div
      aria-label="头像"
      className={`${sizeClass} shrink-0 rounded-full bg-cover bg-center shadow-button`}
      role="img"
      style={{ backgroundImage: `url("${url.replace(/"/g, "%22")}")` }}
    />
  );
}

function AvatarIcon({ icon, size }: { icon?: string; size: number }) {
  if (icon === "moon") return <Moon size={size} />;
  if (icon === "leaf") return <Leaf size={size} />;
  if (icon === "wave") return <Waves size={size} />;
  return <Sparkles size={size} />;
}
