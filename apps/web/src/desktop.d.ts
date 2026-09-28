export {};
declare global {
  interface Window {
    tesseraDesktop?: { onClose(handler: (action: 'inspect' | 'save') => Promise<{ dirty: boolean; saved: boolean }>): void };
  }
}
