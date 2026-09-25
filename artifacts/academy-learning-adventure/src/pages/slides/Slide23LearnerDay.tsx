import { Panel, PanelLabel, SlideFrame } from "../../components/DeckPrimitives";

export default function Slide23LearnerDay() {
  return (
    <SlideFrame no="25" eyebrow="SUPPORT / ILLUSTRATIVE DAY" title="Illustrative day: a sequence of small decisions">
      <div className="relative h-full pl-[5vw]">
        <div className="absolute left-[1.8vw] top-[2vh] bottom-[2vh] w-[0.14vw] bg-[#527659]" />
         <div className="relative mb-[1.9vh] grid grid-cols-[4.2vw_1fr] gap-[1.5vw] items-center"><div className="z-10 flex h-[3.4vw] w-[3.4vw] items-center justify-center rounded-full border-[0.14vw] border-[#79ff86] bg-[#071009] text-[1.5vw] text-[#79ff86]">08:00</div><Panel><PanelLabel>ARRIVE / EXAMPLE</PanelLabel><div className="mt-[0.8vh] text-[2vw] text-[#d8ffda]">Boot the desktop and check the bulletin.</div></Panel></div>
        <div className="relative mb-[1.9vh] grid grid-cols-[4.2vw_1fr] gap-[1.5vw] items-center"><div className="z-10 flex h-[3.4vw] w-[3.4vw] items-center justify-center rounded-full border-[0.14vw] border-[#ffbd69] bg-[#071009] text-[1.5vw] text-[#ffbd69]">10:30</div><Panel><PanelLabel color="amber">STUDY</PanelLabel><div className="mt-[0.8vh] text-[2vw] text-[#d8ffda]">Open a math set. Answer five questions. Add XP.</div></Panel></div>
        <div className="relative mb-[1.9vh] grid grid-cols-[4.2vw_1fr] gap-[1.5vw] items-center"><div className="z-10 flex h-[3.4vw] w-[3.4vw] items-center justify-center rounded-full border-[0.14vw] border-[#82f2f6] bg-[#071009] text-[1.5vw] text-[#82f2f6]">14:00</div><Panel><PanelLabel color="cyan">CONNECT</PanelLabel><div className="mt-[0.8vh] text-[2vw] text-[#d8ffda]">Talk with a faculty NPC. Tone shifts the relationship state.</div></Panel></div>
         <div className="relative grid grid-cols-[4.2vw_1fr] gap-[1.5vw] items-center"><div className="z-10 flex h-[3.4vw] w-[3.4vw] items-center justify-center rounded-full border-[0.14vw] border-[#79ff86] bg-[#071009] text-[1.5vw] text-[#79ff86]">20:00</div><Panel><PanelLabel>RETURN / EXAMPLE</PanelLabel><div className="mt-[0.8vh] text-[2vw] text-[#d8ffda]">Advance the day; the bulletin can refresh.</div></Panel></div>
      </div>
    </SlideFrame>
  );
}