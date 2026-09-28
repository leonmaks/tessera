import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import { createRoot } from 'react-dom/client';
import { createEditorClient } from '@tessera-ts/graph-client';
import type { EditorCommand, EditorReply, EditorSnapshot } from '@tessera-ts/graph-client';
import './style.css';

const client = createEditorClient();
type Block = EditorSnapshot['blocks'][number];
type Focus = { uuid: string; offset: number; token: number };

function App() {
  const state = useSyncExternalStore(client.subscribe, client.snapshot);
  const [pageId, setPageId] = useState(location.hash.slice(1));
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(0);
  const [search, setSearch] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [focus, setFocus] = useState<Focus>();
  const [selected, setSelected] = useState<string[]>([]);
  const [collapsed, setCollapsed] = useState<Set<string>>(() => {
    try { const value: unknown = JSON.parse(localStorage.getItem('tessera.collapsed') || '[]'); return new Set(Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : []); } catch { return new Set(); }
  });
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const pending = useRef(new Map<string, string>());
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const actions = useRef<Promise<unknown>>(Promise.resolve());
  const active = useRef<{ uuid: string; offset: number } | undefined>(undefined);
  const page = state.pages.find(p => p.uuid === pageId) ?? state.pages[0];
  const pageBlocks = state.blocks.filter(b => b.page === page?.uuid);
  const children = (parent: string) => pageBlocks.filter(b => b.parent === parent).sort((a, b) => a.order.localeCompare(b.order));
  const visible: { block: Block; depth: number }[] = [];
  function collect(parent: string, depth: number) { for (const block of children(parent)) { visible.push({ block, depth }); if (!collapsed.has(block.uuid)) collect(block.uuid, depth + 1); } }
  if (page) collect(page.uuid, 0);

  function navigate(id: string) { location.hash = id; setPageId(id); setSelected([]); setSearch(''); }
  function focusBlock(uuid: string, offset = 0) { setFocus({ uuid, offset, token: Date.now() + Math.random() }); }
  async function flush() {
    clearTimeout(timer.current);
    for (const [uuid, content] of [...pending.current]) {
      await client.execute({ kind: 'block.update', uuid, content });
      if (pending.current.get(uuid) === content) {
        pending.current.delete(uuid);
        setDrafts(current => { const next = { ...current }; delete next[uuid]; return next; });
      }
      setDirty(pending.current.size);
    }
  }
  function task(action: () => Promise<void>) {
    const job = actions.current.then(async () => { setBusy(true); try { await action(); setError(''); } catch (e) { setError(e instanceof Error ? e.message : 'Не удалось сохранить'); } finally { setBusy(false); } });
    actions.current = job; return job;
  }
  function change(uuid: string, content: string) {
    pending.current.set(uuid, content); setDrafts(current => ({ ...current, [uuid]: content })); setDirty(pending.current.size);
    clearTimeout(timer.current); timer.current = setTimeout(() => { void task(flush); }, 400);
  }
  function command(command: EditorCommand, after?: (reply: EditorReply) => void) {
    void task(async () => {
      await flush();
      const reply = await client.execute(command);
      if (reply.focus && reply.snapshot.blocks.some(b => b.uuid === reply.focus)) {
        const target = reply.snapshot.blocks.find(b => b.uuid === reply.focus)!;
        const expand = new Set(collapsed); let parent = target.parent;
        for (let i = 0; i < reply.snapshot.blocks.length; i++) { expand.delete(parent); const ancestor = reply.snapshot.blocks.find(b => b.uuid === parent); if (!ancestor) break; parent = ancestor.parent; }
        setCollapsed(expand);
        focusBlock(reply.focus, reply.offset ?? active.current?.offset ?? 0);
      }
      after?.(reply);
    });
  }
  useEffect(() => {
    void client.reload().then(() => setReady(true)).catch(e => setError(String(e)));
    const onHash = () => { setPageId(location.hash.slice(1)); setSelected([]); };
    const unload = (event: BeforeUnloadEvent) => { if (pending.current.size) { event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('hashchange', onHash); window.addEventListener('beforeunload', unload);
    const poll = setInterval(() => { if (!pending.current.size) void client.reload().catch(e => setError(String(e))); }, 2000);
    return () => { clearInterval(poll); window.removeEventListener('hashchange', onHash); window.removeEventListener('beforeunload', unload); };
  }, []);
  useEffect(() => { try { localStorage.setItem('tessera.collapsed', JSON.stringify([...collapsed])); } catch { /* view state persistence is optional */ } }, [collapsed]);
  useEffect(() => { document.title = page ? `${page.content} · Tessera` : 'Tessera'; }, [page?.content]);
  useEffect(() => {
    window.tesseraDesktop?.onClose(async action => {
      if (action === 'save') clearTimeout(timer.current);
      await actions.current;
      const heading = document.querySelector<HTMLInputElement>('.page-title');
      const title = heading?.value ?? page?.content;
      const renamed = !!page && title !== client.snapshot().pages.find(p => p.uuid === page.uuid)?.content;
      const dirty = pending.current.size > 0 || renamed || !!newTitle.trim();
      if (action === 'inspect') return { dirty, saved: !dirty };
      try {
        await flush();
        if (renamed && page && title) await client.execute({ kind: 'page.rename', uuid: page.uuid, title });
        if (newTitle.trim()) { const reply = await client.execute({ kind: 'page.create', title: newTitle }); setNewTitle(''); if (reply.focus) navigate(reply.focus); }
        setError('');
        return { dirty: pending.current.size > 0, saved: pending.current.size === 0 };
      } catch (e) { setError(String(e)); return { dirty: true, saved: false }; }
    });
  });
  function toggle(uuid: string) { setCollapsed(current => { const next = new Set(current); if (next.has(uuid)) next.delete(uuid); else next.add(uuid); return next; }); }
  function undo(redo = false) { command({ kind: redo ? 'history.redo' : 'history.undo' }, () => setSelected([])); }
  function exportPage() {
    if (!page) return;
    void task(async () => {
      await flush();
      const snapshot = client.snapshot();
      const lines: string[] = [`# ${page.content}`, ''];
      const visit = (parent: string, depth: number) => {
        for (const b of snapshot.blocks.filter(b => b.parent === parent).sort((a, b) => a.order.localeCompare(b.order))) {
          const text = b.content.split('\n'); lines.push(`${'  '.repeat(depth)}- ${text[0]}`);
          lines.push(...text.slice(1).map(line => `${'  '.repeat(depth + 1)}${line}`)); visit(b.uuid, depth + 1);
        }
      };
      visit(page.uuid, 0);
      const link = document.createElement('a'); const url = URL.createObjectURL(new Blob([lines.join('\n') + '\n'], { type: 'text/markdown;charset=utf-8' }));
      link.href = url; link.download = `${page.content.replace(/[<>:"/\\|?*]/g, '_')}.md`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
  }
  const matches = state.pages.filter(p => !search || p.content.toLocaleLowerCase().includes(search.toLocaleLowerCase()) || state.blocks.some(b => b.page === p.uuid && b.content.toLocaleLowerCase().includes(search.toLocaleLowerCase())));
  return <div className="app" onKeyDown={event => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') { event.preventDefault(); void task(flush); }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z' && (event.target instanceof HTMLTextAreaElement)) { event.preventDefault(); undo(event.shiftKey); }
  }}>
    <aside className="sidebar">
      <a className="brand" href="#" onClick={() => setPageId('')}><span className="logo">▧</span> Tessera <span className="local">LOCAL</span></a>
      <label className="search">⌕ <input aria-label="Поиск" placeholder="Найти страницу или текст…" value={search} onChange={e => setSearch(e.target.value)} /></label>
      <div className="section-label">СТРАНИЦЫ <span>{state.pages.length}</span></div>
      <nav aria-label="Страницы">{matches.map(p => <button className={`page-link ${page?.uuid === p.uuid ? 'active' : ''}`} key={p.uuid} onClick={() => navigate(p.uuid)}><span>▤</span>{p.content}</button>)}{search && matches.length === 0 && <p className="muted">Ничего не найдено</p>}</nav>
      <form className="new-page" onSubmit={e => { e.preventDefault(); if (newTitle.trim()) command({ kind: 'page.create', title: newTitle }, reply => { navigate(reply.focus!); setNewTitle(''); }); }}>
        <input aria-label="Название новой страницы" placeholder="Новая страница…" value={newTitle} maxLength={300} onChange={e => setNewTitle(e.target.value)} />
        <button aria-label="Создать страницу" title="Создать страницу" disabled={busy || !newTitle.trim()}>+</button>
      </form>
      <footer><span className="status-dot" /> Локальный граф<br /><small>Данные хранятся на этом компьютере</small></footer>
    </aside>
    <main>
      <header className="topbar"><div className="breadcrumb">Мои заметки <span>/</span> {page?.content || 'Начало'}</div><div className="save" role="status">{error ? 'Не сохранено' : busy || dirty ? 'Сохранение…' : ready ? 'Все изменения сохранены' : 'Загрузка…'}</div></header>
      {error && <div className="error" role="alert"><span>{error}</span><button onClick={() => { void task(async () => { await client.reload(); await flush(); setReady(true); }); }}>Повторить сохранение</button></div>}
      {page ? <article className="document">
        <div className="eyebrow">СТРАНИЦА <span>• {pageBlocks.length} блоков</span></div>
        <PageTitle key={page.uuid + page.content} title={page.content} onRename={title => { if (title.trim() && title !== page.content) command({ kind: 'page.rename', uuid: page.uuid, title }); }} />
        <div className="toolbar">
          <button onClick={() => undo()} disabled={busy || !state.canUndo} title="Ctrl+Z">↶ Отменить</button>
          <button onClick={() => undo(true)} disabled={busy || !state.canRedo} title="Ctrl+Shift+Z">↷ Повторить</button>
          <span className="spacer" /><button onClick={exportPage}>↓ Markdown</button>
        </div>
        {selected.length > 0 && <div className="selection-bar"><span>Выбрано: {selected.length}</span><button onClick={() => command({ kind: 'block.indent', uuids: selected })}>Вложить</button><button onClick={() => command({ kind: 'block.outdent', uuids: selected })}>Поднять</button><select aria-label="Переместить на страницу" value="" onChange={e => { if (e.target.value) command({ kind: 'block.move', uuids: selected, target: e.target.value, placement: 'inside' }, () => setSelected([])); }}><option value="">На страницу…</option>{state.pages.filter(p => p.uuid !== page.uuid).map(p => <option key={p.uuid} value={p.uuid}>{p.content}</option>)}</select><button className="danger" onClick={() => command({ kind: 'block.delete', uuids: selected }, () => setSelected([]))}>Удалить</button><button onClick={() => setSelected([])}>×</button></div>}
        <div className="block-list" aria-label="Блоки страницы">{visible.map(({ block, depth }, index) => <div key={block.uuid} className={`block-row ${selected.includes(block.uuid) ? 'selected' : ''}`} style={{ paddingLeft: `${depth * 26}px` }} data-testid="block-row" data-uuid={block.uuid} data-depth={depth}
          onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }} onDrop={e => { e.preventDefault(); const id = e.dataTransfer.getData('text/tessera-block'); if (id && id !== block.uuid) command({ kind: 'block.move', uuids: selected.includes(id) ? selected : [id], target: block.uuid, placement: e.altKey ? 'inside' : 'after' }); }}>
          <button className="fold" aria-label={collapsed.has(block.uuid) ? 'Развернуть блок' : 'Свернуть блок'} disabled={children(block.uuid).length === 0} onClick={() => toggle(block.uuid)}>{children(block.uuid).length ? collapsed.has(block.uuid) ? '▸' : '▾' : ''}</button>
          <button className="bullet" draggable aria-label="Выбрать блок" title="Выбрать блок. Перетащите для перемещения; Alt — вложить." onDragStart={e => e.dataTransfer.setData('text/tessera-block', block.uuid)} onClick={e => setSelected(current => e.ctrlKey || e.metaKey || e.shiftKey ? current.includes(block.uuid) ? current.filter(id => id !== block.uuid) : [...current, block.uuid] : current.length === 1 && current[0] === block.uuid ? [] : [block.uuid])}>•</button>
          <BlockInput block={block} text={drafts[block.uuid] ?? block.content} focus={focus} onChange={text => change(block.uuid, text)} onCaret={offset => { active.current = { uuid: block.uuid, offset }; }} onBlur={() => { if (pending.current.size && !error) void task(flush); }} onKey={(event, textarea) => {
            if (event.nativeEvent.isComposing) return;
            const start = textarea.selectionStart, end = textarea.selectionEnd;
            if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); if (start !== end) { change(block.uuid, textarea.value.slice(0, start) + textarea.value.slice(end)); } command({ kind: 'block.split', uuid: block.uuid, offset: start }); }
            else if (event.key === 'Tab') { event.preventDefault(); command({ kind: event.shiftKey ? 'block.outdent' : 'block.indent', uuids: selected.includes(block.uuid) ? selected : [block.uuid] }); }
            else if (event.key === 'Backspace' && start === 0 && end === 0) { event.preventDefault(); command({ kind: 'block.merge', uuid: block.uuid }); }
            else if (event.key === 'Delete' && start === textarea.value.length && end === start) { const siblings = children(block.parent); const next = siblings[siblings.findIndex(b => b.uuid === block.uuid) + 1]; if (next) { event.preventDefault(); command({ kind: 'block.merge', uuid: next.uuid }); } }
            else if (event.key === 'ArrowUp' && start === 0 && end === 0 && visible[index - 1]) { event.preventDefault(); const previous = visible[index - 1]!.block; focusBlock(previous.uuid, (drafts[previous.uuid] ?? previous.content).length); }
            else if (event.key === 'ArrowDown' && start === textarea.value.length && end === start && visible[index + 1]) { event.preventDefault(); focusBlock(visible[index + 1]!.block.uuid, 0); }
          }} />
          {collapsed.has(block.uuid) && children(block.uuid).length > 0 && <button className="child-count" onClick={() => toggle(block.uuid)}>{children(block.uuid).length} ↳</button>}
        </div>)}</div>
        <button className="add-block" disabled={busy} onClick={() => command({ kind: 'block.insert', parent: page.uuid, content: '' })}>+ Добавить блок</button>
        <div className="hints"><kbd>Enter</kbd> новый блок <span>·</span> <kbd>Shift ↵</kbd> новая строка <span>·</span> <kbd>Tab</kbd> вложить<br />Выделение — точка слева. Перетаскивание — перемещение блока.</div>
      </article> : <section className="empty"><div className="empty-mark">▧</div><h1>Место для ваших мыслей</h1><p>Создайте первую страницу слева.<br />Записывайте идеи, стройте планы и связывайте заметки.</p><p className="muted">Tessera сохраняет изменения автоматически.</p></section>}
    </main>
  </div>;
}

function PageTitle({ title, onRename }: { title: string; onRename: (title: string) => void }) {
  const [value, setValue] = useState(title);
  const cancelled = useRef(false);
  return <input className="page-title" aria-label="Название страницы" value={value} maxLength={300} onChange={e => { cancelled.current = false; setValue(e.target.value); }} onBlur={() => { if (cancelled.current || !value.trim()) setValue(title); else onRename(value); cancelled.current = false; }} onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); if (e.key === 'Escape') { cancelled.current = true; setValue(title); e.currentTarget.blur(); } }} />;
}
function BlockInput({ block, text, focus, onChange, onCaret, onBlur, onKey }: {
  block: Block; text: string; focus: Focus | undefined; onChange: (text: string) => void; onCaret: (offset: number) => void;
  onBlur: () => void; onKey: (event: React.KeyboardEvent<HTMLTextAreaElement>, textarea: HTMLTextAreaElement) => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => { if (ref.current) { ref.current.style.height = '0px'; ref.current.style.height = `${ref.current.scrollHeight}px`; } }, [text]);
  useLayoutEffect(() => {
    const textarea = ref.current; if (!textarea) return;
    let width = -1;
    let frame = 0;
    const observer = new ResizeObserver(() => {
      if (textarea.clientWidth === width) return;
      width = textarea.clientWidth;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => { textarea.style.height = '0px'; textarea.style.height = `${textarea.scrollHeight}px`; });
    });
    observer.observe(textarea); return () => { observer.disconnect(); cancelAnimationFrame(frame); };
  }, []);
  useLayoutEffect(() => { if (focus?.uuid === block.uuid && ref.current) { ref.current.focus(); ref.current.setSelectionRange(focus.offset, focus.offset); } }, [focus?.token]);
  return <textarea ref={ref} className="block-input" aria-label="Текст блока" value={text} rows={1} placeholder="Начните писать…" spellCheck maxLength={200000} onChange={e => onChange(e.target.value)} onSelect={e => onCaret(e.currentTarget.selectionStart)} onFocus={e => onCaret(e.currentTarget.selectionStart)} onBlur={onBlur} onKeyDown={e => onKey(e, e.currentTarget)} />;
}
createRoot(document.getElementById('root')!).render(<App />);
