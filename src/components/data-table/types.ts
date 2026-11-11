export interface FacetedFilterOption {
  label: string
  value: string
}

export interface FacetedFilterConfig {
  columnId: string
  title: string
  options: FacetedFilterOption[]
}
