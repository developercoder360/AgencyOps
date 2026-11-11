export type UiTheme = "classic" | "studio"

export const DEFAULT_UI_THEME: UiTheme = "classic"
export const UI_THEME_STORAGE_KEY = "agencyops_ui_theme"

export interface UiThemeOption {
  id: UiTheme
  label: string
  description: string
}

export const UI_THEMES: UiThemeOption[] = [
  {
    id: "classic",
    label: "Classic",
    description: "Blue gradient shell & clean geometric sans",
  },
  {
    id: "studio",
    label: "Studio",
    description: "Calm editorial surfaces & deep emerald accent",
  },
]

export function isValidUiTheme(value: unknown): value is UiTheme {
  return value === "classic" || value === "studio"
}

export function getUiThemeInitScript(): string {
  return `(function(){try{var t=localStorage.getItem(${JSON.stringify(
    UI_THEME_STORAGE_KEY
  )});document.documentElement.dataset.theme=t==="studio"?"studio":"classic";}catch(e){document.documentElement.dataset.theme="classic";}})();`
}

const AVATAR_TONE_CLASS_MAP: Record<string, string> = {
  "bg-blue-600": "bg-(--avatar-blue-bg) text-(--avatar-blue-fg)",
  "bg-blue-700": "bg-(--avatar-blue-bg) text-(--avatar-blue-fg)",
  "bg-emerald-600": "bg-(--avatar-emerald-bg) text-(--avatar-emerald-fg)",
  "bg-emerald-700": "bg-(--avatar-emerald-bg) text-(--avatar-emerald-fg)",
  "bg-indigo-600": "bg-(--avatar-indigo-bg) text-(--avatar-indigo-fg)",
  "bg-violet-600": "bg-(--avatar-violet-bg) text-(--avatar-violet-fg)",
  "bg-purple-600": "bg-(--avatar-violet-bg) text-(--avatar-violet-fg)",
  "bg-fuchsia-600": "bg-(--avatar-violet-bg) text-(--avatar-violet-fg)",
  "bg-amber-600": "bg-(--avatar-amber-bg) text-(--avatar-amber-fg)",
  "bg-orange-600": "bg-(--avatar-amber-bg) text-(--avatar-amber-fg)",
  "bg-rose-600": "bg-(--avatar-rose-bg) text-(--avatar-rose-fg)",
  "bg-pink-600": "bg-(--avatar-rose-bg) text-(--avatar-rose-fg)",
  "bg-red-700": "bg-(--avatar-rose-bg) text-(--avatar-rose-fg)",
  "bg-cyan-600": "bg-(--avatar-teal-bg) text-(--avatar-teal-fg)",
  "bg-teal-600": "bg-(--avatar-teal-bg) text-(--avatar-teal-fg)",
  "bg-sky-600": "bg-(--avatar-sky-bg) text-(--avatar-sky-fg)",
  "bg-lime-700": "bg-(--avatar-emerald-bg) text-(--avatar-emerald-fg)",
  "bg-slate-600": "bg-(--avatar-slate-bg) text-(--avatar-slate-fg)",
}

export function getAvatarToneClass(avatarColor?: string): string {
  if (!avatarColor) {
    return "bg-(--avatar-blue-bg) text-(--avatar-blue-fg)"
  }
  return (
    AVATAR_TONE_CLASS_MAP[avatarColor] ??
    "bg-(--avatar-slate-bg) text-(--avatar-slate-fg)"
  )
}
