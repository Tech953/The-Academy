import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  VideoCanvas,
  type VideoAspectRatio,
  VideoPausedContext,
  useVideoPlayer,
} from '@/lib/video';
import { Scene01Archive } from './scenes/Scene01Archive';
import { Scene02Student } from './scenes/Scene02Student';
import { Scene03Alignment } from './scenes/Scene03Alignment';
import { Scene04Campus } from './scenes/Scene04Campus';
import { Scene05Commands } from './scenes/Scene05Commands';
import { Scene06People } from './scenes/Scene06People';
import { Scene07Confluence } from './scenes/Scene07Confluence';
import { Scene08Courses } from './scenes/Scene08Courses';
import { Scene09Practice } from './scenes/Scene09Practice';
import { Scene10Mastery } from './scenes/Scene10Mastery';
import { Scene11Notebook } from './scenes/Scene11Notebook';
import { Scene12Radiant } from './scenes/Scene12Radiant';
import { Scene13Character } from './scenes/Scene13Character';
import { Scene14Mobile } from './scenes/Scene14Mobile';
import { Scene15Finale } from './scenes/Scene15Finale';

export const SCENE_DURATIONS: Record<string, number> = {
  archive: 20_000,
  student: 20_000,
  alignment: 20_000,
  campus: 20_000,
  commands: 20_000,
  people: 20_000,
  confluence: 20_000,
  courses: 20_000,
  practice: 20_000,
  mastery: 20_000,
  notebook: 20_000,
  radiant: 20_000,
  character: 20_000,
  mobile: 20_000,
  finale: 20_000,
};

const VIDEO_ASPECT_RATIO: VideoAspectRatio = '16:9';
const SCENE_COMPONENTS = [
  Scene01Archive,
  Scene02Student,
  Scene03Alignment,
  Scene04Campus,
  Scene05Commands,
  Scene06People,
  Scene07Confluence,
  Scene08Courses,
  Scene09Practice,
  Scene10Mastery,
  Scene11Notebook,
  Scene12Radiant,
  Scene13Character,
  Scene14Mobile,
  Scene15Finale,
];

const SCENE_START_SEC = (() => {
  const starts: Record<string, number> = {};
  let elapsed = 0;
  for (const [key, duration] of Object.entries(SCENE_DURATIONS)) {
    starts[key] = elapsed / 1000;
    elapsed += duration;
  }
  return starts;
})();

const AUDIO_SEEK_EPSILON_SEC = 0.18;

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
  const lastSceneKeyRef = useRef<string | null>(null);
  const baseSceneKey = currentSceneKey.replace(/_r[12]$/, '');
  const sceneIndex = Object.keys(SCENE_DURATIONS).indexOf(baseSceneKey);
  const SceneComponent = SCENE_COMPONENTS[sceneIndex];

  useEffect(() => {
    onSceneChange?.(currentSceneKey);
  }, [currentSceneKey, onSceneChange]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0.75;
    if (paused) {
      audio.pause();
      return;
    }
    if (lastSceneKeyRef.current !== currentSceneKey) {
      lastSceneKeyRef.current = currentSceneKey;
      const targetTime = SCENE_START_SEC[baseSceneKey] ?? 0;
      if (Math.abs(audio.currentTime - targetTime) > AUDIO_SEEK_EPSILON_SEC) {
        audio.currentTime = targetTime;
      }
    }
    audio.play().catch(() => {});
  }, [currentSceneKey, baseSceneKey, muted, paused]);

  return (
    <VideoPausedContext.Provider value={paused}>
      <VideoCanvas aspectRatio={VIDEO_ASPECT_RATIO} style={{ backgroundColor: 'var(--color-bg-light)' }}>
        <motion.div className="academy-global-cursor" initial={false} animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} aria-hidden="true" />
        <div className="academy-frame-line" aria-hidden="true" />
        <AnimatePresence mode="sync">
      {SceneComponent ? <SceneComponent key={currentSceneKey} /> : null}
        </AnimatePresence>
        <audio
          ref={audioRef}
          src={`${import.meta.env.BASE_URL}audio/bg_music.mp3`}
          preload="auto"
          autoPlay
          muted={muted}
          style={{ display: 'none' }}
        />
      </VideoCanvas>
    </VideoPausedContext.Provider>
  );
}
