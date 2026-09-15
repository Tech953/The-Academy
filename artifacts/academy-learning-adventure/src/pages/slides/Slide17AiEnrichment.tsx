import { Arrow, Panel, PanelLabel, SlideFrame, Window } from "../../components/DeckPrimitives";

export default function Slide17AiEnrichment() {
  return (
    <SlideFrame no="17" eyebrow="16 / AI DESCRIPTION ENGINE" title="AI enriches atmosphere without owning the game state">
      <div className="grid h-full grid-cols-[1fr_auto_1fr] items-center gap-[1.2vw]">
        <Panel><PanelLabel>CANONICAL LOCATION</PanelLabel><div className="mt-[2.4vh] text-[2.5vw] font-bold text-[#d8ffda]">Library Annex</div><div className="mt-[1.7vh] text-[1.8vw] leading-[1.45] text-[#86aa8b]">The shared engine owns the location, NPCs, and interactables.</div><div className="mt-[2.2vh] border-t-[0.12vw] border-[#527659] pt-[1.5vh] text-[1.6vw] text-[#79ff86]">SOURCE / DETERMINISTIC</div></Panel>
        <Arrow />
        <Window title="DESCRIPTION ENGINE / LOCATION MODE">
          <PanelLabel color="cyan">ENRICHED FLAVOR TEXT</PanelLabel>
          <div className="mt-[2vh] text-[2.1vw] leading-[1.38] text-[#82f2f6]">“Dust hangs in the monitor glow. Someone has left a question open on the terminal.”</div>
          <div className="mt-[2.5vh] text-[1.6vw] leading-[1.4] text-[#86aa8b]">Server-side OpenAI endpoint. Client-side caching. Fallback text remains available.</div>
        </Window>
      </div>
    </SlideFrame>
  );
}