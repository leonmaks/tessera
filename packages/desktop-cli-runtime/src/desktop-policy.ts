export function trustedRenderer(raw: string, mainFrame: boolean): boolean {
  try {
    const url = new URL(raw);
    return mainFrame && url.protocol === 'tessera:' && url.hostname === 'app' && !url.port && !url.username && !url.password && (url.pathname === '/' || url.pathname === '/index.html') && !url.search;
  } catch { return false; }
}
export async function closeDecision(choice: 'save' | 'cancel' | 'discard', save: () => Promise<boolean>): Promise<boolean> {
  if (choice === 'discard') return true;
  if (choice !== 'save') return false;
  try { return await save(); } catch { return false; }
}
export function markdownDownloadOptions(filename: string, url: string, trusted: boolean) {
  if (!trusted || !url.startsWith('blob:tessera://app/')) return undefined;
  return { title: 'Экспорт Markdown', defaultPath: filename.replace(/[<>:"/\\|?*]/g, '_'), filters: [{ name: 'Markdown', extensions: ['md'] }] };
}
