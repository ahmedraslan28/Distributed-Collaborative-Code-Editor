export interface Message {
  userName: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'code' | 'system';
}
