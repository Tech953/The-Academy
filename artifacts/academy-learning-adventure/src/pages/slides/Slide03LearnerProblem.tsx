import { Panel, PanelLabel, SlideFrame } from "../../components/DeckPrimitives";

export default function Slide03LearnerProblem() {
  return (
    <SlideFrame no="03" eyebrow="02 / THE LEARNER PROBLEM" title="Studying asks for effort before it gives a reason to return">
      <div className="grid h-full grid-cols-3 gap-[1.6vw]">
        <Panel>
          <PanelLabel color="amber">01 / START</PanelLabel>
          <div className="mt-[4vh] text-[3.3vw] font-bold leading-[1.03] text-[#ffbd69]">Blank page</div>
          <div className="mt-[2vh] text-[1.9vw] leading-[1.45] text-[#a5cda8]">The first action is often a worksheet, a portal, or a question with no context.</div>
        </Panel>
        <Panel>
          <PanelLabel color="cyan">02 / STAY</PanelLabel>
          <div className="mt-[4vh] text-[3.3vw] font-bold leading-[1.03] text-[#82f2f6]">Thin feedback</div>
          <div className="mt-[2vh] text-[1.9vw] leading-[1.45] text-[#a5cda8]">Progress is easy to lose when practice, history, and encouragement live in separate places.</div>
        </Panel>
        <Panel>
          <PanelLabel>03 / RETURN</PanelLabel>
          <div className="mt-[4vh] text-[3.3vw] font-bold leading-[1.03] text-[#79ff86]">No continuity</div>
          <div className="mt-[2vh] text-[1.9vw] leading-[1.45] text-[#a5cda8]">A learner can finish an item without feeling that a next chapter is waiting.</div>
        </Panel>
      </div>
      <div className="absolute bottom-[10vh] left-0 text-[1.7vw] tracking-[0.1em] text-[#527659]">THE ACADEMY STARTS WITH THE RETURN VISIT</div>
    </SlideFrame>
  );
}