import { cn, getInitials } from "@/lib/utils"

interface AvatarInitialsProps {
  name: string
  color?: string
  size?: number
  className?: string
}

export function AvatarInitials({ name, color = "#7c3aed", size = 40, className }: AvatarInitialsProps) {
  return (
    <div
      className={cn("flex shrink-0 items-center justify-center rounded-full font-semibold text-white", className)}
      style={{ backgroundColor: color, width: size, height: size, fontSize: size * 0.4 }}
      title={name}
    >
      {getInitials(name)}
    </div>
  )
}
