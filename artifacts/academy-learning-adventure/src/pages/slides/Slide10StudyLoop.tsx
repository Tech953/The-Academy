import { Arrow, Panel, PanelLabel, SlideFrame } from "../../components/DeckPrimitives";

export default function Slide10StudyLoop() {
  return (
    <SlideFrame no="06" eyebrow="CORE 06 / LEARNING LOOP" title="Study, answer, see progress, choose again" coreStep="CORE PATH · 06/12">
      <div className="grid h-full grid-cols-4 gap-[1.2vw]">
        <Panel className="flex flex-col justify-center"><PanelLabel>01 / SELECT</PanelLabel><div className="mt-[2vh] text-[2.5vw] font-bold text-[#79ff86]">Open a subject</div><div className="mt-[1.5vh] text-[1.7vw] leading-[1.4] text-[#86aa8b]">Math, language arts, science, or social studies.</div></Panel>
        <Panel className="flex flex-col justify-center"><PanelLabel color="amber">02 / ANSWER</PanelLabel><div className="mt-[2vh] text-[2.5vw] font-bold text-[#ffbd69]">Complete a set</div><div className="mt-[1.5vh] text-[1.7vw] leading-[1.4] text-[#86aa8b]">Five questions, generated for subject and day.</div></Panel>
        <Panel className="flex flex-col justify-center"><PanelLabel color="cyan">03 / UPDATE</PanelLabel><div className="mt-[2vh] text-[2.5vw] font-bold text-[#82f2f6]">See the result</div><div className="mt-[1.5vh] text-[1.7vw] leading-[1.4] text-[#86aa8b]">Correct answers update XP, stats, and study history.</div></Panel>
        <Panel className="flex flex-col justify-center"><PanelLabel>04 / CONTINUE</PanelLabel><div className="mt-[2vh] text-[2.5vw] font-bold text-[#79ff86]">Choose again</div><div className="mt-[1.5vh] text-[1.7vw] leading-[1.4] text-[#86aa8b]">Advance the in-game day or pick another action.</div></Panel>
      </div>
      <div className="absolute bottom-[10vh] left-[17vw] right-[17vw] flex items-center justify-between text-[1.7vw] text-[#527659]"><span>RESULT UPDATES</span><Arrow /><span>STATE CARRIES FORWARD</span><Arrow /><span>NEXT CHOICE</span></div>
    </SlideFrame>
  );
}