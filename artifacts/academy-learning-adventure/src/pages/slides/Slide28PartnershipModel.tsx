import { Panel, PanelLabel, SlideFrame } from "../../components/DeckPrimitives";

export default function Slide28PartnershipModel() {
  return (
    <SlideFrame no="28" eyebrow="27 / PARTNERSHIP MODEL" title="Partnership can start with content, context, or a measured pilot">
      <div className="grid h-full grid-cols-3 gap-[1.5vw]">
        <Panel><PanelLabel>CONTENT PARTNER</PanelLabel><div className="mt-[3vh] text-[2.7vw] font-bold text-[#79ff86]">Bring a subject</div><div className="mt-[2vh] text-[1.8vw] leading-[1.45] text-[#86aa8b]">Shape question sets, weekly themes, assignments, or campus events around a real program.</div></Panel>
        <Panel><PanelLabel color="amber">PROGRAM PARTNER</PanelLabel><div className="mt-[3vh] text-[2.7vw] font-bold text-[#ffbd69]">Bring a learner context</div><div className="mt-[2vh] text-[1.8vw] leading-[1.45] text-[#86aa8b]">Define the support model, access needs, and educator touchpoints that make a pilot meaningful.</div></Panel>
        <Panel><PanelLabel color="cyan">EVALUATION PARTNER</PanelLabel><div className="mt-[3vh] text-[2.7vw] font-bold text-[#82f2f6]">Bring a measure</div><div className="mt-[2vh] text-[1.8vw] leading-[1.45] text-[#86aa8b]">Agree on success criteria before future claims are made.</div></Panel>
      </div>
    </SlideFrame>
  );
}