"use client"

import * as React from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText } from "lucide-react"
import { formatCurrency, formatUsdEquivalent } from "@/lib/currency"
import type { Project, Transaction } from "@/types"

interface ProjectFinancialsProps {
  project: Project
  transactions: Transaction[]
}

export function ProjectFinancials({ project, transactions }: ProjectFinancialsProps) {
  const [showDetails, setShowDetails] = React.useState(false)

  // Calculate financial metrics from budget (actual project has contract value)
  const contractValue = project.budget ?? 0
  const billedAmount = 0 // Would need invoice data
  const outstandingAmount = Math.max(0, contractValue - billedAmount)
  
  // Estimate profit margin from progress and status (simplified)
  const estimatedProfitMargin = project.status === "Complete" ? 25 : 
                                 project.progress > 70 ? 18 :
                                 project.progress > 40 ? 12 : 8
  
  const unbilledAmount = contractValue - billedAmount

  // Note: Transaction type doesn't have projectId - using brand matching as fallback
  const projectInvoices = [] // No linked invoices available yet

  const getProfitColor = (margin: number) => {
    if (margin >= 20) return "text-emerald-600 dark:text-emerald-400"
    if (margin >= 10) return "text-amber-600 dark:text-amber-400"
    return "text-rose-600 dark:text-rose-400"
  }

  const getProfitBadge = (margin: number) => {
    if (margin >= 20) return "default"
    if (margin >= 10) return "secondary"
    return "destructive"
  }

  const getStatusColor = (amount: number) => {
    if (amount === 0) return "text-emerald-600 dark:text-emerald-400"
    return "text-amber-600 dark:text-amber-400"
  }

  const hasFinancialData = contractValue > 0

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold">Project Budget</CardTitle>
            <p className="text-xs text-muted-foreground">Budget & billing tracking</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="h-6 px-2 text-xs"
          >
            {showDetails ? "Hide Details" : "Show Details"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Financial Metrics Grid */}
        <div className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/20 p-3 text-xs sm:gap-4">
          <div>
            <div className="text-muted-foreground">Total Budget</div>
            <div className={`mt-1 font-semibold tabular-nums ${getStatusColor(contractValue)}`}>
              {formatCurrency(contractValue, project.currency)}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Billed Amount</div>
            <div className={`mt-1 font-semibold tabular-nums ${getStatusColor(billedAmount)}`}>
              {formatCurrency(billedAmount, project.currency)}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Remaining</div>
            <div className={`mt-1 font-semibold tabular-nums ${getStatusColor(unbilledAmount)}`}>
              {formatCurrency(unbilledAmount, project.currency)}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Status</div>
            <div className={`mt-1 font-semibold tabular-nums ${getStatusColor(outstandingAmount)}`}>
              {formatCurrency(outstandingAmount, project.currency)}
            </div>
          </div>
        </div>

        {/* Estimated Profit Margin */}
        <div className="rounded-lg border bg-muted/20 p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Estimated Profit Margin</span>
            <Badge variant={getProfitBadge(estimatedProfitMargin)} className="font-semibold">
              {estimatedProfitMargin}%
            </Badge>
          </div>
          <div className={`mt-2 text-xs font-semibold ${getProfitColor(estimatedProfitMargin)}`}>
            Projected Profit: {formatCurrency(Math.round(contractValue * (estimatedProfitMargin / 100)), project.currency)}
          </div>
        </div>

        {/* Transaction Summary */}
        <div className="rounded-lg border bg-muted/20 p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Transactions</span>
            <span className="text-xs font-semibold">0</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" asChild className="w-full">
            <Link href={`/transactions?projectId=${project.id}`}>
              <FileText className="mr-2 h-4 w-4" />
              View Transactions
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild className="w-full">
            <Link href={`/projects/${project.id}/billing`}>
              Billing Details
            </Link>
          </Button>
        </div>

        {/* Warning Banner for high outstanding */}
        {outstandingAmount > contractValue * 0.5 && contractValue > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">
            ⚠️ {formatCurrency(outstandingAmount, project.currency)} remaining ({Math.round((outstandingAmount / contractValue) * 100)}% of budget)
          </div>
        )}

        {/* No Financial Data */}
        {!hasFinancialData && (
          <div className="rounded-lg border border-border bg-muted/20 px-3 py-2 text-center text-xs text-muted-foreground">
            No project data available
          </div>
        )}
      </CardContent>
    </Card>
  )
}
