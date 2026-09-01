import { Message, Usage } from './types';

const API_URL = 'https://api.anthropic.com/v1/messages';
// Bump this if Anthropic ships a newer dated API version.
const ANTHROPIC_VERSION = '2023-06-01';

export interface RunParams {
  apiKey: string;
  model: string;
  system: string;
  messages: Message[];
  maxTokens: number;
  temperature: number;
}

export interface RunResult {
  text: string;
  stopReason: string | null;
  usage: Usage | null;
}

export class ApiError extends Error {}

export async function runMessages(params: RunParams): Promise<RunResult> {
  const { apiKey, model, system, messages, maxTokens, temperature } = params;

  if (!apiKey) {
    throw new ApiError('No API key set. Tap the gear icon to add one.');
  }
  if (messages.length === 0) {
    throw new ApiError('Add at least one message before running.');
  }

  const body: Record<string, unknown> = {
    model,
    max_tokens: maxTokens,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  };

  if (system.trim().length > 0) {
    body.system = system;
  }
  if (!Number.isNaN(temperature)) {
    body.temperature = temperature;
  }

  let response: Response;
  try {
    response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
      },
      body: JSON.stringify(body),
    });
  } catch (networkErr) {
    throw new ApiError('Network request failed. Check your connection and try again.');
  }

  const json = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      json?.error?.message ?? `Request failed with status ${response.status}.`;
    throw new ApiError(message);
  }

  const textBlocks: string[] = (json?.content ?? [])
    .filter((block: { type: string }) => block.type === 'text')
    .map((block: { text: string }) => block.text);

  return {
    text: textBlocks.join('\n'),
    stopReason: json?.stop_reason ?? null,
    usage: json?.usage ?? null,
  };
}
