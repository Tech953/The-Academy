export interface TerminalLine {
  id: string;
  text: string;
  type: 'output' | 'command' | 'system' | 'error' | 'narrative';
}