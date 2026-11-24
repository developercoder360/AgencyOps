"use client"

import * as React from "react"
import { Check, Loader2, PlusCircle, Search, X } from "lucide-react"
import { cn } from "cn"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import type { FacetedFilterConfig, FacetedFilterOption } from "./types"

interface FacetedFilterPopoverProps {
  filter: FacetedFilterConfig
  selected: string[]
  facets: Map<unknown, number>
  onSelectChange: (next: string[] | undefined) => void
}

export function FacetedFilterPopover({
  filter,
  selected,
  facets,
  onSelectChange,
}: FacetedFilterPopoverProps) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [searchResults, setSearchResults] = React.useState<
    FacetedFilterOption[]
  >([])
  const [isSearching, setIsSearching] = React.useState(false)
  const [selectedOptionMap, setSelectedOptionMap] = React.useState<
    Record<string, FacetedFilterOption>
  >({})

  const isSearchMode = Boolean(filter.requireSearch || filter.onSearch)

  React.useEffect(() => {
    if (!open || !isSearchMode) return
    const trimmed = query.trim()
    if (!trimmed) return

    let cancelled = false
    const timer = window.setTimeout(async () => {
      try {
        const results = filter.onSearch
          ? await filter.onSearch(trimmed)
          : filter.options.filter((o) =>
              o.label.toLowerCase().includes(trimmed.toLowerCase())
            )
        if (!cancelled) {
          setSearchResults(results)
        }
      } finally {
        if (!cancelled) {
          setIsSearching(false)
        }
      }
    }, 200)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [open, isSearchMode, query, filter])

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
    if (!nextOpen) {
      setQuery("")
      setSearchResults([])
      setIsSearching(false)
    }
  }

  function handleQueryChange(val: string) {
    setQuery(val)
    if (!isSearchMode) return
    if (!val.trim()) {
      setSearchResults([])
      setIsSearching(false)
      return
    }
    setIsSearching(true)
  }

  function toggleOption(opt: FacetedFilterOption) {
    const isChecked = selected.includes(opt.value)
    if (!isChecked) {
      setSelectedOptionMap((prev) => ({ ...prev, [opt.value]: opt }))
    }
    const next = isChecked
      ? selected.filter((v) => v !== opt.value)
      : [...selected, opt.value]
    onSelectChange(next.length ? next : undefined)
  }

  const selectedOptions = React.useMemo<FacetedFilterOption[]>(() => {
    return selected.map((val) => {
      return (
        selectedOptionMap[val] ??
        filter.options.find((o) => o.value === val) ?? {
          label: val,
          value: val,
        }
      )
    })
  }, [selected, selectedOptionMap, filter.options])

  const trimmedQuery = query.trim()
  const visibleOptions = isSearchMode
    ? trimmedQuery
      ? searchResults
      : []
    : filter.options

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 border-dashed gap-1.5"
        >
          <PlusCircle className="size-3.5" />
          <span>{filter.title}</span>
          {selected.length > 0 ? (
            <>
              <span className="mx-0.5 h-3.5 w-px bg-border" />
              <Badge
                variant="secondary"
                className="rounded-sm px-1.5 font-normal"
              >
                {selected.length}
              </Badge>
            </>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className={cn("p-2", isSearchMode ? "w-64" : "w-56")}
      >
        <div className="mb-1.5 px-2 py-1 text-xs font-medium text-muted-foreground">
          Filter by {filter.title}
        </div>

        {isSearchMode ? (
          <div className="relative mb-2">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder={filter.searchPlaceholder || `Search ${filter.title.toLowerCase()}...`}
              aria-label={`Search ${filter.title}`}
              autoFocus
              className="h-8 pl-8 pr-7 text-xs"
            />
            {query ? (
              <button
                type="button"
                onClick={() => handleQueryChange("")}
                aria-label="Clear search"
                className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            ) : null}
          </div>
        ) : null}

        {/* Selected items shown when search input is empty so user can review/unselect */}
        {isSearchMode && !trimmedQuery && selectedOptions.length > 0 ? (
          <div className="mb-2 space-y-1 border-b border-border pb-2">
            <div className="px-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Selected
            </div>
            <div className="max-h-32 space-y-1 overflow-y-auto">
              {selectedOptions.map((opt) => (
                <OptionRow
                  key={opt.value}
                  option={opt}
                  isChecked={true}
                  count={facets.get(opt.value) ?? 0}
                  onToggle={() => toggleOption(opt)}
                />
              ))}
            </div>
          </div>
        ) : null}

        <div
          role="listbox"
          aria-label={`Filter by ${filter.title}`}
          aria-multiselectable="true"
          className="max-h-56 space-y-1 overflow-y-auto"
        >
          {isSearchMode && !trimmedQuery ? (
            <div className="px-2 py-3 text-center text-xs text-muted-foreground">
              Type to search users...
            </div>
          ) : isSearchMode && isSearching ? (
            <div className="flex items-center justify-center gap-2 px-2 py-4 text-xs text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" />
              <span>Searching...</span>
            </div>
          ) : visibleOptions.length === 0 ? (
            <div className="px-2 py-3 text-center text-xs text-muted-foreground">
              No matching users found.
            </div>
          ) : (
            visibleOptions.map((opt) => (
              <OptionRow
                key={opt.value}
                option={opt}
                isChecked={selected.includes(opt.value)}
                count={facets.get(opt.value) ?? 0}
                onToggle={() => toggleOption(opt)}
              />
            ))
          )}
        </div>

        {selected.length > 0 ? (
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => onSelectChange(undefined)}
            className="mt-2 w-full"
          >
            Clear filter
          </Button>
        ) : null}
      </PopoverContent>
    </Popover>
  )
}

function OptionRow({
  option,
  isChecked,
  count,
  onToggle,
}: {
  option: FacetedFilterOption
  isChecked: boolean
  count: number
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={isChecked}
      onClick={onToggle}
      className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="flex min-w-0 items-center gap-2">
        <span
          aria-hidden="true"
          className={cn(
            "flex size-4 shrink-0 items-center justify-center rounded-[4px] border transition-colors",
            isChecked
              ? "border-primary bg-primary text-primary-foreground"
              : "border-input dark:bg-input/30"
          )}
        >
          {isChecked ? <Check className="size-3.5" /> : null}
        </span>
        <span className="min-w-0">
          <span className="block truncate font-medium">{option.label}</span>
          {option.sublabel ? (
            <span className="block truncate text-[10px] text-muted-foreground">
              {option.sublabel}
            </span>
          ) : null}
        </span>
      </span>
      <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
        {count}
      </span>
    </button>
  )
}
