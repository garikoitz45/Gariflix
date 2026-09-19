import {
  streamText,
  type UIMessage,
  convertToModelMessages,
  createUIMessageStreamResponse,
  toUIMessageStream,
} from "ai"
import { createOpenAICompatible } from "@ai-sdk/openai-compatible"

export const maxDuration = 60

const baseURL = process.env.AI_ENDPOINT_BASE_URL
const apiKey = process.env.AI_ENDPOINT_API_KEY
// Modelo principal por defecto. Se puede sobrescribir con AI_MODEL_ID.
const DEFAULT_MODEL_ID = "NemoMix-Unleashed-12B"
const modelId = process.env.AI_MODEL_ID?.trim() || DEFAULT_MODEL_ID

export async function POST(req: Request) {
  if (!baseURL || !apiKey) {
    return new Response(
      JSON.stringify({
        error:
          "Faltan variables de entorno. Configura AI_ENDPOINT_BASE_URL y AI_ENDPOINT_API_KEY (opcionalmente AI_MODEL_ID).",
      }),
      { status: 500, headers: { "content-type": "application/json" } },
    )
  }

  const { messages, system }: { messages: UIMessage[]; system?: string } = await req.json()

  const provider = createOpenAICompatible({
    name: "custom-endpoint",
    baseURL,
    apiKey,
  })

  const result = streamText({
    model: provider.chatModel(modelId),
    system: system?.trim() ? system : undefined,
    messages: await convertToModelMessages(messages),
  })

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream }),
  })
}
