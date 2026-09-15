import { Panel, PanelLabel, ProgressBar, SlideFrame } from "../../components/DeckPrimitives";

export default function Slide13ProgressStats() {
  return (
    <SlideFrame no="13" eyebrow="12 / PROGRESS" title="Progress is a record of what the learner has actually done">
      <div className="grid h-full grid-cols-[0.72fr_1.28fr] gap-[3vw]">
        <Panel className="flex flex-col justify-between">
          <div><PanelLabel>CHARACTER STATUS</PanelLabel><div className="mt-[2vh] text-[5.3vw] font-bold leading-none text-[#79ff86]">042</div><div className="mt-[0.8vh] text-[1.6vw] tracking-[0.14em] text-[#86aa8b]">XP / CURRENT TOTAL</div></div>
          <div className="border-t-[0.12vw] border-[#527659] pt-[2vh]"><div className="flex justify-between text-[1.7vw]"><span>STUDY DAYS</span><span className="text-[#ffbd69]">04</span></div><div className="mt-[1.2vh] flex justify-between text-[1.7vw]"><span>LOCATIONS VISITED</span><span className="text-[#82f2f6]">03</span></div><div className="mt-[1.2vh] flex justify-between text-[1.7vw]"><span>RELATIONSHIPS</span><span className="text-[#79ff86]">02</span></div></div>
        </Panel>
        <Panel>
          <PanelLabel color="cyan">STUDY HISTORY / SUBJECT METER</PanelLabel>
          <div className="mt-[3vh] space-y-[2.4vh]">
            <div><div className="mb-[0.7vh] flex justify-between text-[1.8vw]"><span>MATH</span><span className="text-[#79ff86]">08 answered / 06 correct</span></div><ProgressBar value="high" /></div>
            <div><div className="mb-[0.7vh] flex justify-between text-[1.8vw]"><span>LANGUAGE ARTS</span><span className="text-[#ffbd69]">05 answered / 03 correct</span></div><ProgressBar value="mid" tone="amber" /></div>
            <div><div className="mb-[0.7vh] flex justify-between text-[1.8vw]"><span>SCIENCE</span><span className="text-[#82f2f6]">04 answered / 03 correct</span></div><ProgressBar value="mid" tone="cyan" /></div>
            <div><div className="mb-[0.7vh] flex justify-between text-[1.8vw]"><span>SOCIAL STUDIES</span><span className="text-[#79ff86]">03 answered / 02 correct</span></div><ProgressBar value="low" /></div>
          </div>
          <div className="mt-[3vh] text-[1.6vw] text-[#86aa8b]">Illustrative state shown from the implemented progress model.</div>
        </Panel>
      </div>
    </SlideFrame>
  );
}