import { Panel, PanelLabel, SlideFrame } from "../../components/DeckPrimitives";

export default function Slide26ImplementationReadiness() {
  return (
    <SlideFrame no="29" eyebrow="APPENDIX / IMPLEMENTATION" title="Core product surfaces are represented in code">
      <div className="grid h-full grid-cols-2 gap-[1.5vw]">
         <Panel><PanelLabel>EXPERIENCE SURFACES</PanelLabel><div className="mt-[2.5vh] space-y-[1.25vh] text-[1.9vw] text-[#d8ffda]"><div className="flex justify-between"><span>CRT boot + desktop</span><span className="text-[#79ff86]">REPRESENTED</span></div><div className="flex justify-between"><span>GED subjects + quiz sets</span><span className="text-[#79ff86]">REPRESENTED</span></div><div className="flex justify-between"><span>Stats + study history</span><span className="text-[#79ff86]">REPRESENTED</span></div><div className="flex justify-between"><span>NPC dialogue + relationships</span><span className="text-[#79ff86]">REPRESENTED</span></div></div></Panel>
         <Panel><PanelLabel color="cyan">PLATFORM SURFACES</PanelLabel><div className="mt-[2.5vh] space-y-[1.25vh] text-[1.9vw] text-[#d8ffda]"><div className="flex justify-between"><span>Expo offline study path</span><span className="text-[#82f2f6]">REPRESENTED</span></div><div className="flex justify-between"><span>Shared game engine</span><span className="text-[#82f2f6]">REPRESENTED</span></div><div className="flex justify-between"><span>API enrichment boundary</span><span className="text-[#82f2f6]">REPRESENTED</span></div><div className="flex justify-between"><span>Deterministic fallbacks</span><span className="text-[#82f2f6]">REPRESENTED</span></div></div></Panel>
      </div>
       <div className="absolute bottom-[10vh] left-0 right-0 text-center text-[1.7vw] text-[#86aa8b]">Code representation is evidence of readiness, not traction or learning outcomes.</div>
    </SlideFrame>
  );
}