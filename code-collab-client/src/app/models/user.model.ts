export interface User {
  id: string;
  name: string;
  cursorPosition?: {
    lineNumber: number;
    column: number;
  };
  selectionRange?: {
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
  };
  color: string;
  status: 'active' | 'idle' | 'away';
}
