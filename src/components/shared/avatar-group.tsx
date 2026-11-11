import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "cn"

export interface AvatarPerson {
  id: string
  name: string
  avatarInitials: string
  avatarColor?: string
  role?: string
}

interface AvatarGroupProps {
  people: AvatarPerson[]
  max?: number
  size?: "sm" | "md"
  className?: string
}

export function AvatarGroup({
  people,
  max = 3,
  size = "sm",
  className,
}: AvatarGroupProps) {
  const visible = people.slice(0, max)
  const remaining = people.length - visible.length
  const sizeClass = size === "sm" ? "size-7 text-[10px]" : "size-8 text-xs"

  return (
    <div className={cn("flex items-center -space-x-1.5", className)}>
      {visible.map((person) => (
        <Tooltip key={person.id}>
          <TooltipTrigger asChild>
            <Avatar
              className={cn(
                sizeClass,
                "ring-2 ring-background transition-transform hover:z-10 hover:scale-105"
              )}
            >
              <AvatarFallback
                className={cn(
                  "font-semibold text-white",
                  person.avatarColor ?? "bg-blue-600"
                )}
              >
                {person.avatarInitials}
              </AvatarFallback>
            </Avatar>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            <p className="font-medium">{person.name}</p>
            {person.role ? (
              <p className="text-muted-foreground">{person.role}</p>
            ) : null}
          </TooltipContent>
        </Tooltip>
      ))}
      {remaining > 0 ? (
        <div
          className={cn(
            sizeClass,
            "flex items-center justify-center rounded-full bg-muted font-medium text-muted-foreground ring-2 ring-background"
          )}
        >
          +{remaining}
        </div>
      ) : null}
    </div>
  )
}
