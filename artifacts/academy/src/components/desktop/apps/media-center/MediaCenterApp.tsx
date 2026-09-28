import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { useI18n } from "@/contexts/I18nContext";
import { useCrtTheme } from "@/contexts/CrtThemeContext";
import { useMediaLibrary } from "@/lib/mediaCenter";
import {
  AudioLines,
  CircleAlert,
  FileAudio,
  FolderOpen,
  Gauge,
  ListMusic,
  MonitorPlay,
  Pause,
  Play,
  Plus,
  Radio,
  RefreshCw,
  Repeat,
  SkipBack,
  SkipForward,
  SlidersHorizontal,
  Trash2,
  Video,
  Volume2,
  X,
} from "lucide-react";
import "./MediaCenterApp.css";

type MediaKind = "audio" | "video";
type RepeatMode = "off" | "all" | "one";

interface MediaTrack {
  id: string;
  name: string;
  extension: string;
  kind: MediaKind;
  mimeType: string;
  relativePath: string;
  size: number;
  lastModified: number;
  duration: number | null;
  available: boolean;
}

interface MediaPlaylist {
  id: string;
  name: string;
  trackIds: string[];
  createdAt: number;
  updatedAt: number;
}

interface MediaPreferences {
  volume: number;
  playbackRate: number;
  balance: number;
  shuffle: boolean;
  repeatMode: RepeatMode;
  equalizerPreset: string;
  equalizerBands: number[];
}

interface MediaLibraryController {
  tracks: MediaTrack[];
  playlists: MediaPlaylist[];
  preferences: MediaPreferences;
  selectedPlaylistId: string | null;
  currentTrack: MediaTrack | null;
  currentFileUrl: string | null;
  folderStatus: { name: string | null; access: "none" | "granted" | "needs-reselect" | "unsupported" };
  isLoading: boolean;
  isImporting: boolean;
  isScanning: boolean;
  error: string | null;
  notice: string | null;
  pickFiles: () => Promise<"picked" | "fallback">;
  addFiles: (files: FileList | File[]) => void;
  pickFolder: () => Promise<"picked" | "fallback">;
  importDirectoryFiles: (files: FileList | File[]) => void;
  rescanFolder: () => void;
  selectTrack: (id: string) => Promise<boolean>;
  updateTrackDuration: (id: string, duration: number) => void;
  createPlaylist: (name: string) => string | null;
  renamePlaylist: (id: string, name: string) => void;
  deletePlaylist: (id: string) => void;
  addTrackToPlaylist: (playlistId: string, trackId: string) => void;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => void;
  setSelectedPlaylist: (id: string | null) => void;
  updatePreferences: (patch: Partial<MediaPreferences>) => void;
  playNext: (queueIds: string[]) => void;
  playPrevious: (queueIds: string[]) => void;
  removeTrack: (id: string) => void;
}

interface MediaProcessingGraph {
  element: HTMLMediaElement;
  context: AudioContext;
  filters: BiquadFilterNode[];
  panner: StereoPannerNode;
}

const EQ_PRESETS = [
  { value: "flat", label: "FLAT", bands: [0, 0, 0, 0, 0] },
  { value: "voice", label: "VOICE", bands: [-2, 3, 4, 2, -1] },
  { value: "focus", label: "FOCUS", bands: [-2, 1, 4, 3, -2] },
  { value: "warm", label: "WARM", bands: [3, 2, 0, -1, -2] },
];
const EQ_FREQUENCIES = ["80", "250", "1K", "4K", "12K"];

function formatTime(seconds: number | null | undefined) {
  if (!Number.isFinite(seconds) || !seconds || seconds < 0) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function formatSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes < 1024) return `${Math.max(0, bytes)} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fallbackText(t: (key: string, replacements?: Record<string, string>) => string, key: string, fallback: string) {
  const translated = t(key);
  return translated === key ? fallback : translated;
}

export function MediaCenterApp() {
  const { colors, accentColors } = useCrtTheme();
  const { t } = useI18n();
  const library = useMediaLibrary() as unknown as MediaLibraryController;
  const {
    tracks, playlists, preferences, selectedPlaylistId, currentTrack, currentFileUrl,
    folderStatus, isLoading, isImporting, isScanning, error, notice,
    pickFiles, addFiles, pickFolder, importDirectoryFiles, rescanFolder, selectTrack,
    updateTrackDuration, createPlaylist, renamePlaylist, deletePlaylist,
    addTrackToPlaylist, removeTrackFromPlaylist, setSelectedPlaylist, updatePreferences,
    playNext, playPrevious, removeTrack,
  } = library;

  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [processingAvailable, setProcessingAvailable] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const [editingPlaylistId, setEditingPlaylistId] = useState<string | null>(null);
  const [editingPlaylistName, setEditingPlaylistName] = useState("");

  const selectedPlaylist = playlists.find((playlist) => playlist.id === selectedPlaylistId) ?? null;
  const queueIds = useMemo(() => {
    const ids = selectedPlaylist?.trackIds ?? tracks.map((track) => track.id);
    return ids.filter((id) => tracks.some((track) => track.id === id && track.available));
  }, [selectedPlaylist, tracks]);
  const availableTracks = useMemo(() => tracks.filter((track) => track.available), [tracks]);
  const processingRef = useRef<MediaProcessingGraph | null>(null);
  const capabilityMessage = !processingAvailable && currentTrack
    ? fallbackText(t, "media.capability.basic", "Audio processing is unavailable here. Basic playback remains available.")
    : null;

  const setupProcessing = useCallback((element: HTMLMediaElement | null) => {
    if (!element || typeof window === "undefined" || !window.AudioContext) {
      setProcessingAvailable(false);
      return;
    }
    if (processingRef.current?.element === element) {
      setProcessingAvailable(true);
      return;
    }
    try {
      processingRef.current?.context.close();
      const context = new window.AudioContext();
      const source = context.createMediaElementSource(element);
      const frequencies = [80, 250, 1000, 4000, 12000];
      const filters = frequencies.map((frequency) => {
        const filter = context.createBiquadFilter();
        filter.type = "peaking";
        filter.frequency.value = frequency;
        filter.Q.value = 1;
        return filter;
      });
      const panner = context.createStereoPanner();
      let previous: AudioNode = source;
      filters.forEach((filter) => { previous.connect(filter); previous = filter; });
      previous.connect(panner);
      panner.connect(context.destination);
      processingRef.current = { element, context, filters, panner };
      setProcessingAvailable(true);
    } catch {
      processingRef.current = null;
      setProcessingAvailable(false);
    }
  }, []);

  useEffect(() => {
    setupProcessing(currentTrack?.kind === "video" ? videoRef.current : audioRef.current);
  }, [currentFileUrl, currentTrack?.id, currentTrack?.kind, setupProcessing]);

  useEffect(() => {
    const graph = processingRef.current;
    if (!graph) return;
    const bands = preferences.equalizerBands.length ? preferences.equalizerBands : [0, 0, 0, 0, 0];
    graph.filters.forEach((filter, index) => { filter.gain.value = bands[index] ?? 0; });
    graph.panner.pan.value = preferences.balance;
  }, [preferences.equalizerBands, preferences.balance]);

  useEffect(() => () => {
    void processingRef.current?.context.close();
  }, []);

  const updateMediaVolume = useCallback(() => {
    if (audioRef.current) audioRef.current.volume = preferences.volume;
    if (videoRef.current) videoRef.current.volume = preferences.volume;
  }, [preferences.volume]);

  useEffect(() => {
    updateMediaVolume();
    if (audioRef.current) audioRef.current.playbackRate = preferences.playbackRate;
    if (videoRef.current) videoRef.current.playbackRate = preferences.playbackRate;
  }, [preferences.playbackRate, updateMediaVolume]);

  useEffect(() => {
    setMediaError(null);
    setPosition(0);
    setDuration(currentTrack?.duration ?? 0);
    if (!currentFileUrl || !currentTrack) {
      setIsPlaying(false);
      return;
    }
    const media = currentTrack.kind === "video" ? videoRef.current : audioRef.current;
    if (!media) return;
    media.load();
    const playPromise = media.play();
    if (playPromise) playPromise.then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
  }, [currentFileUrl, currentTrack?.id, currentTrack?.kind]);

  const handleMediaMetadata = useCallback((event: React.SyntheticEvent<HTMLMediaElement>) => {
    const value = event.currentTarget.duration;
    if (Number.isFinite(value)) {
      setDuration(value);
      if (currentTrack && Math.abs((currentTrack.duration ?? 0) - value) > 0.25) {
        updateTrackDuration(currentTrack.id, value);
      }
    }
  }, [currentTrack, updateTrackDuration]);

  const handleMediaTime = useCallback((event: React.SyntheticEvent<HTMLMediaElement>) => {
    setPosition(event.currentTarget.currentTime);
  }, []);

  const handleMediaEnded = useCallback(() => {
    setIsPlaying(false);
    if (!currentTrack) return;
    if (preferences.repeatMode === "one") {
      const media = currentTrack.kind === "video" ? videoRef.current : audioRef.current;
      if (media) {
        media.currentTime = 0;
        media.play().then(() => setIsPlaying(true)).catch(() => undefined);
      }
      return;
    }
    if (preferences.repeatMode === "all" || queueIds.length > 1) playNext(queueIds);
  }, [currentTrack, playNext, preferences.repeatMode, queueIds]);

  const chooseTrack = useCallback(async (id: string) => {
    setMediaError(null);
    await selectTrack(id);
  }, [selectTrack]);

  const togglePlayback = useCallback(() => {
    const media = currentTrack?.kind === "video" ? videoRef.current : audioRef.current;
    if (!media) return;
    if (media.paused) {
      const graph = processingRef.current;
      if (graph?.context.state === "suspended") void graph.context.resume();
      media.play().then(() => setIsPlaying(true)).catch(() => setMediaError(
        fallbackText(t, "media.error.play", "This file could not be played by the browser."),
      ));
    } else {
      media.pause();
      setIsPlaying(false);
    }
  }, [currentTrack?.kind, t]);

  const handleSeek = (event: ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value);
    const media = currentTrack?.kind === "video" ? videoRef.current : audioRef.current;
    if (media) media.currentTime = value;
    setPosition(value);
  };

  const handleImportFiles = async () => {
    const result = await pickFiles();
    if (result === "fallback") fileInputRef.current?.click();
  };

  const handleImportFolder = async () => {
    const result = await pickFolder();
    if (result === "fallback") folderInputRef.current?.click();
  };

  const handleFolderInput = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.length) importDirectoryFiles(event.target.files);
    event.target.value = "";
  };

  const handleCreatePlaylist = () => {
    const name = newPlaylistName.trim();
    if (!name) return;
    const id = createPlaylist(name);
    if (id) {
      setNewPlaylistName("");
      setIsCreatingPlaylist(false);
      setSelectedPlaylist(id);
    }
  };

  const startPlaylistEdit = (playlist: MediaPlaylist) => {
    setEditingPlaylistId(playlist.id);
    setEditingPlaylistName(playlist.name);
  };

  const finishPlaylistEdit = (id: string) => {
    const name = editingPlaylistName.trim();
    if (name) renamePlaylist(id, name);
    setEditingPlaylistId(null);
  };

  const togglePlaylistMembership = (playlist: MediaPlaylist, trackId: string) => {
    if (playlist.trackIds.includes(trackId)) removeTrackFromPlaylist(playlist.id, trackId);
    else addTrackToPlaylist(playlist.id, trackId);
  };

  const mediaProps = {
    onLoadedMetadata: handleMediaMetadata,
    onTimeUpdate: handleMediaTime,
    onPlay: () => setIsPlaying(true),
    onPause: () => setIsPlaying(false),
    onEnded: handleMediaEnded,
    onError: () => setMediaError(fallbackText(t, "media.error.format", "This format is not supported by the browser.")),
    "data-testid": "media-element",
  };

  const currentQueueIndex = currentTrack ? queueIds.indexOf(currentTrack.id) : -1;
  const folderLabel = folderStatus.name
    ? `${folderStatus.name} / ${folderStatus.access}`
    : fallbackText(t, "media.folder.none", "No folder selected");
  const title = fallbackText(t, "media.title", "MEDIA CENTER");
  const subtitle = fallbackText(t, "media.subtitle", "PRIVATE CAMPUS MEDIA TERMINAL");

  return (
    <div
      className="media-center"
      style={{
        "--mc-primary": colors.primary,
        "--mc-bg": colors.background,
        "--mc-cyan": accentColors.cyan,
        "--mc-amber": accentColors.amber,
        "--mc-red": accentColors.red,
      } as React.CSSProperties}
      data-testid="media-center-app"
    >
      <input ref={fileInputRef} type="file" accept="audio/*,video/*" multiple hidden onChange={(event) => event.target.files && addFiles(event.target.files)} data-testid="input-media-files" />
      <input ref={folderInputRef} type="file" multiple hidden onChange={handleFolderInput} data-testid="input-media-folder" {...({ webkitdirectory: "", directory: "" } as Record<string, string>)} />

      <header className="media-center__header" data-testid="header-media-center">
        <div className="media-center__identity">
          <div className="media-center__mark" aria-hidden="true"><Radio size={14} /></div>
          <div>
            <div className="media-center__title">{title}</div>
            <div className="media-center__subtitle">{subtitle}</div>
          </div>
        </div>
        <div className="media-center__header-actions">
          <button className="media-center__button media-center__button--cyan" onClick={handleImportFiles} disabled={isImporting} data-testid="button-import-media">
            <Plus size={13} />{fallbackText(t, "media.import.files", "ADD FILES")}
          </button>
          <button className="media-center__button media-center__button--amber" onClick={handleImportFolder} disabled={isImporting} data-testid="button-import-folder">
            <FolderOpen size={13} />{fallbackText(t, "media.import.folder", "OPEN FOLDER")}
          </button>
        </div>
      </header>

      {(error || mediaError) && (
        <div className="media-center__message media-center__message--error" role="alert" data-testid="status-media-error">
          <CircleAlert size={12} /> {error ?? mediaError}
        </div>
      )}
      {notice && <div className="media-center__message" role="status" data-testid="status-media-notice">{notice}</div>}
      {capabilityMessage && <div className="media-center__message media-center__message--capability" role="status" data-testid="status-media-capability">{capabilityMessage}</div>}

      {isLoading ? (
        <div className="media-center__loading" data-testid="status-media-loading">{fallbackText(t, "media.loading", "READING LOCAL MEDIA INDEX...")}</div>
      ) : (
        <div className="media-center__body">
          <section className="media-center__library" aria-label={fallbackText(t, "media.library", "Media library")} data-testid="panel-media-library">
            <div className="media-center__section">
              <div className="media-center__section-heading">
                <span>{fallbackText(t, "media.library", "LOCAL LIBRARY")}</span>
                <span className="media-center__count" data-testid="text-media-count">{availableTracks.length}/{tracks.length} {fallbackText(t, "media.items", "ITEMS")}</span>
              </div>
              {tracks.length === 0 ? (
                <div className="media-center__empty" data-testid="empty-media-library">
                  <strong>{fallbackText(t, "media.empty.title", "NO MEDIA ON THIS TERMINAL")}</strong>
                  {fallbackText(t, "media.empty.body", "Add audio or video files from this device to begin.")}
                </div>
              ) : (
                <div className="media-center__list" role="list" data-testid="list-media-tracks">
                  {tracks.map((track) => (
                    <div
                      key={track.id}
                      className={`media-center__track ${track.kind === "video" ? "media-center__track--video " : ""}${currentTrack?.id === track.id ? "media-center__track--selected" : ""}${!track.available ? " media-center__track--unavailable" : ""}`}
                      role="listitem"
                      tabIndex={0}
                      aria-disabled={!track.available}
                      onClick={() => { if (track.available) chooseTrack(track.id); }}
                      onKeyDown={(event) => { if (track.available && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); chooseTrack(track.id); } }}
                      data-testid={`row-media-track-${track.id}`}
                    >
                      <div className="media-center__track-icon" aria-hidden="true">{track.kind === "video" ? <Video size={14} /> : <FileAudio size={14} />}</div>
                      <div style={{ minWidth: 0 }}>
                        <span className="media-center__track-name" data-testid={`text-media-track-name-${track.id}`}>{track.name}</span>
                        <span className="media-center__track-meta"><span>{track.extension.toUpperCase()}</span><span>{formatSize(track.size)}</span><span>{formatTime(track.duration)}</span>{!track.available && <span className="media-center__track-status">{fallbackText(t, "media.unavailable", "RESELECT FILE")}</span>}</span>
                      </div>
                      <div className="media-center__track-actions" onClick={(event) => event.stopPropagation()}>
                        <button className="media-center__icon-button" disabled={!track.available} title={fallbackText(t, "media.play", "Play")} onClick={() => chooseTrack(track.id)} data-testid={`button-play-track-${track.id}`}><Play size={13} /></button>
                        <button className="media-center__icon-button" title={fallbackText(t, "media.remove", "Remove")} onClick={() => removeTrack(track.id)} data-testid={`button-remove-track-${track.id}`}><Trash2 size={13} color={accentColors.red} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="media-center__section">
              <div className="media-center__section-heading">
                <span><ListMusic size={12} style={{ verticalAlign: "middle", marginRight: 5 }} />{fallbackText(t, "media.playlists", "PLAYLISTS")}</span>
                <button className="media-center__icon-button" onClick={() => setIsCreatingPlaylist((value) => !value)} title={fallbackText(t, "media.playlist.new", "New playlist")} data-testid="button-new-playlist"><Plus size={14} /></button>
              </div>
              {isCreatingPlaylist && (
                <div className="media-center__inline-form" style={{ marginBottom: 7 }}>
                  <input className="media-center__text-input" autoFocus value={newPlaylistName} placeholder={fallbackText(t, "media.playlist.name", "Playlist name")} onChange={(event) => setNewPlaylistName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") handleCreatePlaylist(); if (event.key === "Escape") setIsCreatingPlaylist(false); }} data-testid="input-new-playlist-name" />
                  <button className="media-center__icon-button" onClick={handleCreatePlaylist} data-testid="button-create-playlist"><Plus size={14} color={accentColors.cyan} /></button>
                  <button className="media-center__icon-button" onClick={() => setIsCreatingPlaylist(false)} data-testid="button-cancel-playlist"><X size={14} /></button>
                </div>
              )}
              <div className="media-center__list" role="list" data-testid="list-playlists">
                <button className={`media-center__playlist ${selectedPlaylistId === null ? "media-center__playlist--selected" : ""}`} onClick={() => setSelectedPlaylist(null)} data-testid="button-playlist-all">
                  <AudioLines size={13} /><span className="media-center__playlist-name">{fallbackText(t, "media.playlist.all", "ALL MEDIA")}</span><span className="media-center__playlist-count">{availableTracks.length}</span>
                </button>
                {playlists.map((playlist) => (
                  <div key={playlist.id} className={`media-center__playlist ${selectedPlaylistId === playlist.id ? "media-center__playlist--selected" : ""}`} role="listitem" data-testid={`row-playlist-${playlist.id}`}>
                    {editingPlaylistId === playlist.id ? (
                      <input className="media-center__text-input" autoFocus value={editingPlaylistName} onChange={(event) => setEditingPlaylistName(event.target.value)} onBlur={() => finishPlaylistEdit(playlist.id)} onKeyDown={(event) => { if (event.key === "Enter") finishPlaylistEdit(playlist.id); if (event.key === "Escape") setEditingPlaylistId(null); }} data-testid={`input-rename-playlist-${playlist.id}`} />
                    ) : (
                      <button className="media-center__playlist" onClick={() => setSelectedPlaylist(playlist.id)} data-testid={`button-select-playlist-${playlist.id}`}><ListMusic size={13} /><span className="media-center__playlist-name">{playlist.name}</span><span className="media-center__playlist-count">{playlist.trackIds.length}</span></button>
                    )}
                    {editingPlaylistId !== playlist.id && <div className="media-center__playlist-actions">
                      <button className="media-center__icon-button" onClick={() => startPlaylistEdit(playlist)} title={fallbackText(t, "media.playlist.rename", "Rename")} data-testid={`button-rename-playlist-${playlist.id}`}><SlidersHorizontal size={11} /></button>
                      <button className="media-center__icon-button" onClick={() => deletePlaylist(playlist.id)} title={fallbackText(t, "media.playlist.delete", "Delete")} data-testid={`button-delete-playlist-${playlist.id}`}><Trash2 size={11} color={accentColors.red} /></button>
                    </div>}
                  </div>
                ))}
              </div>
              {selectedPlaylist && availableTracks.length > 0 && (
                <div style={{ marginTop: 10 }}>
                  <div className="media-center__section-heading"><span>{fallbackText(t, "media.playlist.members", "ADD TO THIS PLAYLIST")}</span></div>
                  {availableTracks.map((track) => (
                    <label key={track.id} style={{ alignItems: "center", display: "flex", gap: 7, padding: "4px 2px", cursor: "pointer" }} data-testid={`label-playlist-track-${track.id}`}>
                      <input type="checkbox" checked={selectedPlaylist.trackIds.includes(track.id)} onChange={() => togglePlaylistMembership(selectedPlaylist, track.id)} data-testid={`checkbox-playlist-track-${track.id}`} />
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{track.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </section>

          <aside className="media-center__side" aria-label={fallbackText(t, "media.controls", "Playback controls")} data-testid="panel-media-controls">
            <section className="media-center__player">
              <div className="media-center__screen" data-testid="media-preview">
                {currentTrack && currentFileUrl ? (
                  currentTrack.kind === "video"
                    ? <video key={currentTrack.id} ref={videoRef} src={currentFileUrl} {...mediaProps} controls={false} />
                    : <audio key={currentTrack.id} ref={audioRef} src={currentFileUrl} {...mediaProps} />
                ) : (
                  <div className="media-center__screen-empty"><MonitorPlay size={23} /><br />{fallbackText(t, "media.player.empty", "SELECT A FILE TO PLAY")}</div>
                )}
              </div>
              <div className="media-center__now-playing">
                <div className="media-center__now-playing-label">{fallbackText(t, "media.nowPlaying", "NOW PLAYING")}</div>
                <div className="media-center__now-playing-title" data-testid="text-current-track">{currentTrack?.name ?? fallbackText(t, "media.player.idle", "Terminal idle")}</div>
              </div>
              <div className="media-center__seek-row">
                <span className="media-center__time" data-testid="text-current-time">{formatTime(position)}</span>
                <input className="media-center__range" type="range" min={0} max={Math.max(duration, 0)} step=".01" value={Math.min(position, duration || 0)} onChange={handleSeek} disabled={!currentTrack || !duration} aria-label={fallbackText(t, "media.seek", "Seek")} data-testid="input-media-seek" />
                <span className="media-center__time" data-testid="text-duration">{formatTime(duration || currentTrack?.duration)}</span>
              </div>
              <div className="media-center__control-row">
                <div className="media-center__transport">
                  <button className="media-center__icon-button" onClick={() => playPrevious(queueIds)} disabled={currentQueueIndex < 0} title={fallbackText(t, "media.previous", "Previous")} data-testid="button-media-previous"><SkipBack size={15} /></button>
                  <button className="media-center__icon-button media-center__icon-button--primary" onClick={togglePlayback} disabled={!currentTrack || !currentFileUrl} title={isPlaying ? fallbackText(t, "media.pause", "Pause") : fallbackText(t, "media.play", "Play")} data-testid="button-media-play">
                    {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                  </button>
                  <button className="media-center__icon-button" onClick={() => playNext(queueIds)} disabled={currentQueueIndex < 0} title={fallbackText(t, "media.next", "Next")} data-testid="button-media-next"><SkipForward size={15} /></button>
                </div>
              </div>
              <div className="media-center__control-row" style={{ justifyContent: "space-between" }}>
                <button className={`media-center__switch ${preferences.shuffle ? "media-center__switch--on" : ""}`} onClick={() => updatePreferences({ shuffle: !preferences.shuffle })} data-testid="button-media-shuffle"><RefreshCw size={12} />{fallbackText(t, "media.shuffle", "SHUFFLE")}</button>
                <button className={`media-center__switch ${preferences.repeatMode !== "off" ? "media-center__switch--on" : ""}`} onClick={() => updatePreferences({ repeatMode: preferences.repeatMode === "off" ? "all" : preferences.repeatMode === "all" ? "one" : "off" })} data-testid="button-media-repeat"><Repeat size={12} />{preferences.repeatMode === "one" ? "1" : preferences.repeatMode === "all" ? "ALL" : "OFF"}</button>
              </div>
            </section>

            <section className="media-center__section">
              <div className="media-center__section-heading"><span><Gauge size={12} style={{ verticalAlign: "middle", marginRight: 5 }} />{fallbackText(t, "media.settings", "PLAYBACK SETTINGS")}</span></div>
              <div className="media-center__setting-row" style={{ marginBottom: 8 }}>
                <Volume2 size={13} /><span className="media-center__mini-label">{fallbackText(t, "media.volume", "VOL")}</span>
                <input className="media-center__range" type="range" min={0} max={1} step=".01" value={preferences.volume} onChange={(event) => updatePreferences({ volume: Number(event.target.value) })} aria-label={fallbackText(t, "media.volume", "Volume")} data-testid="input-media-volume" />
                <span className="media-center__time">{Math.round(preferences.volume * 100)}%</span>
              </div>
              <div className="media-center__setting-row" style={{ marginBottom: 8 }}>
                <span className="media-center__mini-label">{fallbackText(t, "media.rate", "RATE")}</span>
                <select className="media-center__compact-select" value={preferences.playbackRate} onChange={(event) => updatePreferences({ playbackRate: Number(event.target.value) })} aria-label={fallbackText(t, "media.rate", "Playback rate")} data-testid="select-media-rate">
                  {[.5, .75, 1, 1.25, 1.5, 2].map((rate) => <option key={rate} value={rate}>{rate.toFixed(2)}x</option>)}
                </select>
                <span className="media-center__mini-label" style={{ marginLeft: "auto" }}>{fallbackText(t, "media.balance", "BAL")}</span>
                <input className="media-center__range" type="range" min={-1} max={1} step=".01" value={preferences.balance} onChange={(event) => updatePreferences({ balance: Number(event.target.value) })} aria-label={fallbackText(t, "media.balance", "Balance")} data-testid="input-media-balance" />
              </div>
            </section>

            <section className="media-center__section">
              <div className="media-center__section-heading"><span><SlidersHorizontal size={12} style={{ verticalAlign: "middle", marginRight: 5 }} />{fallbackText(t, "media.equalizer", "EQUALIZER")}</span></div>
              <div className="media-center__setting-row" style={{ marginBottom: 10 }}>
                <span className="media-center__mini-label">{fallbackText(t, "media.preset", "PRESET")}</span>
                <select className="media-center__compact-select" value={preferences.equalizerPreset} onChange={(event) => { const preset = EQ_PRESETS.find((item) => item.value === event.target.value); updatePreferences({ equalizerPreset: event.target.value, equalizerBands: preset?.bands ?? preferences.equalizerBands }); }} data-testid="select-equalizer-preset">
                  {EQ_PRESETS.map((preset) => <option value={preset.value} key={preset.value}>{preset.label}</option>)}
                  {!EQ_PRESETS.some((preset) => preset.value === preferences.equalizerPreset) && <option value={preferences.equalizerPreset}>{preferences.equalizerPreset.toUpperCase()}</option>}
                </select>
              </div>
              <div className="media-center__eq" data-testid="panel-equalizer-bands">
                {(preferences.equalizerBands.length ? preferences.equalizerBands : [0, 0, 0, 0, 0]).slice(0, 5).map((band, index) => (
                  <label className="media-center__eq-band" key={EQ_FREQUENCIES[index]}>
                    <input type="range" min={-12} max={12} step={1} value={band} onChange={(event) => { const bands = [...preferences.equalizerBands]; bands[index] = Number(event.target.value); updatePreferences({ equalizerPreset: "custom", equalizerBands: bands }); }} aria-label={`${EQ_FREQUENCIES[index]} Hz`} data-testid={`input-equalizer-band-${index}`} />
                    <span>{EQ_FREQUENCIES[index]}</span>
                  </label>
                ))}
              </div>
            </section>

            <section className="media-center__section">
              <div className="media-center__section-heading"><span><FolderOpen size={12} style={{ verticalAlign: "middle", marginRight: 5 }} />{fallbackText(t, "media.folder", "LOCAL SOURCE")}</span></div>
              <div style={{ color: colorMix(accentColors.cyan, .8), lineHeight: 1.5, overflowWrap: "anywhere" }} data-testid="text-folder-status">{folderLabel}</div>
              <div className="media-center__button-row" style={{ marginTop: 8 }}>
                <button className="media-center__button" onClick={handleImportFolder} disabled={isImporting} data-testid="button-reselect-folder"><FolderOpen size={12} />{fallbackText(t, "media.folder.reselect", "RESELECT")}</button>
                <button className="media-center__button" onClick={() => rescanFolder()} disabled={isScanning || folderStatus.access !== "granted"} data-testid="button-rescan-folder"><RefreshCw size={12} />{isScanning ? fallbackText(t, "media.scanning", "SCANNING") : fallbackText(t, "media.rescan", "RESCAN")}</button>
              </div>
            </section>
          </aside>
        </div>
      )}

      <footer className="media-center__footer" data-testid="footer-media-center">
        <span className="media-center__status"><span className={`media-center__status-dot ${isImporting || isScanning ? "media-center__status-dot--amber" : ""}`} />{isImporting ? fallbackText(t, "media.importing", "IMPORTING") : isScanning ? fallbackText(t, "media.scanning", "SCANNING") : fallbackText(t, "media.ready", "READY")}</span>
        <span data-testid="text-media-source-status">{folderLabel}</span>
      </footer>
    </div>
  );
}

function colorMix(color: string, alpha: number) {
  return `color-mix(in srgb, ${color} ${Math.round(alpha * 100)}%, transparent)`;
}

export default MediaCenterApp;