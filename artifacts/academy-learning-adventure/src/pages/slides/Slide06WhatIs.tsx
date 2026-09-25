import { Panel, PanelLabel, SlideFrame } from "../../components/DeckPrimitives";

export default function Slide06WhatIs() {
  return (
    <SlideFrame no="15" eyebrow="SUPPORT / PRODUCT DEFINITION" title="What The Academy is">
      <div className="grid h-full grid-cols-2 gap-[1.6vw]">
        <Panel className="flex flex-col justify-between">
          <div><PanelLabel>ACADEMIC RPG</PanelLabel><div className="mt-[2vh] text-[2.5vw] font-bold text-[#79ff86]">Study is the progression system.</div></div>
          <div className="text-[1.8vw] leading-[1.45] text-[#86aa8b]">GED practice, XP, stats, and history share one playable state.</div>
        </Panel>
        <Panel className="flex flex-col justify-between">
          <div><PanelLabel color="cyan">RETRO DESKTOP</PanelLabel><div className="mt-[2vh] text-[2.5vw] font-bold text-[#82f2f6]">The interface is the setting.</div></div>
          <div className="text-[1.8vw] leading-[1.45] text-[#86aa8b]">Boot screen, windows, taskbar, and terminal language make the world legible.</div>
        </Panel>
        <Panel className="flex flex-col justify-between">
          <div><PanelLabel color="amber">NPC RELATIONSHIPS</PanelLabel><div className="mt-[2vh] text-[2.5vw] font-bold text-[#ffbd69]">Relationships shape dialogue.</div></div>
          <div className="text-[1.8vw] leading-[1.45] text-[#86aa8b]">NPC dialogue uses tone, emotion, relationship tiers, and dialogue history.</div>
        </Panel>
        <Panel className="flex flex-col justify-between">
          <div><PanelLabel>SHARED CODE</PanelLabel><div className="mt-[2vh] text-[2.5vw] font-bold text-[#79ff86]">Common rules, distinct saves.</div></div>
          <div className="text-[1.8vw] leading-[1.45] text-[#86aa8b]">Web, Android/Expo, API, and shared primitives align the surfaces.</div>
        </Panel>
      </div>
    </SlideFrame>
  );
}