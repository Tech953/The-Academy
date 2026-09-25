import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSceneTimer } from '@/lib/video';
import './live-footage.css';

export type GameplayChapter = {
  title: string;
  beats: [string, string, string, string];
};

export const GAMEPLAY_CHAPTERS: GameplayChapter[] = [
  {
    title: 'Begin at Central Plaza',
    beats: [
      'A real session inside TheeAcademy.',
      'Start from the Central Plaza.',
      'The people and exits shown are in-game.',
      'All gameplay is captured live.',
    ],
  },
  {
    title: 'Find your bearings',
    beats: [
      'Use the live game’s commands.',
      'Look around. Check the list.',
      'Help is available in the terminal.',
      'Explore at your own pace.',
    ],
  },
  {
    title: 'Keep an eye on your student',
    beats: [
      'Status. Inventory. Time.',
      'Keep the student record in view.',
      'Check progress as you go.',
      'The interface remains untouched.',
    ],
  },
  {
    title: 'Meet the people nearby',
    beats: [
      'Staff appear where the game places them.',
      'Open a conversation from the terminal.',
      'Meet the characters present in this session.',
      'Choose a topic to continue.',
    ],
  },
  {
    title: 'Talk, then choose a topic',
    beats: [
      'Ask about studies or mysteries.',
      'Responses come from the live game.',
      'No dialogue card is substituted.',
      'A conversation can lead to another path.',
    ],
  },
  {
    title: 'A campus to move through',
    beats: [
      'Follow the exits the game presents.',
      'The view changes as you move.',
      'Return to a familiar place.',
      'Explore one step at a time.',
    ],
  },
  {
    title: 'Study what interests you',
    beats: [
      'Study recommendations at a glance.',
      'Review notes and notebook tools.',
      'Open the live progress view.',
      'The real app stays on screen.',
    ],
  },
  {
    title: 'One command at a time',
    beats: [
      'A desktop session inside TheeAcademy.',
      'Check status, commands, and notes.',
      'Explore the live game.',
      'Next, the mobile companion.',
    ],
  },
  {
    title: 'The desktop path continues',
    beats: [
      'The desktop chapter closes.',
      'The mobile chapter begins next.',
      'One title. Two live app views.',
      'No mockups stand in for gameplay.',
    ],
  },
  {
    title: 'Take the adventure mobile',
    beats: [
      'Portrait capture of the companion app.',
      'Adventure. Faculty. Study. Student File.',
      'The live app is framed for 16:9.',
      'Captured from the running Expo companion.',
    ],
  },
  {
    title: 'People and places on mobile',
    beats: [
      'Rescan nearby activity.',
      'Open Faculty and browse the live screen.',
      'Meet a character in the companion.',
      'The mobile UI remains untouched.',
    ],
  },
  {
    title: 'Study and review',
    beats: [
      'Choose a study subject.',
      'Answer from the app’s study view.',
      'Review the Student File.',
      'The interaction is screen-captured.',
    ],
  },
  {
    title: 'Check the Student File',
    beats: [
      'Return to the student record.',
      'Move back to Adventure.',
      'Follow another live mobile interaction.',
      'The app remains on screen.',
    ],
  },
  {
    title: 'Pick up the path again',
    beats: [
      'Repeat a study interaction.',
      'Visit Faculty again.',
      'A second live view of campus.',
      'The final mobile chapter follows.',
    ],
  },
  {
    title: 'TheeAcademy',
    beats: [
      'TheeAcademy.',
      'A campus to explore.',
      'People to meet. Ideas to study.',
      'TheeAcademy — gameplay captured live.',
    ],
  },
];

export function LiveFootageScene({
  chapter,
  chapterIndex,
}: {
  chapter: GameplayChapter;
  chapterIndex: number;
}) {
  const [beatIndex, setBeatIndex] = useState(0);
  const timerEvents = chapter.beats.slice(1).map((_, index) => ({
    time: (index + 1) * 14_000,
    callback: () => setBeatIndex(index + 1),
  }));
  useSceneTimer(timerEvents);

  const source = chapterIndex < 9 ? 'DESKTOP APP' : 'MOBILE COMPANION';

  return (
    <motion.section
      className={`live-footage-overlay${chapterIndex >= 9 ? ' live-footage-overlay--mobile' : ''}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      aria-label={`Chapter ${chapterIndex + 1}: ${chapter.title}`}
    >
      <header className="live-footage-topbar">
        <div className="live-footage-brand">THEEACADEMY</div>
        <div className="live-footage-source">
          <span className="live-footage-dot" aria-hidden="true" />
          LIVE CAPTURE <span className="live-footage-source-divider">/</span> {source}
        </div>
      </header>

      <div className="live-footage-caption">
        <div className="live-footage-chapter-number">
          {String(chapterIndex + 1).padStart(2, '0')}
          <span> / 15</span>
        </div>
        <h1>{chapter.title}</h1>
        <AnimatePresence mode="wait">
          <motion.p
            key={beatIndex}
            initial={{ opacity: 0, y: 7 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
          >
            {chapter.beats[beatIndex]}
          </motion.p>
        </AnimatePresence>
      </div>

      <div className="live-footage-progress" aria-hidden="true">
        <div
          className="live-footage-progress-fill"
          style={{ width: `${((chapterIndex + 1) / GAMEPLAY_CHAPTERS.length) * 100}%` }}
        />
      </div>
    </motion.section>
  );
}