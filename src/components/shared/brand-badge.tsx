"use client"

import { cn } from "cn"
import { useStore } from "@/lib/store"
import type { Brand } from "@/types"

interface BrandBadgeProps {
  brandId?: string
  brandName: string
  brands?: Brand[]
  primaryColor?: string
  className?: string
}

export function BrandBadge({
  brandId,
  brandName,
  brands: brandsProp,
  primaryColor,
  className,
}: BrandBadgeProps) {
  const { brands: storeBrands } = useStore()
  const brandsList = brandsProp ?? storeBrands
  const brand = brandsList.find(
    (b) => (brandId && b.id === brandId) || b.name === brandName
  )
  const color = primaryColor || brand?.primaryColor || "#2563EB"

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        className
      )}
      style={{
        backgroundColor: `${color}15`,
        color,
        borderColor: `${color}35`,
      }}
    >
      <span
        className="size-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span>{brandName}</span>
    </span>
  )
}
