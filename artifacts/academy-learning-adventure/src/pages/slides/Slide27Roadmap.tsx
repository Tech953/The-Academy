import { Panel, PanelLabel, SlideFrame } from "../../components/DeckPrimitives";

export default function Slide27Roadmap() {
  return (
    <SlideFrame no="27" eyebrow="26 / ROADMAP" title="Roadmap: from playable core to tested learning partnership">
      <div className="grid h-[40vh] min-h-0 grid-cols-3 gap-[1.5vw]">
        <Panel className="min-h-0 overflow-hidden"><PanelLabel>NOW</PanelLabel><div className="mt-[2.5vh] text-[2.8vw] font-bold text-[#79ff86]">Playable core</div><div className="mt-[2vh] space-y-[0.7vh] text-[1.8vw] leading-[1.25] text-[#9cc7a0]"><div>› Web desktop</div><div>› GED study loop</div><div>› Mobile offline engine</div></div></Panel>
        <Panel className="min-h-0 overflow-hidden"><PanelLabel color="amber">NEXT</PanelLabel><div className="mt-[2.5vh] text-[2.8vw] font-bold text-[#ffbd69]">Instrument the loop</div><div className="mt-[2vh] space-y-[0.7vh] text-[1.8vw] leading-[1.25] text-[#9cc7a0]"><div>› Validate onboarding</div><div>› Observe pathways</div><div>› Educator testing</div></div></Panel>
        <Panel className="min-h-0 overflow-hidden"><PanelLabel color="cyan">PROPOSED</PanelLabel><div className="mt-[2.5vh] text-[2.8vw] font-bold text-[#82f2f6]">Pilot with partners</div><div className="mt-[2vh] space-y-[0.7vh] text-[1.8vw] leading-[1.25] text-[#9cc7a0]"><div>› Define pilot cohort</div><div>› Set learning measures</div><div>› Partner content</div></div></Panel>
      </div>
      <div className="mt-[3vh] text-center text-[1.6vw] tracking-[0.1em] text-[#527659]">FUTURE STEPS ARE PROPOSED / OUTCOMES NOT YET VERIFIED</div>
    </SlideFrame>
  );
}