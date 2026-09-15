import { Panel, PanelLabel, SlideFrame, Window } from "../../components/DeckPrimitives";

export default function Slide16WeeklyThemes() {
  return (
    <SlideFrame no="16" eyebrow="15 / CAMPUS RHYTHM" title="Weekly themes and events keep the campus moving">
      <div className="grid h-full grid-cols-[1.1fr_0.9fr] gap-[3vw]">
        <Window title="CAMPUS BULLETIN / WEEK 02">
          <div className="grid grid-cols-[0.2fr_1fr] gap-[1.2vw]">
            <div className="text-[3.4vw] font-bold text-[#ffbd69]">02</div>
            <div><PanelLabel color="amber">ACTIVE THEME</PanelLabel><div className="mt-[1.3vh] text-[2.8vw] font-bold text-[#d8ffda]">Questions are waiting</div><div className="mt-[2vh] text-[1.8vw] leading-[1.45] text-[#9cc7a0]">The campus bulletin refreshes with the day and carries current events into the player's next choices.</div></div>
          </div>
          <div className="mt-[3vh] grid grid-cols-3 gap-[1vw] border-t-[0.12vw] border-[#527659] pt-[2vh] text-[1.6vw]"><div className="border-[0.12vw] border-[#79ff86]/40 p-[1vw] text-[#79ff86]">MON / OPEN</div><div className="border-[0.12vw] border-[#ffbd69]/40 p-[1vw] text-[#ffbd69]">WED / ACTIVE</div><div className="border-[0.12vw] border-[#82f2f6]/40 p-[1vw] text-[#82f2f6]">FRI / REFRESH</div></div>
        </Window>
        <Panel className="flex flex-col justify-between">
          <div><PanelLabel>CONTENT PACK</PanelLabel><div className="mt-[2vh] text-[2.5vw] font-bold text-[#79ff86]">A living bulletin, not a feed.</div></div>
          <div className="space-y-[1.4vh] text-[1.8vw] text-[#9cc7a0]"><div className="flex justify-between border-b-[0.12vw] border-[#527659] pb-[1vh]"><span>HEADLINES</span><span className="text-[#d8ffda]">RSS / optional</span></div><div className="flex justify-between border-b-[0.12vw] border-[#527659] pb-[1vh]"><span>EVENTS</span><span className="text-[#d8ffda]">deterministic</span></div><div className="flex justify-between"><span>REFRESH</span><span className="text-[#d8ffda]">day / week</span></div></div>
        </Panel>
      </div>
    </SlideFrame>
  );
}