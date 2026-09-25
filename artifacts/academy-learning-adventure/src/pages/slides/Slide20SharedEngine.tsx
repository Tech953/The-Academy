import { Arrow, Panel, PanelLabel, SlideFrame } from "../../components/DeckPrimitives";

export default function Slide20SharedEngine() {
  return (
    <SlideFrame no="09" eyebrow="CORE 09 / SHARED GAME RULES" title="Web and mobile share rules, not a synced save" coreStep="CORE PATH · 09/12">
      <div className="grid h-full grid-cols-[1fr_auto_1.2fr_auto_1fr] items-center gap-[1vw]">
        <div className="space-y-[1.2vh]"><Panel><PanelLabel>WEB</PanelLabel><div className="mt-[1.5vh] text-[2.2vw] text-[#79ff86]">Desktop + API-backed saves</div></Panel><Panel><PanelLabel color="amber">MOBILE</PanelLabel><div className="mt-[1.5vh] text-[2.2vw] text-[#ffbd69]">Offline app + local saves</div></Panel></div>
        <Arrow />
        <Panel className="border-[#ffbd69]/65 bg-[#102217]"><PanelLabel color="amber">@WORKSPACE / GAME-ENGINE</PanelLabel><div className="mt-[2vh] text-[3.1vw] font-bold leading-[1.06] text-[#d8ffda]">Shared game rules</div><div className="mt-[2vh] space-y-[1vh] text-[1.7vw] text-[#9cc7a0]"><div>locations + NPCs</div><div>GED question templates</div><div>content packs + themes</div><div>dialogue templates</div><div>deterministic fallbacks</div></div></Panel>
        <Arrow />
        <div className="space-y-[1.2vh]"><Panel><PanelLabel color="cyan">API</PanelLabel><div className="mt-[1.5vh] text-[2.2vw] text-[#82f2f6]">Optional enrichment</div></Panel><Panel><PanelLabel>SAVE BOUNDARY</PanelLabel><div className="mt-[1.5vh] text-[2.2vw] text-[#79ff86]">Surface-specific state</div></Panel></div>
      </div>
    </SlideFrame>
  );
}