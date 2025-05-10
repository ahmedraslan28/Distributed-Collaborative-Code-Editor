import { User } from "./user.model";

export enum SupportedLanguage {
  Java = 'java',
  Cpp = 'cpp',
  Python = 'python',
  JavaScript = 'javascript'
}

export interface Room {
  id: string;
  users: User[];
  language: SupportedLanguage;
  code: string;
}
