import { useState } from 'react';
import { motion } from 'framer-motion';
import { useSceneTimer } from '@/lib/video';
import type { AcademySceneData, SceneMode } from './sceneData';
import './academy-scene.css';

const BEAT_TIMES = [650, 1450, 2800, 4550, 6350, 8150, 9950, 11750, 13550, 15350, 17250, 18600];
const CURVE = [0.18, 0.9, 0.24, 1] as const;

function SceneArtwork({
  mode,
  scene,
  beat,
}: {
  mode: SceneMode;
  scene: AcademySceneData;
  beat: number;
}) {
  const active = Math.min(beat, Math.max(0, scene.records.length - 1));

  if (mode === 'boot') {
    return (
      <div className="boot-image-wrap">
        <motion.img
          className="boot-image"
          src={`${import.meta.env.BASE_URL}images/academy-boot.jpg`}
          alt="The Academy's green-on-black archive boot screen"
          initial={{ scale: 1.08, filter: 'brightness(.45)' }}
          animate={{ scale: 1, filter: 'brightness(.83)' }}
          transition={{ duration: 2.4, ease: CURVE }}
        />
        <div className="boot-scan" />
        <motion.div className="boot-focus-frame" animate={{ scale: [0.94, 1.025, 1] }} transition={{ duration: 5, repeat: Infinity }} />
      </div>
    );
  }

  if (mode === 'creator') {
    return (
      <div className="creator-board">
        <div className="creator-fields">
          {scene.records.map((label, index) => (
            <motion.div
              className={`creator-field ${active === index ? 'is-active' : ''}`}
              key={label}
              animate={{ x: active === index ? 12 : 0, opacity: active === index ? 1 : 0.66 }}
              transition={{ duration: 0.3 }}
            >
              <span>{label}</span><b>{index === 0 ? 'AVERY' : index === 1 ? 'HUMAN' : index === 4 ? 'CURIOUS' : '— SELECT —'}</b>
              <i className="field-cursor" />
            </motion.div>
          ))}
        </div>
        <div className="student-sigil" aria-hidden="true">
          <motion.div className="sigil-orbit orbit-a" animate={{ rotate: 360 }} transition={{ duration: 22, repeat: Infinity, ease: 'linear' }} />
          <motion.div className="sigil-orbit orbit-b" animate={{ rotate: -360 }} transition={{ duration: 30, repeat: Infinity, ease: 'linear' }} />
          <motion.div className="sigil-person"><span>A</span></motion.div>
          <div className="sigil-caption">STUDENT FILE<br />NO. 0144</div>
        </div>
      </div>
    );
  }

  if (mode === 'factions') {
    const factionPoints = [
      [50, 7], [89, 36], [75, 88], [25, 88], [11, 36],
    ];
    return (
      <div className="faction-instrument">
        <svg viewBox="0 0 600 420" className="faction-web" aria-hidden="true">
          <motion.polygon points="300,28 534,170 446,365 154,365 66,170" fill="none" stroke="var(--color-primary)" strokeWidth="1.5" strokeDasharray="8 8" animate={{ strokeDashoffset: [0, -32] }} transition={{ duration: 8, repeat: Infinity, ease: 'linear' }} />
          <motion.circle cx="300" cy="210" r="146" fill="none" stroke="var(--color-accent)" strokeWidth="1.5" strokeDasharray="2 9" animate={{ rotate: [0, 360] }} style={{ transformOrigin: '300px 210px' }} transition={{ duration: 35, repeat: Infinity, ease: 'linear' }} />
        </svg>
        {scene.records.map((name, index) => (
          <motion.div key={name} className="faction-node" style={{ left: `${factionPoints[index][0]}%`, top: `${factionPoints[index][1]}%` }} animate={{ scale: active === index ? 1.14 : 1, opacity: active === index ? 1 : 0.52 }} transition={{ duration: 0.35 }}>
            <span className="node-glyph">{['⌑', '↗', '◇', '◉', '✳'][index]}</span><b>{name}</b>
          </motion.div>
        ))}
        <div className="stat-core">
          <motion.div className="stat-core-ring" animate={{ rotate: 360 }} transition={{ duration: 28, repeat: Infinity, ease: 'linear' }} />
          <span>STUDENT<br />BUILD</span>
        </div>
        <div className="stat-triptych"><b>PHYSICAL</b><i /><b>MENTAL</b><i /><b>SPIRITUAL</b></div>
      </div>
    );
  }

  if (mode === 'directory') {
    return (
      <div className="directory-board">
        <div className="directory-stamp"><span>THE ACADEMY</span><b>DESTINATIONS</b><i>12 LOCATIONS</i></div>
        <div className="directory-list">
          {scene.records.map((record, index) => (
            <motion.div className={`directory-row ${record.includes('LOCKED') ? 'is-locked' : ''}`} key={record} animate={{ x: active === index ? -8 : 0, opacity: active === index ? 1 : 0.63 }} transition={{ duration: 0.35 }}>
              <span className="directory-index">{String(index + 1).padStart(2, '0')}</span><b>{record}</b><i>{record.includes('LOCKED') ? 'LOCKED' : 'OPEN'}</i>
            </motion.div>
          ))}
        </div>
        <motion.div className="directory-route" animate={{ scaleX: [0.5, 1, 0.72], x: [-8, 12, 0] }} transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }} />
      </div>
    );
  }

  if (mode === 'terminal') {
    const command = scene.records[active % scene.records.length];
    return (
      <div className="terminal-world">
        <div className="terminal-ghost" aria-hidden="true">A</div>
        <div className="terminal-window">
          <div className="terminal-window-head"><span>ACADEMY OS</span><i>COMMAND INTERFACE</i><b>●</b></div>
          <div className="terminal-lines">
            <div className="terminal-dim">STUDENT SESSION  /  CAMPUS NETWORK</div>
            <motion.div key={command} className="terminal-command"><em>&gt;</em> {command}<i className="terminal-caret" /></motion.div>
            <motion.div className="terminal-output" key={`output-${active}`} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
              <span>[OK]</span> {command === 'GO NORTH' ? 'DIRECTION ACCEPTED' : command === 'STATUS' ? 'STUDENT RECORD LOADED' : command === 'EXAMINE LIBRARY' ? 'LOCATION DETAILS FOUND' : command === 'HELP' ? 'COMMANDS READY' : 'CAMPUS DETAILS LOADED'}
            </motion.div>
            <div className="terminal-rule" /><span className="terminal-aside">TYPE A COMMAND TO CONTINUE</span>
          </div>
        </div>
        <div className="command-ribbon">{scene.records.map((row, index) => <span className={active === index ? 'is-active' : ''} key={row}>{row}</span>)}</div>
      </div>
    );
  }

  if (mode === 'dialogue') {
    return (
      <div className="dialogue-stage">
        <div className="conversation-card">
          <div className="conversation-person"><span className="portrait-glyph">E</span><div><b>EMILY</b><small>ACADEMY STAFF</small></div><i>ONLINE</i></div>
          <div className="conversation-log"><p className="player-line">&gt; TALK TO EMILY</p><motion.p key={active} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35 }}>{active === 1 ? '“Good to meet you.”' : active === 2 ? '“Different factions often have complex relationships.”' : 'A conversation can change how campus sees you.'}</motion.p></div>
          <div className="conversation-prompt">ASK ABOUT THE ACADEMY <span>▸</span></div>
        </div>
        <div className="reputation-rails">{scene.records.map((name, index) => <div className="reputation-row" key={name}><span>{name}</span><div><motion.i animate={{ width: `${[48, 67, 35, 54][index]}%` }} transition={{ duration: 1.2, ease: CURVE }} /></div><b>{index === active ? '+1' : '—'}</b></div>)}</div>
      </div>
    );
  }

  if (mode === 'confluence') {
    return (
      <div className="confluence-stage">
        <div className="argument-column claim"><span>01 // RECORD</span><b>A CLAIM.</b><i>STATEMENT<br />ON FILE.</i></div>
        <div className="contradiction-map" aria-hidden="true">
          <svg viewBox="0 0 600 440">
            <motion.path d="M40 70 C180 70 190 220 300 220 S430 365 560 365" fill="none" stroke="var(--color-primary)" strokeWidth="3" strokeDasharray="10 10" animate={{ strokeDashoffset: [0, -40] }} transition={{ duration: 6, repeat: Infinity, ease: 'linear' }} />
            <motion.path d="M40 365 C180 365 190 220 300 220 S430 70 560 70" fill="none" stroke="var(--color-warning)" strokeWidth="3" strokeDasharray="10 10" animate={{ strokeDashoffset: [0, 40] }} transition={{ duration: 7, repeat: Infinity, ease: 'linear' }} />
            {[['40','70'],['40','365'],['300','220'],['560','70'],['560','365']].map(([cx, cy], index) => <motion.circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={index === 2 ? 12 : 8} fill={index === 2 ? 'var(--color-warning)' : 'var(--color-primary)'} animate={{ scale: index === active % 5 ? [1, 1.5, 1] : 1 }} transition={{ duration: 0.8 }} />)}
          </svg>
        </div>
        <div className="argument-column counterpoint"><span>02 // EVIDENCE</span><b>A COUNTERPOINT.</b><i>CONFLICTING<br />ACCOUNT.</i></div>
        <motion.div className="confluence-seal" animate={{ rotate: [0, 90, 180, 270, 360] }} transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}>CONFLUENCE</motion.div>
      </div>
    );
  }

  if (mode === 'catalog') {
    return (
      <div className="course-catalog">
        <div className="catalog-spine"><span>GED</span><b>COURSE<br />CATALOG</b><i>ACADEMIC HALL</i></div>
        <div className="course-grid">{scene.records.map((record, index) => <motion.div className={`course-card course-${index}`} key={record} animate={{ y: active === index ? -12 : 0, scale: active === index ? 1.03 : 1, borderColor: active === index ? 'var(--color-primary)' : 'rgba(68,255,118,.28)' }} transition={{ duration: 0.35 }}><span>0{index + 1}</span><b>{record}</b><i>{active === index ? 'SELECTED' : 'COURSE AREA'}</i></motion.div>)}</div>
        <motion.div className="enrollment-slip" animate={{ rotate: beat >= 4 ? -2 : 1, x: beat >= 4 ? 0 : 18 }} transition={{ duration: 0.4 }}><span>&gt; ENROLL</span><b>✓ ADDED TO YOUR STUDENT FILE</b></motion.div>
      </div>
    );
  }

  if (mode === 'practice') {
    return (
      <div className="practice-stage">
        <div className="practice-equation"><span>x</span><b>+</b><span>7</span><b>=</b><span>12</span><i>WHICH OPERATION ISOLATES X?</i></div>
        <div className="answer-stack">{scene.records.slice(1).map((answer, index) => <motion.div key={answer} className={`answer-tile answer-${index} ${active === index + 1 ? 'is-selected' : ''}`} animate={{ x: active === index + 1 ? 20 : 0, scale: active === index + 1 ? 1.03 : 1 }} transition={{ duration: 0.3 }}><span>0{index + 1}</span><b>{answer}</b>{active === index + 1 && <i>✓</i>}</motion.div>)}</div>
        <motion.div className="reasoning-ring" animate={{ rotate: 360 }} transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}><span>CHECK<br />YOUR<br />REASONING</span></motion.div>
      </div>
    );
  }

  if (mode === 'progress') {
    return (
      <div className="progress-panoramic">
        <div className="progress-status"><span>STUDENT FILE / GED TRACK</span><b>{beat >= 6 ? 'GED READY' : beat >= 2 ? 'IN PROGRESS' : 'ENROLLED'}</b></div>
        {scene.records.map((name, index) => <div className="progress-domain" key={name}><span>{name}</span><div className="progress-track"><motion.i animate={{ width: `${Math.min(96, 16 + ((index * 17 + active * 11) % 78))}%` }} transition={{ duration: 1.2, ease: CURVE }} /></div><b>0{index + 1}</b></div>)}
        <motion.div className="ged-ready-seal" animate={{ scale: beat >= 6 ? [0.92, 1.08, 1] : 0.92, opacity: beat >= 6 ? 1 : 0.72 }} transition={{ duration: 0.9 }}>GED<br />READY</motion.div>
      </div>
    );
  }

  if (mode === 'notebook') {
    return (
      <div className="notebook-spread">
        <div className="notebook-page page-left"><span className="page-number">FIELD NOTES / 01</span><h3>OBSERVATION</h3><i /><i /><i /><div className="notebook-note-tag">GED</div></div>
        <div className="notebook-binding" />
        <div className="notebook-page page-right"><span className="page-number">RESEARCH INDEX / 02</span><h3>CONNECTIONS</h3>{scene.records.map((record, index) => <motion.div className={`notebook-tab tab-${index} ${active === index ? 'is-active' : ''}`} key={record} animate={{ x: active === index ? 12 : 0 }} transition={{ duration: 0.3 }}>{record}<b>↗</b></motion.div>)}<div className="bookmark-ribbon">BOOKMARK</div></div>
      </div>
    );
  }

  if (mode === 'radiant') {
    return (
      <div className="radiant-dialogue-stage">
        <div className="context-orbit">{scene.records.map((record, index) => <motion.div className={`context-chip chip-${index} ${active === index + 1 ? 'is-active' : ''}`} key={record} animate={{ scale: active === index + 1 ? 1.08 : 1, opacity: active === index + 1 ? 1 : 0.68 }} transition={{ duration: 0.3 }}><i>{['⌘', '↻', '◉'][index]}</i>{record}</motion.div>)}</div>
        <div className="radiant-chat"><div className="radiant-identity"><span>R</span><b>RADIANT AI</b><i>CONTEXTUAL DIALOGUE</i></div><motion.p key={beat} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>{beat >= 5 ? 'There may be more here than books.' : 'You asked about the library.'}</motion.p><div className="radiant-status"><span className={beat >= 6 ? 'local' : ''} /><b>{beat >= 6 ? 'LOCAL' : 'LIVE'}</b><i>WHEN AVAILABLE</i></div></div>
      </div>
    );
  }

  if (mode === 'character') {
    return (
      <div className="character-sheet-stage">
        <div className="stat-columns">{['PHYSICAL', 'MENTAL', 'SPIRITUAL'].map((label, column) => <div className="stat-column" key={label}><span>0{column + 1} / ATTRIBUTE</span><b>{label}</b><div className="stat-meter"><motion.i animate={{ width: `${48 + ((active + column * 2) % 5) * 9}%` }} transition={{ duration: 0.8 }} /></div><small>STUDENT RECORD</small></div>)}</div>
        <div className="sheet-footer"><span>ENERGY <i><b /></i></span><span>PERKS <b className="perk-pip">✳</b><b className="perk-pip">◇</b><b className="perk-pip">✦</b></span></div>
        <div className="character-reputation">{scene.records.slice(3).map((label, index) => <motion.span key={label} animate={{ opacity: active === index + 3 ? 1 : 0.52, y: active === index + 3 ? -5 : 0 }}><i />{label}</motion.span>)}</div>
      </div>
    );
  }

  if (mode === 'mobile') {
    return (
      <div className="mobile-stage">
        <div className="mobile-copy"><span>THE ACADEMY</span><b>MOBILE<br />COMPANION</b><i>STUDY. TRAVEL. TALK.</i></div>
        <div className="phone-device"><div className="phone-camera" /><div className="phone-screen"><div className="phone-topline">THE ACADEMY <span>•••</span></div><div className="phone-glyph">A</div><motion.div className="phone-feature" key={active} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}><span>{scene.records[active % scene.records.length]}</span><b>{active % 4 === 0 ? 'STUDY SESSION' : active % 4 === 1 ? 'CAMPUS TRAVEL' : active % 4 === 2 ? 'NPC DIALOGUE' : 'OFFLINE-FIRST'}</b><i>CONTINUE YOUR PATH</i></motion.div><div className="phone-tabs"><span>STUDY</span><span>WORLD</span><span>FILE</span></div></div></div>
        <div className="offline-stamp"><i /><b>OFFLINE-FIRST</b><span>CORE PATHS AVAILABLE</span></div>
      </div>
    );
  }

  if (mode === 'finale') {
    return (
      <div className="finale-seal" aria-hidden="true">
        <motion.div className="finale-orbit orbit-one" animate={{ rotate: 360 }} transition={{ duration: 36, repeat: Infinity, ease: 'linear' }} />
        <motion.div className="finale-orbit orbit-two" animate={{ rotate: -360 }} transition={{ duration: 44, repeat: Infinity, ease: 'linear' }} />
        <div className="finale-core">A</div>
        <div className="finale-words"><span>PLAY</span><span>LEARN</span><span>BELONG</span></div>
      </div>
    );
  }

  return null;
}

export default function AcademyScene({ scene, index }: { scene: AcademySceneData; index: number }) {
  const [beat, setBeat] = useState(0);
  useSceneTimer(BEAT_TIMES.map((time, nextBeat) => ({
    time,
    callback: () => setBeat(nextBeat + 1),
  })));

  const transition = index % 5;
  const initial =
    transition === 0
      ? { opacity: 0, clipPath: 'circle(0% at 12% 88%)', scale: 1.12 }
      : transition === 1
        ? { opacity: 0, clipPath: 'inset(0 50% 0 50%)', rotateY: -12 }
        : transition === 2
          ? { opacity: 0, clipPath: 'polygon(0 0, 0 0, 0 100%, 0 100%)', scale: 1.05 }
          : transition === 3
            ? { opacity: 0, clipPath: 'inset(50% 0 50% 0)', y: 18 }
            : { opacity: 0, rotateY: 10, scale: 0.95 };
  const enter =
    transition === 0
      ? { opacity: 1, clipPath: 'circle(145% at 12% 88%)', scale: 1 }
      : transition === 1
        ? { opacity: 1, clipPath: 'inset(0 0% 0 0%)', rotateY: 0 }
        : transition === 2
          ? { opacity: 1, clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)', scale: 1 }
          : transition === 3
            ? { opacity: 1, clipPath: 'inset(0% 0 0% 0)', y: 0 }
            : { opacity: 1, rotateY: 0, scale: 1 };

  return (
    <motion.section
      className={`academy-shot shot-${scene.mode} accent-${scene.accent ?? 'green'}`}
      aria-label={`${scene.title}: ${scene.headline}`}
      initial={initial}
      animate={enter}
      exit={{ opacity: 0, scale: transition === 4 ? 1.14 : 1.07, filter: 'blur(7px)', x: transition === 1 ? '-2%' : 0 }}
      transition={{ duration: transition === 4 ? 0.74 : 0.62, ease: CURVE }}
    >
      <div className="shot-atmosphere" aria-hidden="true"><motion.i animate={{ x: ['-8%', '8%', '-8%'], opacity: [0.18, 0.42, 0.18] }} transition={{ duration: 9 + (index % 4), repeat: Infinity, ease: 'easeInOut' }} /></div>
      <div className="shot-corner shot-corner-top"><span>THE ACADEMY</span><b>FIELD RECORD // {String(index + 1).padStart(2, '0')}</b></div>
      <SceneArtwork mode={scene.mode} scene={scene} beat={beat} />
      <div className={`shot-copy copy-${scene.mode}`}>
        <p className="shot-eyebrow">{scene.eyebrow}</p>
        <motion.h1
          key={scene.key}
          initial={{ opacity: 0, y: 22, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.66, delay: 0.12, ease: CURVE }}
        >
          {scene.headline}
        </motion.h1>
        <motion.p className="shot-beat" key={`${scene.key}-${beat}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.34, ease: CURVE }}>
          {scene.beats[Math.min(beat, scene.beats.length - 1)]}
        </motion.p>
      </div>
      <div className="shot-corner shot-corner-bottom"><span>EDUCATION // ADVENTURE // PROGRESS</span><b>{String(beat + 1).padStart(2, '0')} / 13</b></div>
    </motion.section>
  );
}