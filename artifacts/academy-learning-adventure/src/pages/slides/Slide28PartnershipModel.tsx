import { Panel, PanelLabel, SlideFrame } from "../../components/DeckPrimitives";

export default function Slide28PartnershipModel() {
  return (
    <SlideFrame no="30" eyebrow="APPENDIX / PROPOSED PARTNERSHIPS" title="Possible partnership modes—proposed, not active">
      <div className="grid h-full grid-cols-3 gap-[1.5vw]">
         <Panel><PanelLabel>PROPOSED / CONTENT</PanelLabel><div className="mt-[3vh] text-[2.7vw] font-bold text-[#79ff86]">Bring a subject</div><div className="mt-[2vh] text-[1.8vw] leading-[1.45] text-[#86aa8b]">Shape question sets, themes, or events around a real program.</div></Panel>
         <Panel><PanelLabel color="amber">PROPOSED / PROGRAM</PanelLabel><div className="mt-[3vh] text-[2.7vw] font-bold text-[#ffbd69]">Bring a learner context</div><div className="mt-[2vh] text-[1.8vw] leading-[1.45] text-[#86aa8b]">Define access needs and educator touchpoints for a pilot.</div></Panel>
         <Panel><PanelLabel color="cyan">PROPOSED / EVALUATION</PanelLabel><div className="mt-[3vh] text-[2.7vw] font-bold text-[#82f2f6]">Bring a measure</div><div className="mt-[2vh] text-[1.8vw] leading-[1.45] text-[#86aa8b]">Agree on success criteria before making future claims.</div></Panel>
      </div>
    </SlideFrame>
  );
}