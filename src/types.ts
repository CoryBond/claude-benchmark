export type Role = 'user' | 'assistant';

export interface Message {
  id: string;
  role: Role;
  content: string;
}

export interface Usage {
  input_tokens: number;
  output_tokens: number;
}

export interface Conversation {
  id: string;
  name: string;
  system: string;
  model: string;
  maxTokens: string;
  temperature: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}
