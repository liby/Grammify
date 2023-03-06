export function isError(errorResponse: any): errorResponse is ErrorResponse {
  return errorResponse.error !== undefined;
}

export interface ErrorResponse {
  message: string;
  type: string;
  param?: any;
  code: number | null;
}
export interface CompletionResponse {
  id: string;
  object: "chat.completion";
  created: number;
  model: string;
  choices: Choice[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  error?: ErrorResponse;
}

interface Choice {
  message: {
    role: "assistant" | "user" | "system";
    content: string;
  };
  index: number;
  logprobs: null | Record<string, any>;
  finish_reason: "length" | "stop";
}

export type ChatGPTAgent = "user" | "system" | "assistant";

export interface ChatGPTMessage {
  role: ChatGPTAgent;
  content: string;
}

export interface OpenAIStreamPayload {
  model: string;
  messages: ChatGPTMessage[];
  temperature: number;
  top_p: number;
  frequency_penalty: number;
  presence_penalty: number;
  max_tokens: number;
  stream: boolean;
  n: number;
}
