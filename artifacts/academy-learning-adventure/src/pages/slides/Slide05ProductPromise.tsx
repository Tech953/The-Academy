import { Panel, PanelLabel, SlideFrame, Window } from "../../components/DeckPrimitives";

export default function Slide05ProductPromise() {
  return (
    <SlideFrame no="03" eyebrow="CORE 03 / PRODUCT PROMISE" title="Study, explore, and track progress in one campus" coreStep="CORE PATH · 03/12">
      <div className="grid h-full grid-cols-[0.9fr_1.1fr] items-center gap-[3vw]">
        <div className="space-y-[2.6vh]">
          <PanelLabel>THE ACADEMY CONNECTS</PanelLabel>
          <div className="text-[2.6vw] leading-[1.25] text-[#d8ffda]">Move between GED practice and campus actions in the same product.</div>
          <div className="space-y-[1.4vh]">
            <div className="flex items-center gap-[1vw] text-[1.9vw] text-[#79ff86]"><span>+</span><span>GED practice</span></div>
            <div className="flex items-center gap-[1vw] text-[1.9vw] text-[#82f2f6]"><span>+</span><span>Campus exploration</span></div>
            <div className="flex items-center gap-[1vw] text-[1.9vw] text-[#ffbd69]"><span>+</span><span>Progress in the current app</span></div>
          </div>
        </div>
        <Window title="ACADEMY OFFICE / SAMPLE VIEW">
          <div className="grid grid-cols-[0.86fr_1.14fr] gap-[1.3vw]">
            <Panel className="bg-[#0b1f10]">
              <PanelLabel>ACTIVE DAY</PanelLabel>
              <div className="mt-[2vh] text-[4vw] font-bold text-[#79ff86]">DAY 04</div>
              <div className="mt-[1vh] text-[1.6vw] text-[#86aa8b]">NORTH CAMPUS</div>
            </Panel>
            <div className="space-y-[1.2vh]">
              <div className="border-[0.12vw] border-[#79ff86]/40 p-[1vw]"><div className="text-[1.5vw] text-[#ffbd69]">NEXT ACTION</div><div className="mt-[0.7vh] text-[1.9vw] text-[#d8ffda]">Open a math set</div></div>
              <div className="border-[0.12vw] border-[#82f2f6]/40 p-[1vw]"><div className="text-[1.5vw] text-[#82f2f6]">CAMPUS STATUS</div><div className="mt-[0.7vh] text-[1.9vw] text-[#d8ffda]">Library: open</div></div>
            </div>
          </div>
        </Window>
      </div>
    </SlideFrame>
  );
}