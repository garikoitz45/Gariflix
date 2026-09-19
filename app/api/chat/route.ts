import {
  streamText,
  type UIMessage,
  convertToModelMessages,
  createUIMessageStreamResponse,
  toUIMessageStream,
} from "ai"
import { createOpenAICompatible } from "@ai-sdk/openai-compatible"

export const maxDuration = 60

// URL base por defecto: OpenRouter (compatible con OpenAI y con modelos gratuitos).
const DEFAULT_BASE_URL = "https://openrouter.ai/api/v1"
const baseURL = process.env.AI_ENDPOINT_BASE_URL?.trim() || DEFAULT_BASE_URL
const apiKey = process.env.AI_ENDPOINT_API_KEY
// Modelo principal por defecto: un modelo gratuito de OpenRouter (los que terminan en ":free" no consumen créditos).
// Cámbialo con AI_MODEL_ID (por ejemplo un NemoMix que tú alojes).
const DEFAULT_MODEL_ID = "nousresearch/hermes-3-llama-3.1-405b:free"
const modelId = process.env.AI_MODEL_ID?.trim() || DEFAULT_MODEL_ID

export async function POST(req: Request) {
  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error:
          "Falta la API key. Crea una cuenta gratuita en openrouter.ai, genera una API key y añádela como AI_ENDPOINT_API_KEY. Con el modelo gratuito por defecto no se cobra nada.",
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
