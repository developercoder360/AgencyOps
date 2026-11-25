"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import { PageHeader } from "@/components/shared"
import { RichTextEditorSkeleton, RichTextViewer, getPlainText, getWordCount, isEmpty } from "@/components/rich-text"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { RichTextValue } from "@/types/rich-text"

const RichTextEditor = dynamic(
  () => import("@/components/rich-text").then((m) => m.RichTextEditor),
  { ssr: false, loading: () => <RichTextEditorSkeleton /> }
)

const MENTION_USERS = [
  { id: "u1", name: "Chloe Laurent", avatarInitials: "CL", avatarColor: "bg-pink-600" },
  { id: "u2", name: "Marcus Vance", avatarInitials: "MV", avatarColor: "bg-blue-600" },
  { id: "u3", name: "Tariq Al-Mansoor", avatarInitials: "TA", avatarColor: "bg-amber-600" },
]

const TASK_REFS = [
  { id: "t1", code: "TSK-101", title: "Landing Hero Visuals" },
  { id: "t2", code: "TSK-113", title: "Responsive Hero & CTA" },
]

export default function RichTextDemoPage() {
  const [fullHtml, setFullHtml] = React.useState<RichTextValue>(
    "<h2>Launch Brief</h2><p>Type <strong>/</strong> for commands, <strong>@</strong> for mentions, <strong>#</strong> for tasks, or <strong>:smile</strong> for emojis.</p>"
  )
  const [compactHtml, setCompactHtml] = React.useState<RichTextValue>(
    "<p>Compact variant for notes with <em>lists</em>, links, and mentions.</p>"
  )
  const [commentHtml, setCommentHtml] = React.useState<RichTextValue>("")
  const [minimalHtml, setMinimalHtml] = React.useState<RichTextValue>(
    "<p><strong>Minimal</strong> editor with bold, italic, link, and lists.</p>"
  )
  const [jsonDoc, setJsonDoc] = React.useState<RichTextValue>({
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [{ type: "text", text: "JSON format output example." }],
      },
    ],
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rich Text Editor Playground"
        description="Test all four Tiptap editor variants, RichTextViewer sanitization, read-only, disabled, and draft autosave."
        badge={<Badge variant="secondary">/dev/rich-text</Badge>}
      />

      <Tabs defaultValue="full" className="space-y-4">
        <TabsList>
          <TabsTrigger value="full">Full</TabsTrigger>
          <TabsTrigger value="compact">Compact</TabsTrigger>
          <TabsTrigger value="comment">Comment</TabsTrigger>
          <TabsTrigger value="minimal">Minimal</TabsTrigger>
          <TabsTrigger value="states">Read-only / Disabled / JSON</TabsTrigger>
        </TabsList>

        <TabsContent value="full" className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Full Variant (maxLength=5000, autosave)
            </h3>
            <RichTextEditor
              value={fullHtml}
              onChange={setFullHtml}
              variant="full"
              format="html"
              minHeight="240px"
              maxHeight="440px"
              maxLength={5000}
              draftKey="dev-rt-full-draft"
              mentionItems={MENTION_USERS}
              taskItems={TASK_REFS}
            />
          </div>
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              RichTextViewer (Sanitized Output)
            </h3>
            <div className="rounded-lg border border-border bg-card p-4">
              <RichTextViewer value={fullHtml} emptyFallback="Nothing entered yet." />
            </div>
            <div className="text-xs text-muted-foreground">
              Words: {getWordCount(fullHtml)} · Empty: {String(isEmpty(fullHtml))} · Plain: {getPlainText(fullHtml).slice(0, 80)}
            </div>
            <pre className="max-h-40 overflow-auto rounded-lg border border-border bg-muted/40 p-2.5 text-[11px]">
              {typeof fullHtml === "string" ? fullHtml : JSON.stringify(fullHtml, null, 2)}
            </pre>
          </div>
        </TabsContent>

        <TabsContent value="compact" className="space-y-3">
          <RichTextEditor
            value={compactHtml}
            onChange={setCompactHtml}
            variant="compact"
            minHeight="120px"
            mentionItems={MENTION_USERS}
          />
          <div className="rounded-lg border border-border bg-card p-3">
            <RichTextViewer value={compactHtml} />
          </div>
        </TabsContent>

        <TabsContent value="comment" className="space-y-3">
          <RichTextEditor
            value={commentHtml}
            onChange={setCommentHtml}
            variant="comment"
            minHeight="90px"
            mentionItems={MENTION_USERS}
            onSubmit={() => setCommentHtml("")}
            placeholder="Write a comment... (Ctrl/Cmd+Enter to submit)"
          />
        </TabsContent>

        <TabsContent value="minimal" className="space-y-3">
          <RichTextEditor
            value={minimalHtml}
            onChange={setMinimalHtml}
            variant="minimal"
            minHeight="90px"
          />
        </TabsContent>

        <TabsContent value="states" className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <h4 className="text-xs font-semibold">Read-Only Mode</h4>
            <RichTextEditor value={fullHtml} readOnly />
          </div>
          <div className="space-y-2">
            <h4 className="text-xs font-semibold">Disabled Mode</h4>
            <RichTextEditor value="<p>Disabled editor state</p>" disabled variant="compact" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <h4 className="text-xs font-semibold">format=&quot;json&quot; Mode</h4>
            <RichTextEditor
              value={jsonDoc}
              onChange={setJsonDoc}
              format="json"
              variant="compact"
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
