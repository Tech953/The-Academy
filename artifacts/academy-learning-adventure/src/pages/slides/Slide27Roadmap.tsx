import { Panel, PanelLabel, SlideFrame } from "../../components/DeckPrimitives";

export default function Slide27Roadmap() {
  return (
    <SlideFrame no="27" eyebrow="26 / ROADMAP" title="Roadmap: from playable core to tested learning partnership">
      <div className="grid h-full grid-cols-3 gap-[1.5vw]">
        <Panel><PanelLabel>NOW</PanelLabel><div className="mt-[2.5vh] text-[2.8vw] font-bold text-[#79ff86]">Playable core</div><div className="mt-[2vh] space-y-[1.1vh] text-[1.8vw] leading-[1.4] text-[#9cc7a0]"><div>› Web desktop experience</div><div>› GED study loop</div><div>› Mobile offline engine</div><div>› AI enrichment boundary</div></div></Panel>
        <Panel><PanelLabel color="amber">NEXT</PanelLabel><div className="mt-[2.5vh] text-[2.8vw] font-bold text-[#ffbd69]">Instrument the loop</div><div className="mt-[2vh] space-y-[1.1vh] text-[1.8vw] leading-[1.4] text-[#9cc7a0]"><div>› Validate onboarding</div><div>› Observe study pathways</div><div>› Refine themes and content packs</div><div>› Test educator workflows</div></div></Panel>
        <Panel><PanelLabel color="cyan">PROPOSED</PanelLabel><div className="mt-[2.5vh] text-[2.8vw] font-bold text-[#82f2f6]">Pilot with partners</div><div className="mt-[2vh] space-y-[1.1vh] text-[1.8vw] leading-[1.4] text-[#9cc7a0]"><div>› Define pilot cohort</div><div>› Set learning measures</div><div>› Build partner content</div><div>› Report verified results</div></div></Panel>
      </div>
      <div className="absolute bottom-[10vh] left-0 right-0 text-center text-[1.6vw] tracking-[0.1em] text-[#527659]">FUTURE STEPS ARE PROPOSED / OUTCOMES NOT YET VERIFIED</div>
    </SlideFrame>
  );
}