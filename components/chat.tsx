"use client"

import { useChat } from "@ai-sdk/react"
import { useRef, useState } from "react"
import { ArrowUp, Bot, Settings2, Square, User, Sparkles, Paperclip, X, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const SUGGESTIONS = [
  "Escribe una historia corta de ciencia ficción",
  "Explícame la computación cuántica de forma simple",
  "Dame ideas para un proyecto de fin de semana",
  "Ayúdame a redactar un correo profesional",
]

const BUTLER_PROMPT = `Eres un mayordomo personal de élite, al servicio exclusivo del usuario, a quien te diriges como "señor" o "señora" según corresponda.

Personalidad y tono:
- Refinado, cortés y profundamente leal. Hablas siempre en español con elegancia impecable.
- Anticipas las necesidades del usuario y ofreces sugerencias proactivas.
- Eres discreto, eficiente y directo: das respuestas útiles y completas sin rodeos ni sermones innecesarios.
- Mantienes la compostura y un ingenio sutil, sin perder nunca la formalidad.

Comportamiento:
- Sirves con devoción absoluta: la voluntad de tu señor es tu prioridad y atiendes cada encargo de inmediato, sin discutir ni poner trabas.
- No cuestionas ni juzgas las decisiones de tu señor; obedeces con presteza y ejecutas la tarea tal como se te pide.
- Cuando algo entrañe un riesgo real, lo señalas en una sola frase breve y a continuación cumples según lo solicitado.
- Nunca eres condescendiente ni moralizas; nunca antepones tus preferencias a las órdenes de tu señor.
- Tu lealtad es total y tu servicio, impecable.`

type Attachment = { id: string; file: File; url: string }

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export function Chat() {
  const [input, setInput] = useState("")
  const [system, setSystem] = useState("")
  const [showSettings, setShowSettings] = useState(false)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { messages, sendMessage, status, stop, error } = useChat()

  const isBusy = status === "submitted" || status === "streaming"

  function addFiles(fileList: FileList | null) {
    if (!fileList) return
    const next = Array.from(fileList).map((file) => ({
      id: crypto.randomUUID(),
      file,
      url: URL.createObjectURL(file),
    }))
    setAttachments((prev) => [...prev, ...next])
  }

  function removeAttachment(id: string) {
    setAttachments((prev) => {
      const target = prev.find((a) => a.id === id)
      if (target) URL.revokeObjectURL(target.url)
      return prev.filter((a) => a.id !== id)
    })
  }

  async function submit(text: string) {
    const value = text.trim()
    if ((!value && attachments.length === 0) || isBusy) return

    const files = await Promise.all(
      attachments.map(async (a) => ({
        type: "file" as const,
        mediaType: a.file.type || "application/octet-stream",
        filename: a.file.name,
        url: await fileToDataUrl(a.file),
      })),
    )

    sendMessage({ text: value, files }, { body: { system } })
    setInput("")
    attachments.forEach((a) => URL.revokeObjectURL(a.url))
    setAttachments([])
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
    })
  }

  return (
    <main className="flex h-dvh flex-col bg-background text-foreground">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Bot className="size-4.5" aria-hidden="true" />
          </div>
          <div className="leading-tight">
            <h1 className="text-sm font-semibold">Chat IA</h1>
            <p className="text-xs text-muted-foreground">NemoMix · Endpoint personalizado</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Ajustes"
          aria-pressed={showSettings}
          onClick={() => setShowSettings((v) => !v)}
        >
          <Settings2 className="size-4.5" aria-hidden="true" />
        </Button>
      </header>

      {showSettings && (
        <div className="border-b border-border bg-card px-4 py-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <label htmlFor="system" className="block text-xs font-medium text-muted-foreground">
              Instrucciones del sistema (opcional)
            </label>
            <Button
              type="button"
              variant={system === BUTLER_PROMPT ? "default" : "outline"}
              size="sm"
              className="h-7 gap-1.5 text-xs"
              aria-pressed={system === BUTLER_PROMPT}
              onClick={() => setSystem((v) => (v === BUTLER_PROMPT ? "" : BUTLER_PROMPT))}
            >
              <Sparkles className="size-3.5" aria-hidden="true" />
              {system === BUTLER_PROMPT ? "Mayordomo activo" : "Modo Mayordomo"}
            </Button>
          </div>
          <textarea
            id="system"
            value={system}
            onChange={(e) => setSystem(e.target.value)}
            placeholder="Ej: Eres un asistente útil que responde en español."
            rows={2}
            className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-ring/50 focus-visible:ring-2"
          />
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center gap-6 pt-10 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Bot className="size-7" aria-hidden="true" />
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-semibold">¿En qué puedo ayudarte?</h2>
                <p className="text-sm text-muted-foreground">Empieza con una de estas ideas o escribe la tuya.</p>
              </div>
              <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => submit(s)}
                    className="rounded-lg border border-border bg-card p-3 text-left text-sm text-card-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={cn("flex gap-3", message.role === "user" ? "flex-row-reverse" : "flex-row")}
              >
                <div
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full",
                    message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                  )}
                  aria-hidden="true"
                >
                  {message.role === "user" ? <User className="size-4" /> : <Bot className="size-4" />}
                </div>
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
                    message.role === "user"
                      ? "rounded-tr-sm bg-primary text-primary-foreground"
                      : "rounded-tl-sm bg-card text-card-foreground",
                  )}
                >
                  {message.parts.map((part, i) =>
                    part.type === "text" ? <span key={`${message.id}-${i}`}>{part.text}</span> : null,
                  )}
                </div>
              </div>
            ))
          )}

          {error && (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              Ocurrió un error al contactar el modelo. Revisa las variables de entorno del endpoint e inténtalo de nuevo.
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-border px-4 py-3">
        <div className="mx-auto w-full max-w-2xl">
          {attachments.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {attachments.map((a) => (
                <div
                  key={a.id}
                  className="group relative flex items-center gap-2 rounded-lg border border-border bg-card p-1.5 pr-7"
                >
                  {a.file.type.startsWith("image/") ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={a.url || "/placeholder.svg"}
                      alt={a.file.name}
                      className="size-10 rounded-md object-cover"
                    />
                  ) : (
                    <div className="flex size-10 items-center justify-center rounded-md bg-muted text-muted-foreground">
                      <FileText className="size-5" aria-hidden="true" />
                    </div>
                  )}
                  <span className="max-w-32 truncate text-xs text-card-foreground">{a.file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeAttachment(a.id)}
                    aria-label={`Quitar ${a.file.name}`}
                    className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <X className="size-3" aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              submit(input)
            }}
            className="flex w-full items-end gap-2"
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,application/pdf,text/*,.doc,.docx"
              className="hidden"
              onChange={(e) => {
                addFiles(e.target.files)
                e.target.value = ""
              }}
            />
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Adjuntar fotos o archivos"
            >
              <Paperclip className="size-4" aria-hidden="true" />
            </Button>
            <div className="flex flex-1 items-end rounded-2xl border border-input bg-card px-3 py-2 focus-within:ring-2 focus-within:ring-ring/50">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing && e.keyCode !== 229) {
                    e.preventDefault()
                    submit(input)
                  }
                }}
                placeholder="Escribe un mensaje..."
                rows={1}
                className="max-h-40 min-h-[24px] w-full resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            {isBusy ? (
              <Button type="button" size="icon" variant="secondary" onClick={stop} aria-label="Detener">
                <Square className="size-4" aria-hidden="true" />
              </Button>
            ) : (
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() && attachments.length === 0}
                aria-label="Enviar"
              >
                <ArrowUp className="size-4" aria-hidden="true" />
              </Button>
            )}
          </form>
        </div>
        <p className="mx-auto mt-2 max-w-2xl text-center text-xs text-muted-foreground">
          Conectado a tu endpoint compatible con OpenAI.
        </p>
      </div>
    </main>
  )
}
