import { fetch } from 'expo/fetch';
import { Message, Usage } from './types';

const API_URL = 'https://api.anthropic.com/v1/messages';
// Bump this if Anthropic ships a newer dated API version.
const ANTHROPIC_VERSION = '2023-06-01';

// Max output tokens per model, per docs.claude.com. Anthropic requires
// max_tokens on every request — there's no "unlimited" option — and each
// model enforces its own ceiling. Unrecognized/custom model strings fall
// back to a conservative default rather than guessing.
const MODEL_MAX_OUTPUT_TOKENS: Record<string, number> = {
  'claude-sonnet-5': 128_000,
  'claude-opus-5': 128_000,
  'claude-fable-5': 128_000,
  'claude-fable-5-1': 128_000,
  'claude-mythos-5': 128_000,
  'claude-opus-4-8': 64_000,
  'claude-haiku-4-5': 64_000,
  'claude-haiku-4-5-20251001': 64_000,
};
const DEFAULT_MAX_OUTPUT_TOKENS = 8_192;

export function maxOutputTokensForModel(model: string): number {
  return MODEL_MAX_OUTPUT_TOKENS[model.trim()] ?? DEFAULT_MAX_OUTPUT_TOKENS;
}

export interface RunParams {
  apiKey: string;
  model: string;
  system: string;
  messages: Message[];
  maxTokens: number;
  temperature: number;
  /** Called with the accumulated text as streamed chunks arrive. */
  onDelta?: (textSoFar: string) => void;
}

export interface RunResult {
  text: string;
  stopReason: string | null;
  usage: Usage | null;
}

export class ApiError extends Error {}

export async function runMessages(params: RunParams): Promise<RunResult> {
  const { apiKey, model, system, messages, maxTokens, temperature, onDelta } = params;

  if (!apiKey) {
    throw new ApiError('No API key set. Tap the gear icon to add one.');
  }
  if (messages.length === 0) {
    throw new ApiError('Add at least one message before running.');
  }

  const cap = maxOutputTokensForModel(model);
  if (maxTokens > cap) {
    throw new ApiError(
      `Max tokens (${maxTokens}) exceeds ${model}'s limit of ${cap}. Lower "Max tokens".`
    );
  }

  const body: Record<string, unknown> = {
    model,
    max_tokens: maxTokens,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
    stream: true,
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
        accept: 'text/event-stream',
      },
      body: JSON.stringify(body),
    });
  } catch (networkErr) {
    throw new ApiError('Network request failed. Check your connection and try again.');
  }

  // On a rejected request (bad key, bad params, etc.) Anthropic returns a
  // normal JSON error body, not a stream — read and surface it directly.
  if (!response.ok) {
    const rawBody = await response.text();
    let json: any = null;
    try {
      json = rawBody.length > 0 ? JSON.parse(rawBody) : null;
    } catch {
      // ignore — fall through to the generic status message below
    }
    const message = json?.error?.message ?? `Request failed with status ${response.status}.`;
    throw new ApiError(message);
  }

  if (!response.body) {
    throw new ApiError('This environment does not support streaming responses.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let text = '';
  let stopReason: string | null = null;
  let usage: Usage | null = null;
  let streamError: string | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let sepIndex: number;
    // SSE events are separated by a blank line.
    while ((sepIndex = buffer.indexOf('\n\n')) !== -1) {
      const rawEvent = buffer.slice(0, sepIndex);
      buffer = buffer.slice(sepIndex + 2);

      const dataLine = rawEvent
        .split('\n')
        .find((line) => line.startsWith('data:'));
      if (!dataLine) continue;

      let evt: any;
      try {
        evt = JSON.parse(dataLine.slice(5).trim());
      } catch {
        continue; // ignore malformed/partial event rather than failing the whole stream
      }

      switch (evt.type) {
        case 'message_start':
          usage = evt.message?.usage ?? usage;
          break;
        case 'content_block_delta':
          if (evt.delta?.type === 'text_delta') {
            text += evt.delta.text;
            onDelta?.(text);
          }
          break;
        case 'message_delta':
          stopReason = evt.delta?.stop_reason ?? stopReason;
          if (evt.usage) usage = { ...usage, ...evt.usage };
          break;
        case 'error':
          streamError = evt.error?.message ?? 'Unknown streaming error.';
          break;
        default:
          break;
      }
    }
  }

  if (streamError) {
    throw new ApiError(streamError);
  }

  if (text.length === 0) {
    if (stopReason === 'max_tokens') {
      throw new ApiError(
        'The response hit the max tokens limit before producing any text. ' +
          'Try raising "Max tokens".'
      );
    }
    if (stopReason) {
      throw new ApiError(`Response contained no text content (stop_reason: "${stopReason}").`);
    }
  }

  return { text, stopReason, usage };
}
