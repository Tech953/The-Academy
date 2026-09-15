import { Arrow, Panel, PanelLabel, SlideFrame } from "../../components/DeckPrimitives";

export default function Slide10StudyLoop() {
  return (
    <SlideFrame no="10" eyebrow="09 / LEARNING LOOP" title="A repeatable loop: study, answer, see progress, choose again">
      <div className="grid h-full grid-cols-4 gap-[1.2vw]">
        <Panel className="flex flex-col justify-center"><PanelLabel>01 / SELECT</PanelLabel><div className="mt-[2vh] text-[2.5vw] font-bold text-[#79ff86]">Open a subject</div><div className="mt-[1.5vh] text-[1.7vw] leading-[1.4] text-[#86aa8b]">Math, language arts, science, or social studies.</div></Panel>
        <Panel className="flex flex-col justify-center"><PanelLabel color="amber">02 / ANSWER</PanelLabel><div className="mt-[2vh] text-[2.5vw] font-bold text-[#ffbd69]">Take a set</div><div className="mt-[1.5vh] text-[1.7vw] leading-[1.4] text-[#86aa8b]">Five generated questions, seeded by subject and day.</div></Panel>
        <Panel className="flex flex-col justify-center"><PanelLabel color="cyan">03 / UPDATE</PanelLabel><div className="mt-[2vh] text-[2.5vw] font-bold text-[#82f2f6]">Earn the result</div><div className="mt-[1.5vh] text-[1.7vw] leading-[1.4] text-[#86aa8b]">Correct answers add XP, stats, and study history.</div></Panel>
        <Panel className="flex flex-col justify-center"><PanelLabel>04 / CONTINUE</PanelLabel><div className="mt-[2vh] text-[2.5vw] font-bold text-[#79ff86]">Return tomorrow</div><div className="mt-[1.5vh] text-[1.7vw] leading-[1.4] text-[#86aa8b]">Advance the day and get a fresh campus state.</div></Panel>
      </div>
      <div className="absolute bottom-[10vh] left-[17vw] right-[17vw] flex items-center justify-between text-[1.7vw] text-[#527659]"><span>STATE PERSISTS</span><Arrow /><span>CONTEXT ACCUMULATES</span><Arrow /><span>AGENCY EXPANDS</span></div>
    </SlideFrame>
  );
}