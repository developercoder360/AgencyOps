"use client"

import * as React from "react"
import Link from "next/link"
import type { ColumnDef } from "@tanstack/react-table"
import { toast } from "sonner"
import { ArrowUpRight, Globe, Mail, MapPin, Phone, Tag, Trash2 } from "lucide-react"
import {
  DataTable,
  DataTableColumnHeader,
  type FacetedFilterConfig,
} from "@/components/data-table"
import { ConfirmDeleteDialog, PageHeader } from "@/components/shared"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useStore } from "@/lib/store"
import type { SignUp } from "@/types"

export default function SignUpsPage() {
  const { signUps, brands, convertSignUpToLead, deleteSignUp } = useStore()
  const [selected, setSelected] = React.useState<SignUp | null>(null)

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = React.useState<SignUp | null>(null)

  const handleConvert = React.useCallback(
    (item: SignUp) => {
      const lead = convertSignUpToLead(item.id)
      if (lead) {
        toast.success(`Converted ${item.code} (${item.name}) to CRM Lead ${lead.code}`)
        setSelected((prev) => (prev && prev.id === item.id ? { ...prev, convertedToLead: true, leadId: lead.id } : prev))
      } else {
        toast.error("Could not convert sign-up to lead.")
      }
    },
    [convertSignUpToLead]
  )

  const promptDelete = React.useCallback((item: SignUp) => {
    setDeleteTarget(item)
  }, [])

  function handleConfirmDelete() {
    if (!deleteTarget) return
    deleteSignUp(deleteTarget.id)
    toast.success(`Removed submission ${deleteTarget.code}`)
    if (selected?.id === deleteTarget.id) {
      setSelected(null)
    }
    setDeleteTarget(null)
  }

  const columns = React.useMemo<ColumnDef<SignUp>[]>(
    () => [
      {
        accessorKey: "code",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Sign Up ID" />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-xs font-semibold text-primary">
            {row.original.code}
          </span>
        ),
      },
      {
        accessorKey: "name",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Prospect" />
        ),
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.original.name}</div>
            <div className="text-xs text-muted-foreground">
              {row.original.email}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "brandName",
        header: "Brand",
        cell: ({ row }) => (
          <Badge variant="outline" className="font-normal">
            {row.original.brandName}
          </Badge>
        ),
      },
      {
        accessorKey: "serviceInterest",
        header: "Service Interest",
        cell: ({ row }) => (
          <span className="text-xs">{row.original.serviceInterest}</span>
        ),
      },
      {
        accessorKey: "source",
        header: "Source",
      },
      {
        accessorKey: "city",
        header: "City",
      },
      {
        id: "converted",
        accessorFn: (row) => (row.convertedToLead ? "Converted" : "Pending"),
        header: "Lead Status",
        cell: ({ row }) =>
          row.original.convertedToLead ? (
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300">
              Converted
            </Badge>
          ) : (
            <Badge variant="secondary">Pending Review</Badge>
          ),
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Submitted" />
        ),
        cell: ({ row }) => (
          <span className="text-xs tabular-nums text-muted-foreground">
            {row.original.createdAt}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        enableHiding: false,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            {!row.original.convertedToLead && (
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={() => handleConvert(row.original)}
                className="gap-1 text-primary"
              >
                Convert
                <ArrowUpRight className="size-3" />
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => promptDelete(row.original)}
              title="Delete submission"
              className="text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        ),
      },
    ],
    [handleConvert, promptDelete]
  )

  const facetedFilters = React.useMemo<FacetedFilterConfig[]>(
    () => [
      {
        columnId: "brandName",
        title: "Brand",
        options: brands.map((b) => ({ label: b.name, value: b.name })),
      },
      {
        columnId: "converted",
        title: "Status",
        options: [
          { label: "Converted", value: "Converted" },
          { label: "Pending", value: "Pending" },
        ],
      },
    ],
    [brands]
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Website Sign Ups"
        description="Raw landing-page form submissions awaiting sales qualification and CRM lead conversion."
        badge={<Badge variant="secondary">{signUps.length} submissions</Badge>}
      />

      <DataTable
        columns={columns}
        data={signUps}
        searchPlaceholder="Search sign ups by name, email, campaign..."
        facetedFilters={facetedFilters}
        dateField="createdAt"
        exportModule="Sign Ups"
        onRowClick={setSelected}
      />

      <Sheet
        open={Boolean(selected)}
        onOpenChange={(open) => !open && setSelected(null)}
      >
        <SheetContent side="right" className="overflow-y-auto sm:max-w-md">
          {selected ? (
            <>
              <SheetHeader className="border-b border-border pb-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono">
                    {selected.code}
                  </Badge>
                  <Badge variant={selected.convertedToLead ? "default" : "secondary"}>
                    {selected.convertedToLead ? "Converted to Lead" : "Pending"}
                  </Badge>
                </div>
                <SheetTitle className="mt-1">{selected.name}</SheetTitle>
                <SheetDescription>{selected.serviceInterest}</SheetDescription>
              </SheetHeader>

              <div className="space-y-4 p-4 text-sm">
                <div className="space-y-2.5 rounded-lg border border-border bg-muted/30 p-3.5">
                  <div className="flex items-center gap-2">
                    <Mail className="size-4 text-muted-foreground" />
                    <span>{selected.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="size-4 text-muted-foreground" />
                    <span>{selected.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="size-4 text-muted-foreground" />
                    <span>{selected.city}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Tag className="size-4 text-muted-foreground" />
                    <span>UTM: {selected.utmCampaign}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="size-4 text-muted-foreground" />
                    <span className="font-mono text-xs">
                      IP: {selected.ipAddress}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Submitted Brief Notes
                  </div>
                  <p className="rounded-lg border border-border p-3 text-muted-foreground">
                    {selected.notes || "No additional notes provided."}
                  </p>
                </div>
              </div>

              <SheetFooter className="flex-row justify-between border-t border-border pt-4 sm:justify-between">
                <Button
                  type="button"
                  variant="ghost"
                  className="text-destructive hover:bg-destructive/10"
                  onClick={() => promptDelete(selected)}
                >
                  <Trash2 className="mr-1.5 size-4" />
                  Delete
                </Button>
                {selected.convertedToLead ? (
                  <Button asChild variant="outline">
                    <Link href="/leads">View in Leads</Link>
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={() => handleConvert(selected)}
                    className="gap-1.5"
                  >
                    Convert to Lead
                    <ArrowUpRight className="size-4" />
                  </Button>
                )}
              </SheetFooter>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title={`Delete Sign Up "${deleteTarget?.name}"?`}
        description="Are you sure you want to remove this submission record? This cannot be undone."
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}
