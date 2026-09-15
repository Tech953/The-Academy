import { Panel, PanelLabel, SlideFrame } from "../../components/DeckPrimitives";

export default function Slide25AudienceUseCases() {
  return (
    <SlideFrame no="25" eyebrow="24 / AUDIENCE" title="Built for the people who make persistence possible">
      <div className="grid h-full grid-cols-3 gap-[1.5vw]">
        <Panel><PanelLabel>LEARNERS</PanelLabel><div className="mt-[3vh] text-[2.8vw] font-bold text-[#79ff86]">A place to practice</div><div className="mt-[2vh] text-[1.8vw] leading-[1.45] text-[#86aa8b]">A coherent daily loop with visible progress, choice, and continuity across web and mobile.</div></Panel>
        <Panel><PanelLabel color="amber">EDUCATORS</PanelLabel><div className="mt-[3vh] text-[2.8vw] font-bold text-[#ffbd69]">A shared context</div><div className="mt-[2vh] text-[1.8vw] leading-[1.45] text-[#86aa8b]">A concrete way to frame practice, assignments, subjects, and learner state for future program design.</div></Panel>
        <Panel><PanelLabel color="cyan">PARTNERS</PanelLabel><div className="mt-[3vh] text-[2.8vw] font-bold text-[#82f2f6]">A platform surface</div><div className="mt-[2vh] text-[1.8vw] leading-[1.45] text-[#86aa8b]">A shared engine and API boundary that can support pilots, content packs, and measured iteration.</div></Panel>
      </div>
    </SlideFrame>
  );
}