export interface TrashItem {
  id: string;
  name: string;
  originalPath: string;
  content?: string;
  type: 'file' | 'directory';
  deletedAt: string;
}

const TRASH_KEY = 'academy-trash-v1';

export function getTrashItems(): TrashItem[] {
  try {
    const stored = localStorage.getItem(TRASH_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function moveToTrash(item: { name: string; path: string; content?: string; type: 'file' | 'directory' }): void {
  const items = getTrashItems();
  items.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    name: item.name,
    originalPath: item.path,
    content: item.content,
    type: item.type,
    deletedAt: new Date().toISOString(),
  });
  localStorage.setItem(TRASH_KEY, JSON.stringify(items));
}

export function restoreFromTrash(id: string): TrashItem | null {
  const items = getTrashItems();
  const item = items.find(i => i.id === id);
  if (!item) return null;
  const remaining = items.filter(i => i.id !== id);
  localStorage.setItem(TRASH_KEY, JSON.stringify(remaining));
  return item;
}

export function permanentlyDelete(id: string): void {
  const items = getTrashItems().filter(i => i.id !== id);
  localStorage.setItem(TRASH_KEY, JSON.stringify(items));
}

export function emptyTrash(): void {
  localStorage.setItem(TRASH_KEY, JSON.stringify([]));
}

export function getTrashCount(): number {
  return getTrashItems().length;
}
