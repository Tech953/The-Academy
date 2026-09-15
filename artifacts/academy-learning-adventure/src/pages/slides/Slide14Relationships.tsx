import { Panel, PanelLabel, ProgressBar, SlideFrame, Window } from "../../components/DeckPrimitives";

export default function Slide14Relationships() {
  return (
    <SlideFrame no="14" eyebrow="13 / RELATIONSHIPS" title="Campus relationships give progress a human surface">
      <div className="grid h-full grid-cols-[0.92fr_1.08fr] gap-[3vw]">
        <Panel>
          <PanelLabel color="amber">NPC RECORD / DR. VALE</PanelLabel>
          <div className="mt-[2vh] text-[3.2vw] font-bold text-[#d8ffda]">Faculty / Advisor</div>
          <div className="mt-[2.2vh] text-[1.8vw] text-[#86aa8b]">RELATIONSHIP SCORE</div>
          <div className="mt-[1vh] flex items-center gap-[1vw]"><div className="text-[4.5vw] font-bold text-[#ffbd69]">38</div><div className="text-[1.8vw] text-[#ffbd69]">WARMING</div></div>
          <div className="mt-[1.5vh]"><ProgressBar value="mid" tone="amber" /></div>
          <div className="mt-[3vh] border-t-[0.12vw] border-[#527659] pt-[2vh] text-[1.7vw] leading-[1.45] text-[#9cc7a0]">Tone shifts the score, emotion, tier, and next reply.</div>
        </Panel>
        <Window title="DIALOGUE / CAMPUS LIBRARY">
          <div className="space-y-[2vh]">
            <div className="max-w-[35vw] border-[0.12vw] border-[#527659] p-[1.2vw] text-[1.8vw] leading-[1.4] text-[#9cc7a0]">“You are still here. That counts for more than you think.”</div>
            <div className="ml-auto max-w-[30vw] border-[0.12vw] border-[#79ff86]/50 bg-[#79ff86]/10 p-[1.2vw] text-[1.8vw] leading-[1.4] text-[#d8ffda]">“I want to try one more set.”</div>
            <div className="pt-[1vh] text-[1.6vw] tracking-[0.12em] text-[#79ff86]">EMOTION / ENCOURAGING   TIER / ACQUAINTANCE</div>
          </div>
        </Window>
      </div>
    </SlideFrame>
  );
}