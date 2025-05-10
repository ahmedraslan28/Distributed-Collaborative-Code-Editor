import { SupportedLanguage } from "./room.model";

export interface CodeExecution {
  language: SupportedLanguage;
  code: string;
  input: string;
  output?: string;
  error?: string;
  executionTime?: number;
  status: 'running' | 'completed' | 'error';
}
