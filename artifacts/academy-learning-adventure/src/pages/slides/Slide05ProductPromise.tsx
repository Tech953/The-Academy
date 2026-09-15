import { Panel, PanelLabel, SlideFrame, Window } from "../../components/DeckPrimitives";

export default function Slide05ProductPromise() {
  return (
    <SlideFrame no="05" eyebrow="04 / THE PRODUCT PROMISE" title="Give every study session a setting, a state, and a next move">
      <div className="grid h-full grid-cols-[0.9fr_1.1fr] items-center gap-[3vw]">
        <div className="space-y-[2.6vh]">
          <PanelLabel>THE ACADEMY CONNECTS</PanelLabel>
          <div className="text-[2.6vw] leading-[1.25] text-[#d8ffda]">A learner can study, explore, talk, and progress without leaving the same world.</div>
          <div className="space-y-[1.4vh]">
            <div className="flex items-center gap-[1vw] text-[1.9vw] text-[#79ff86]"><span>+</span><span>Curriculum practice</span></div>
            <div className="flex items-center gap-[1vw] text-[1.9vw] text-[#82f2f6]"><span>+</span><span>Persistent game state</span></div>
            <div className="flex items-center gap-[1vw] text-[1.9vw] text-[#ffbd69]"><span>+</span><span>Offline continuity</span></div>
          </div>
        </div>
        <Window title="ACADEMY OFFICE / TODAY">
          <div className="grid grid-cols-[0.86fr_1.14fr] gap-[1.3vw]">
            <Panel className="bg-[#0b1f10]">
              <PanelLabel>ACTIVE DAY</PanelLabel>
              <div className="mt-[2vh] text-[4vw] font-bold text-[#79ff86]">DAY 04</div>
              <div className="mt-[1vh] text-[1.6vw] text-[#86aa8b]">NORTH CAMPUS</div>
            </Panel>
            <div className="space-y-[1.2vh]">
              <div className="border-[0.12vw] border-[#79ff86]/40 p-[1vw]"><div className="text-[1.5vw] text-[#ffbd69]">NEXT TASK</div><div className="mt-[0.7vh] text-[1.9vw] text-[#d8ffda]">Complete a math set</div></div>
              <div className="border-[0.12vw] border-[#82f2f6]/40 p-[1vw]"><div className="text-[1.5vw] text-[#82f2f6]">CAMPUS SIGNAL</div><div className="mt-[0.7vh] text-[1.9vw] text-[#d8ffda]">Library is open</div></div>
            </div>
          </div>
        </Window>
      </div>
    </SlideFrame>
  );
}