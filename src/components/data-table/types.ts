export interface FacetedFilterOption {
  label: string
  value: string
  sublabel?: string
}

export interface FacetedFilterConfig {
  columnId: string
  title: string
  options: FacetedFilterOption[]
  /** When true, options are fetched/shown only after the user types a search query. */
  requireSearch?: boolean
  searchPlaceholder?: string
  onSearch?: (
    query: string
  ) => Promise<FacetedFilterOption[]> | FacetedFilterOption[]
}
