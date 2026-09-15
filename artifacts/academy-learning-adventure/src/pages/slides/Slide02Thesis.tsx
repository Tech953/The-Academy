import { Arrow, Panel, PanelLabel, SlideFrame } from "../../components/DeckPrimitives";

export default function Slide02Thesis() {
  return (
    <SlideFrame no="02" eyebrow="01 / THE THESIS" title="A study system with a world around it" subtitle="The Academy makes GED preparation a place to return to, not a queue of disconnected tasks.">
      <div className="grid h-full grid-cols-[1.12fr_0.88fr] gap-[3vw]">
        <div className="flex flex-col justify-center">
          <div className="text-[4.1vw] font-bold leading-[1.08] tracking-[-0.07em] text-[#79ff86] crt-glow">Study becomes a daily adventure.</div>
          <div className="mt-[3vh] max-w-[47vw] text-[2vw] leading-[1.45] text-[#a5cda8]">Learners move through a shared campus, choose how to spend the day, answer GED questions, and see progress persist across the experience.</div>
        </div>
        <Panel className="my-auto">
          <PanelLabel>PRODUCT LOOP</PanelLabel>
          <div className="mt-[2.5vh] grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-[0.8vw]">
            <div className="border-[0.12vw] border-[#79ff86]/50 p-[1vw] text-center text-[1.8vw] text-[#d8ffda]">ENTER</div>
            <Arrow />
            <div className="border-[0.12vw] border-[#ffbd69]/50 p-[1vw] text-center text-[1.8vw] text-[#d8ffda]">STUDY</div>
            <Arrow />
            <div className="border-[0.12vw] border-[#82f2f6]/50 p-[1vw] text-center text-[1.8vw] text-[#d8ffda]">RETURN</div>
          </div>
          <div className="mt-[3vh] border-t-[0.12vw] border-[#527659] pt-[2vh] text-[1.7vw] leading-[1.45] text-[#86aa8b]">The game state carries forward: XP, stats, study history, relationships, locations, and the next day.</div>
        </Panel>
      </div>
    </SlideFrame>
  );
}