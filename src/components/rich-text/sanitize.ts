import DOMPurify from "isomorphic-dompurify"
import { isValidEmbedUrl, isValidUrl } from "./utils"

const ALLOWED_TAGS = [
  "p",
  "br",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "strike",
  "del",
  "code",
  "pre",
  "mark",
  "sub",
  "sup",
  "span",
  "div",
  "blockquote",
  "hr",
  "ul",
  "ol",
  "li",
  "a",
  "img",
  "figure",
  "figcaption",
  "table",
  "colgroup",
  "col",
  "thead",
  "tbody",
  "tfoot",
  "tr",
  "th",
  "td",
  "details",
  "summary",
  "iframe",
  "input",
  "label",
  "time",
]

const ALLOWED_ATTR = [
  "href",
  "target",
  "rel",
  "src",
  "alt",
  "title",
  "width",
  "height",
  "style",
  "class",
  "dir",
  "colspan",
  "rowspan",
  "colwidth",
  "start",
  "type",
  "checked",
  "disabled",
  "open",
  "download",
  "allow",
  "allowfullscreen",
  "frameborder",
  "datetime",
  "data-type",
  "data-id",
  "data-label",
  "data-code",
  "data-callout",
  "data-variant",
  "data-details",
  "data-math",
  "data-formula",
  "data-align",
  "data-width",
  "data-caption",
  "data-name",
  "data-size",
  "data-mime",
  "data-url",
  "data-indent",
  "data-checked",
  "data-color",
  "data-youtube-video",
  "data-date",
]

let hooksRegistered = false

function ensurePurifyHooks() {
  if (hooksRegistered) return
  hooksRegistered = true

  DOMPurify.addHook("afterSanitizeAttributes", (node) => {
    // Validate links
    if (node.tagName === "A") {
      const href = node.getAttribute("href") ?? ""
      if (!isValidUrl(href)) {
        node.removeAttribute("href")
      } else if (/^https?:\/\//i.test(href) || node.getAttribute("target") === "_blank") {
        node.setAttribute("rel", "noopener noreferrer nofollow")
        if (!node.getAttribute("target")) {
          node.setAttribute("target", "_blank")
        }
      }
    }

    // Validate image sources (allow http/https/blob/data:image)
    if (node.tagName === "IMG") {
      const src = node.getAttribute("src") ?? ""
      if (
        !/^(https?:\/\/|\/|blob:|data:image\/(png|jpe?g|gif|webp|avif);)/i.test(
          src.trim()
        )
      ) {
        node.removeAttribute("src")
      }
    }

    // Validate checkboxes: only allow disabled checkboxes from task lists
    if (node.tagName === "INPUT") {
      const inputType = node.getAttribute("type")
      if (inputType !== "checkbox") {
        node.parentNode?.removeChild(node)
      }
    }

    // Restrict iframes strictly to valid YouTube/Vimeo embed URLs
    if (node.tagName === "IFRAME") {
      const src = node.getAttribute("src") ?? ""
      if (!isValidEmbedUrl(src)) {
        node.parentNode?.removeChild(node)
      } else {
        node.setAttribute("sandbox", "allow-scripts allow-same-origin allow-presentation")
      }
    }

    // Filter inline styles to a safe subset (color, background-color, text-align, font-family, font-size, line-height, margin-left, width, height)
    if (node.hasAttribute("style")) {
      const rawStyle = node.getAttribute("style") ?? ""
      const safeDeclarations = rawStyle
        .split(";")
        .map((decl) => decl.trim())
        .filter((decl) => {
          const colonIdx = decl.indexOf(":")
          if (colonIdx <= 0) return false
          const prop = decl.slice(0, colonIdx).trim().toLowerCase()
          const val = decl.slice(colonIdx + 1).trim().toLowerCase()
          if (val.includes("expression(") || val.includes("url(") || val.includes("javascript:")) {
            return false
          }
          return [
            "color",
            "background-color",
            "text-align",
            "font-family",
            "font-size",
            "line-height",
            "margin-left",
            "padding-left",
            "width",
            "height",
            "min-width",
          ].includes(prop)
        })
      if (safeDeclarations.length > 0) {
        node.setAttribute("style", safeDeclarations.join("; "))
      } else {
        node.removeAttribute("style")
      }
    }
  })
}

export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== "string") return ""
  ensurePurifyHooks()
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ["script", "style", "object", "embed", "form", "svg"],
    FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "onfocus"],
  })
}

/**
 * Strips Microsoft Word / Google Docs bloat & unsafe markup from pasted HTML.
 */
export function cleanPastedHtml(html: string): string {
  const withoutWordMeta = html
    .replace(/<!--\[if[\s\S]*?<!\[endif\]-->/gi, "")
    .replace(/<\/?(meta|link|style|xml|o:p|w:\w+|m:\w+)[^>]*>/gi, "")
    .replace(/\sclass="Mso[^"]*"/gi, "")
    .replace(/\smso-[^:;"']+:[^;"']+;?/gi, "")
  return sanitizeHtml(withoutWordMeta)
}
