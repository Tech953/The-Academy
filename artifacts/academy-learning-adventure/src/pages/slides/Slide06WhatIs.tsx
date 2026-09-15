import { Panel, PanelLabel, SlideFrame } from "../../components/DeckPrimitives";

export default function Slide06WhatIs() {
  return (
    <SlideFrame no="06" eyebrow="05 / PRODUCT" title="What The Academy is">
      <div className="grid h-full grid-cols-2 gap-[1.6vw]">
        <Panel className="flex flex-col justify-between">
          <div><PanelLabel>ACADEMIC RPG</PanelLabel><div className="mt-[2vh] text-[2.5vw] font-bold text-[#79ff86]">Study is the progression system.</div></div>
          <div className="text-[1.8vw] leading-[1.45] text-[#86aa8b]">GED questions, assignments, XP, stats, and history are part of one playable state.</div>
        </Panel>
        <Panel className="flex flex-col justify-between">
          <div><PanelLabel color="cyan">RETRO DESKTOP</PanelLabel><div className="mt-[2vh] text-[2.5vw] font-bold text-[#82f2f6]">The interface is the setting.</div></div>
          <div className="text-[1.8vw] leading-[1.45] text-[#86aa8b]">Boot screen, draggable windows, taskbar, terminal language, and institutional UI make the world legible.</div>
        </Panel>
        <Panel className="flex flex-col justify-between">
          <div><PanelLabel color="amber">SOCIAL CONTINUITY</PanelLabel><div className="mt-[2vh] text-[2.5vw] font-bold text-[#ffbd69]">People remember the learner.</div></div>
          <div className="text-[1.8vw] leading-[1.45] text-[#86aa8b]">NPC dialogue has tone, emotion, relationship tiers, and a history that can shift warmer or cooler.</div>
        </Panel>
        <Panel className="flex flex-col justify-between">
          <div><PanelLabel>EVERYWHERE</PanelLabel><div className="mt-[2vh] text-[2.5vw] font-bold text-[#79ff86]">The engine travels.</div></div>
          <div className="text-[1.8vw] leading-[1.45] text-[#86aa8b]">Web, Android/Expo, API, and shared game primitives keep the experience coherent across surfaces.</div>
        </Panel>
      </div>
    </SlideFrame>
  );
}