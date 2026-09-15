import { PanelLabel, SlideFrame } from "../../components/DeckPrimitives";

export default function Slide24Differentiation() {
  return (
    <SlideFrame no="24" eyebrow="23 / DIFFERENTIATION" title="The Academy combines systems that are usually separated">
      <div className="overflow-hidden border-[0.12vw] border-[#527659]">
        <div className="grid grid-cols-[1.3fr_1fr_1fr] border-b-[0.12vw] border-[#527659] bg-[#0d2312] p-[1.2vw] text-[1.6vw] tracking-[0.12em]"><PanelLabel>CAPABILITY</PanelLabel><PanelLabel>STUDY TOOL</PanelLabel><PanelLabel color="amber">THE ACADEMY</PanelLabel></div>
        <div className="grid grid-cols-[1.3fr_1fr_1fr] border-b-[0.12vw] border-[#527659] p-[1.2vw] text-[1.8vw]"><span>Practice questions</span><span className="text-[#86aa8b]">Standalone</span><span className="text-[#79ff86]">Inside a persistent world</span></div>
        <div className="grid grid-cols-[1.3fr_1fr_1fr] border-b-[0.12vw] border-[#527659] p-[1.2vw] text-[1.8vw]"><span>Progress history</span><span className="text-[#86aa8b]">Separate dashboard</span><span className="text-[#79ff86]">XP, stats, and day state</span></div>
        <div className="grid grid-cols-[1.3fr_1fr_1fr] border-b-[0.12vw] border-[#527659] p-[1.2vw] text-[1.8vw]"><span>Motivation</span><span className="text-[#86aa8b]">External reminder</span><span className="text-[#79ff86]">Campus, NPCs, and next move</span></div>
        <div className="grid grid-cols-[1.3fr_1fr_1fr] p-[1.2vw] text-[1.8vw]"><span>Access</span><span className="text-[#86aa8b]">Network assumed</span><span className="text-[#79ff86]">Offline-first mobile path</span></div>
      </div>
      <div className="mt-[4vh] text-[2.2vw] leading-[1.35] text-[#9cc7a0]">The differentiator is the connection between learning actions, world state, and return behavior.</div>
    </SlideFrame>
  );
}