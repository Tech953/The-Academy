import { Panel, PanelLabel, SlideFrame } from "../../components/DeckPrimitives";

export default function Slide25AudienceUseCases() {
  return (
    <SlideFrame no="28" eyebrow="APPENDIX / PILOT CONTEXTS" title="Potential contexts for a future pilot">
      <div className="grid h-full grid-cols-3 gap-[1.5vw]">
        <Panel><PanelLabel>LEARNERS / POTENTIAL</PanelLabel><div className="mt-[3vh] text-[2.8vw] font-bold text-[#79ff86]">A place to practice</div><div className="mt-[2vh] text-[1.8vw] leading-[1.45] text-[#86aa8b]">Explore a coherent loop with visible progress and choice.</div></Panel>
        <Panel><PanelLabel color="amber">EDUCATORS / POTENTIAL</PanelLabel><div className="mt-[3vh] text-[2.8vw] font-bold text-[#ffbd69]">A shared context</div><div className="mt-[2vh] text-[1.8vw] leading-[1.45] text-[#86aa8b]">Shape practice and subject context for future program design.</div></Panel>
        <Panel><PanelLabel color="cyan">PARTNERS / POTENTIAL</PanelLabel><div className="mt-[3vh] text-[2.8vw] font-bold text-[#82f2f6]">A platform surface</div><div className="mt-[2vh] text-[1.8vw] leading-[1.45] text-[#86aa8b]">Bring context for a pilot, content pack, or measured iteration.</div></Panel>
      </div>
    </SlideFrame>
  );
}