import { useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  VideoCanvas,
  type VideoAspectRatio,
  VideoPausedContext,
  useVideoPlayer,
} from '@/lib/video';
import { GAMEPLAY_CHAPTERS, LiveFootageScene } from './LiveFootageScene';

export const SCENE_DURATIONS: Record<string, number> = {
  archive: 60_000,
  student: 60_000,
  alignment: 60_000,
  campus: 60_000,
  commands: 60_000,
  people: 60_000,
  confluence: 60_000,
  courses: 60_000,
  practice: 60_000,
  mastery: 60_000,
  notebook: 60_000,
  radiant: 60_000,
  character: 60_000,
  mobile: 60_000,
  finale: 60_000,
};

const VIDEO_ASPECT_RATIO: VideoAspectRatio = '16:9';

const SCENE_START_SEC = (() => {
  const starts: Record<string, number> = {};
  let elapsed = 0;
  for (const [key, duration] of Object.entries(SCENE_DURATIONS)) {
    starts[key] = elapsed / 1000;
    elapsed += duration;
  }
  return starts;
})();

const MEDIA_SEEK_EPSILON_SEC = 0.18;

export default function VideoTemplate({
  durations = SCENE_DURATIONS,
  loop = true,
  paused = false,
  muted = false,
  onSceneChange,
}: {
  durations?: Record<string, number>;
  loop?: boolean;
  paused?: boolean;
  muted?: boolean;
  onSceneChange?: (sceneKey: string) => void;
} = {}) {
  const { currentSceneKey } = useVideoPlayer({ durations, loop, paused });
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const footageRef = useRef<HTMLVideoElement | null>(null);
  const lastSceneKeyRef = useRef<string | null>(null);
  const lastFootageSceneKeyRef = useRef<string | null>(null);
  const baseSceneKey = currentSceneKey.replace(/_r[12]$/, '');
  const sceneIndex = Object.keys(SCENE_DURATIONS).indexOf(baseSceneKey);
  const chapter = GAMEPLAY_CHAPTERS[sceneIndex];

  useEffect(() => {
    onSceneChange?.(currentSceneKey);
  }, [currentSceneKey, onSceneChange]);

  useEffect(() => {
    const footage = footageRef.current;
    if (!footage) return;

    const syncFootage = () => {
      if (lastFootageSceneKeyRef.current !== currentSceneKey) {
        lastFootageSceneKeyRef.current = currentSceneKey;
        const targetTime = SCENE_START_SEC[baseSceneKey] ?? 0;
        if (Math.abs(footage.currentTime - targetTime) > MEDIA_SEEK_EPSILON_SEC) {
          footage.currentTime = targetTime;
        }
      }

      if (paused) {
        footage.pause();
        return;
      }
      footage.play().catch(() => {});
    };

    if (footage.readyState >= 1) {
      syncFootage();
      return;
    }

    footage.addEventListener('loadedmetadata', syncFootage, { once: true });
    return () => footage.removeEventListener('loadedmetadata', syncFootage);
  }, [currentSceneKey, baseSceneKey, paused]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0.5;
    if (paused) {
      audio.pause();
      return;
    }
    if (lastSceneKeyRef.current !== currentSceneKey) {
      lastSceneKeyRef.current = currentSceneKey;
      const targetTime = SCENE_START_SEC[baseSceneKey] ?? 0;
      if (Math.abs(audio.currentTime - targetTime) > MEDIA_SEEK_EPSILON_SEC) {
        audio.currentTime = targetTime;
      }
    }
    audio.play().catch(() => {});
  }, [currentSceneKey, baseSceneKey, muted, paused]);

  return (
    <VideoPausedContext.Provider value={paused}>
      <VideoCanvas aspectRatio={VIDEO_ASPECT_RATIO} style={{ backgroundColor: '#030604' }}>
        <video
          ref={footageRef}
          className="live-gameplay-footage"
          src={`${import.meta.env.BASE_URL}gameplay/live-gameplay-15min.mp4`}
          poster={`${import.meta.env.BASE_URL}gameplay/live-gameplay-poster.jpg`}
          preload="auto"
          autoPlay
          muted
          playsInline
          aria-hidden="true"
        />
        <AnimatePresence mode="sync">
          {chapter ? (
            <LiveFootageScene
              key={currentSceneKey}
              chapter={chapter}
              chapterIndex={sceneIndex}
            />
          ) : null}
        </AnimatePresence>
        <audio
          ref={audioRef}
          src={`${import.meta.env.BASE_URL}audio/bg_music_15min.mp3`}
          preload="auto"
          autoPlay
          muted={muted}
          style={{ display: 'none' }}
        />
      </VideoCanvas>
    </VideoPausedContext.Provider>
  );
}
