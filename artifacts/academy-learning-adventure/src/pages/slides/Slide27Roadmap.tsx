import { Panel, PanelLabel, SlideFrame } from "../../components/DeckPrimitives";

export default function Slide27Roadmap() {
  return (
    <SlideFrame no="10" eyebrow="CORE 10 / CURRENT & NEXT" title="What exists now—and what a pilot could test" coreStep="CORE PATH · 10/12">
      <div className="grid h-[40vh] min-h-0 grid-cols-3 gap-[1.5vw]">
        <Panel className="min-h-0 overflow-hidden"><PanelLabel>IN CODE</PanelLabel><div className="mt-[2.5vh] text-[2.3vw] font-bold leading-[1.12] text-[#79ff86]">Playable core</div><div className="mt-[2vh] space-y-[0.7vh] text-[1.8vw] leading-[1.25] text-[#9cc7a0]"><div>› Web desktop</div><div>› GED study loop</div><div>› Mobile offline study</div></div></Panel>
        <Panel className="min-h-0 overflow-hidden"><PanelLabel color="amber">NEXT TO VALIDATE</PanelLabel><div className="mt-[2.5vh] text-[2.3vw] font-bold leading-[1.12] text-[#ffbd69]">Observe the learner journey</div><div className="mt-[2vh] space-y-[0.7vh] text-[1.8vw] leading-[1.25] text-[#9cc7a0]"><div>› Test onboarding</div><div>› Observe study choices</div><div>› Gather educator feedback</div></div></Panel>
        <Panel className="min-h-0 overflow-hidden"><PanelLabel color="cyan">PROPOSED PILOT</PanelLabel><div className="mt-[2.5vh] text-[2.3vw] font-bold leading-[1.12] text-[#82f2f6]">Agree what to measure</div><div className="mt-[2vh] space-y-[0.7vh] text-[1.8vw] leading-[1.25] text-[#9cc7a0]"><div>› Define a small cohort</div><div>› Agree on measures first</div><div>› Shape partner content</div></div></Panel>
      </div>
      <div className="mt-[3vh] text-center text-[1.6vw] tracking-[0.1em] text-[#527659]">NO PILOT RESULTS OR LEARNING OUTCOMES YET</div>
    </SlideFrame>
  );
}