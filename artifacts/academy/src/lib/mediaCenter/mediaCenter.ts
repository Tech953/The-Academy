import { useCallback, useEffect, useRef, useState } from 'react';

export type MediaKind = 'audio' | 'video';
export type RepeatMode = 'off' | 'all' | 'one';
export interface MediaTrack {
  id: string; name: string; extension: string; kind: MediaKind; mimeType: string;
  relativePath: string; size: number; lastModified: number; duration: number | null; available: boolean;
}
export interface MediaPlaylist {
  id: string; name: string; trackIds: string[]; createdAt: number; updatedAt: number;
}
export interface MediaPreferences {
  volume: number; playbackRate: number; balance: number; shuffle: boolean;
  repeatMode: RepeatMode; equalizerPreset: string; equalizerBands: number[];
}
export interface MediaFolderStatus { name: string | null; access: 'none' | 'granted' | 'needs-reselect' | 'unsupported'; }
type DirectoryEntry = FileSystemFileHandle | FileSystemDirectoryHandle;
type DirectoryHandle = FileSystemDirectoryHandle & {
  queryPermission?: (descriptor?: { mode?: 'read' | 'readwrite' }) => Promise<PermissionState>;
  values?: () => AsyncIterableIterator<DirectoryEntry>;
};

export interface MediaLibraryState {
  tracks: MediaTrack[]; playlists: MediaPlaylist[]; preferences: MediaPreferences;
  selectedPlaylistId: string | null; currentTrack: MediaTrack | null; currentFileUrl: string | null;
  folderStatus: MediaFolderStatus; isLoading: boolean; isImporting: boolean; isScanning: boolean;
  error: string | null; notice: string | null;
}
export interface MediaLibraryActions {
  pickFiles(): Promise<'picked' | 'fallback'>; addFiles(files: FileList | File[]): Promise<void>;
  pickFolder(): Promise<'picked' | 'fallback'>; importDirectoryFiles(files: FileList | File[]): Promise<void>;
  rescanFolder(): Promise<void>; selectTrack(id: string): Promise<boolean>;
  updateTrackDuration(id: string, duration: number): void;
  createPlaylist(name: string): string | null; renamePlaylist(id: string, name: string): void;
  deletePlaylist(id: string): void; addTrackToPlaylist(playlistId: string, trackId: string): void;
  removeTrackFromPlaylist(playlistId: string, trackId: string): void;
  setSelectedPlaylist(id: string | null): void; updatePreferences(patch: Partial<MediaPreferences>): void;
  playNext(queueIds: string[]): Promise<void>; playPrevious(queueIds: string[]): Promise<void>;
  removeTrack(id: string): void;
}

const STORAGE = 'academy-media-center-v1';
const HANDLE_DB = 'academy-media-center-handles';
const AUDIO = new Set(['mp3', 'm4a', 'aac', 'wav', 'ogg', 'oga', 'flac', 'opus', 'weba', 'aiff']);
const VIDEO = new Set(['mp4', 'webm', 'mkv', 'mov', 'm4v', 'avi', 'ogv']);
const DEFAULT_PREFERENCES: MediaPreferences = {
  volume: 1, playbackRate: 1, balance: 0, shuffle: false, repeatMode: 'off',
  equalizerPreset: 'flat', equalizerBands: [0, 0, 0, 0, 0],
};
const emptyState: MediaLibraryState = {
  tracks: [], playlists: [], preferences: DEFAULT_PREFERENCES, selectedPlaylistId: null,
  currentTrack: null, currentFileUrl: null, folderStatus: { name: null, access: 'none' },
  isLoading: true, isImporting: false, isScanning: false, error: null, notice: null,
};
const asArray = (files: FileList | File[]) => Array.from(files);
const extensionOf = (name: string) => (name.split('.').pop() || '').toLowerCase();
export function classifyMedia(file: Pick<File, 'name' | 'type'>): MediaKind | null {
  const ext = extensionOf(file.name);
  if (file.type.startsWith('audio/') || AUDIO.has(ext)) return 'audio';
  if (file.type.startsWith('video/') || VIDEO.has(ext)) return 'video';
  return null;
}
const filePath = (file: File) => (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;
const idFor = (file: File, path: string) => `${path}\u0000${file.size}\u0000${file.lastModified}`;
const readStored = (): Pick<MediaLibraryState, 'tracks' | 'playlists' | 'preferences' | 'selectedPlaylistId'> => {
  if (typeof localStorage === 'undefined') return { tracks: [], playlists: [], preferences: DEFAULT_PREFERENCES, selectedPlaylistId: null };
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE) || '{}');
    return {
      tracks: Array.isArray(value.tracks) ? value.tracks : [],
      playlists: Array.isArray(value.playlists) ? value.playlists : [],
      preferences: { ...DEFAULT_PREFERENCES, ...(value.preferences || {}) },
      selectedPlaylistId: value.selectedPlaylistId ?? null,
    };
  } catch { return { tracks: [], playlists: [], preferences: DEFAULT_PREFERENCES, selectedPlaylistId: null }; }
};
const persist = (s: Pick<MediaLibraryState, 'tracks' | 'playlists' | 'preferences' | 'selectedPlaylistId'>) => {
  try { localStorage.setItem(STORAGE, JSON.stringify(s)); } catch { /* storage can be disabled */ }
};
const handleStore = (mode: 'get' | 'put' | 'clear', handle?: DirectoryHandle) => new Promise<any>((resolve) => {
  if (typeof indexedDB === 'undefined') return resolve(undefined);
  const request = indexedDB.open(HANDLE_DB, 1);
  request.onupgradeneeded = () => request.result.createObjectStore('handles');
  request.onerror = () => resolve(undefined);
  request.onsuccess = () => {
    const db = request.result; const tx = db.transaction('handles', mode === 'get' ? 'readonly' : 'readwrite');
    const store = tx.objectStore('handles'); const req = mode === 'get' ? store.get('folder') : mode === 'put' ? store.put(handle, 'folder') : store.delete('folder');
    req.onsuccess = () => resolve(req.result); req.onerror = () => resolve(undefined);
  };
});

export function useMediaLibrary(): MediaLibraryState & MediaLibraryActions {
  const [state, setState] = useState<MediaLibraryState>(emptyState);
  const filesRef = useRef(new Map<string, File>());
  const handleRef = useRef<DirectoryHandle | undefined>(undefined);
  const persistState = useCallback((next: MediaLibraryState) => {
    persist(next);
    setState(next);
  }, []);
  useEffect(() => {
    const saved = readStored();
    // File objects are deliberately never persisted; metadata survives, but
    // tracks need re-selection after a reload until their files are imported.
    setState(s => ({ ...s, ...saved, tracks: saved.tracks.map(t => ({ ...t, available: false })), isLoading: false }));
    void handleStore('get').then((h: DirectoryHandle | undefined) => {
      if (!h) return;
      handleRef.current = h;
      void (h.queryPermission ? h.queryPermission({ mode: 'read' }) : Promise.resolve<PermissionState>('granted')).then(permission => setState(s => ({ ...s, folderStatus: { name: h.name, access: permission === 'granted' ? 'granted' : 'needs-reselect' } }))).catch(() => undefined);
    });
  }, []);
  const addFiles = useCallback(async (input: FileList | File[]) => {
    setState(s => ({ ...s, isImporting: true, error: null }));
    const accepted = asArray(input).filter(f => classifyMedia(f));
    const nextTracks = [...state.tracks];
    accepted.forEach(file => {
      const path = filePath(file); const id = idFor(file, path); const kind = classifyMedia(file)!;
      filesRef.current.set(id, file);
      const existing = nextTracks.find(t => t.id === id);
      if (existing) existing.available = true;
      else nextTracks.push({ id, name: file.name, extension: extensionOf(file.name), kind, mimeType: file.type || `${kind}/*`, relativePath: path, size: file.size, lastModified: file.lastModified, duration: null, available: true });
    });
    const next = { ...state, tracks: nextTracks, isImporting: false, notice: accepted.length ? `${accepted.length} media file${accepted.length === 1 ? '' : 's'} imported.` : 'No supported media files found.' };
    persistState(next);
  }, [state, persistState]);
  const inputPicker = useCallback((directory: boolean) => new Promise<FileList | null>(resolve => {
    const input = document.createElement('input'); input.type = 'file'; input.multiple = true;
    if (directory) input.setAttribute('webkitdirectory', '');
    input.onchange = () => resolve(input.files); input.click();
  }), []);
  const pickFiles = useCallback(async () => { const files = await inputPicker(false); if (!files) return 'fallback' as const; await addFiles(files); return 'picked' as const; }, [inputPicker, addFiles]);
  const importDirectoryFiles = useCallback(async (files: FileList | File[]) => {
    await addFiles(files);
    setState(s => ({ ...s, folderStatus: { name: (asArray(files)[0] as File & { webkitRelativePath?: string })?.webkitRelativePath?.split('/')[0] || null, access: 'granted' } }));
  }, [addFiles]);
  const rescanFolder = useCallback(async () => {
    const handle = handleRef.current; if (!handle) { setState(s => ({ ...s, folderStatus: { ...s.folderStatus, access: 'none' } })); return; }
    setState(s => ({ ...s, isScanning: true }));
    try {
      const permission = handle.queryPermission ? await handle.queryPermission({ mode: 'read' }) : 'granted';
      if (permission !== 'granted') { setState(s => ({ ...s, isScanning: false, folderStatus: { name: handle.name, access: 'needs-reselect' } })); return; }
      const found: File[] = [];
      const walk = async (dir: DirectoryHandle, prefix = '') => { if (!dir.values) return; for await (const entry of dir.values()) { if (entry.kind === 'file') { const f = await entry.getFile(); (f as File & { webkitRelativePath?: string }).webkitRelativePath = `${prefix}${f.name}`; found.push(f); } else await walk(entry as DirectoryHandle, `${prefix}${entry.name}/`); } };
      await walk(handle); await addFiles(found);
      setState(s => ({ ...s, isScanning: false, folderStatus: { name: handle.name, access: 'granted' } }));
    } catch { setState(s => ({ ...s, isScanning: false, folderStatus: { name: handle.name, access: 'needs-reselect' }, error: 'The folder is no longer available.' })); }
  }, [addFiles]);
  // A ref avoids the pickFolder/rescanFolder callback dependency cycle.
  const rescanRef = useRef(rescanFolder); rescanRef.current = rescanFolder;
  const pickFolderFixed = useCallback(async () => { const picker = (window as any).showDirectoryPicker; if (!picker) { const f = await inputPicker(true); if (!f) return 'fallback' as const; await importDirectoryFiles(f); return 'fallback' as const; } try { const h: DirectoryHandle = await picker(); handleRef.current = h; await handleStore('put', h); await rescanRef.current(); return 'picked' as const; } catch { return 'fallback' as const; } }, [inputPicker, importDirectoryFiles]);
  const mutate = useCallback((fn: (s: MediaLibraryState) => MediaLibraryState) => setState(s => { const n = fn(s); persist(n); return n; }), []);
  const selectTrack = useCallback(async (id: string) => { const t = state.tracks.find(x => x.id === id); if (!t || !filesRef.current.has(id)) return false; mutate(s => ({ ...s, currentTrack: t, currentFileUrl: URL.createObjectURL(filesRef.current.get(id)!) })); return true; }, [state.tracks, mutate]);
  useEffect(() => () => { if (state.currentFileUrl) URL.revokeObjectURL(state.currentFileUrl); }, [state.currentFileUrl]);
  const updateTrackDuration = useCallback((id: string, duration: number) => mutate(s => ({ ...s, tracks: s.tracks.map(t => t.id === id ? { ...t, duration } : t) })), [mutate]);
  const createPlaylist = useCallback((name: string) => { if (!name.trim()) return null; const id = crypto.randomUUID(); const now = Date.now(); mutate(s => ({ ...s, playlists: [...s.playlists, { id, name: name.trim(), trackIds: [], createdAt: now, updatedAt: now }] })); return id; }, [mutate]);
  const renamePlaylist = useCallback((id: string, name: string) => mutate(s => ({ ...s, playlists: s.playlists.map(p => p.id === id ? { ...p, name: name.trim(), updatedAt: Date.now() } : p) })), [mutate]);
  const deletePlaylist = useCallback((id: string) => mutate(s => ({ ...s, playlists: s.playlists.filter(p => p.id !== id), selectedPlaylistId: s.selectedPlaylistId === id ? null : s.selectedPlaylistId })), [mutate]);
  const playlistChange = useCallback((pid: string, tid: string, add: boolean) => mutate(s => ({ ...s, playlists: s.playlists.map(p => p.id === pid ? { ...p, trackIds: add ? Array.from(new Set([...p.trackIds, tid])) : p.trackIds.filter(x => x !== tid), updatedAt: Date.now() } : p) })), [mutate]);
  const updatePreferences = useCallback((patch: Partial<MediaPreferences>) => mutate(s => ({ ...s, preferences: { ...s.preferences, ...patch, volume: Math.max(0, Math.min(1, patch.volume ?? s.preferences.volume)), balance: Math.max(-1, Math.min(1, patch.balance ?? s.preferences.balance)) } })), [mutate]);
  const setSelectedPlaylist = useCallback((id: string | null) => mutate(s => ({ ...s, selectedPlaylistId: id })), [mutate]);
  const removeTrack = useCallback((id: string) => { filesRef.current.delete(id); mutate(s => ({ ...s, tracks: s.tracks.filter(t => t.id !== id), playlists: s.playlists.map(p => ({ ...p, trackIds: p.trackIds.filter(x => x !== id) })), currentTrack: s.currentTrack?.id === id ? null : s.currentTrack, currentFileUrl: s.currentTrack?.id === id ? null : s.currentFileUrl })); }, [mutate]);
  const step = useCallback(async (ids: string[], direction: 1 | -1) => { const i = ids.indexOf(state.currentTrack?.id || ''); const next = ids[(i + direction + ids.length) % ids.length]; if (next) await selectTrack(next); }, [state.currentTrack, selectTrack]);
  return { ...state, pickFiles, addFiles, pickFolder: pickFolderFixed, importDirectoryFiles, rescanFolder, selectTrack, updateTrackDuration, createPlaylist, renamePlaylist, deletePlaylist, addTrackToPlaylist: (p, t) => playlistChange(p, t, true), removeTrackFromPlaylist: (p, t) => playlistChange(p, t, false), setSelectedPlaylist, updatePreferences, playNext: q => step(q, 1), playPrevious: q => step(q, -1), removeTrack };
}