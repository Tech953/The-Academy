import { Arrow, Panel, PanelLabel, SlideFrame } from "../../components/DeckPrimitives";

export default function Slide20SharedEngine() {
  return (
    <SlideFrame no="20" eyebrow="19 / SHARED ENGINE" title="One content model keeps the experience coherent across surfaces">
      <div className="grid h-full grid-cols-[1fr_auto_1.2fr_auto_1fr] items-center gap-[1vw]">
        <div className="space-y-[1.2vh]"><Panel><PanelLabel>WEB</PanelLabel><div className="mt-[1.5vh] text-[2.2vw] text-[#79ff86]">Desktop shell</div></Panel><Panel><PanelLabel color="amber">MOBILE</PanelLabel><div className="mt-[1.5vh] text-[2.2vw] text-[#ffbd69]">Offline companion</div></Panel></div>
        <Arrow />
        <Panel className="border-[#ffbd69]/65 bg-[#102217]"><PanelLabel color="amber">@WORKSPACE / GAME-ENGINE</PanelLabel><div className="mt-[2vh] text-[3.1vw] font-bold leading-[1.06] text-[#d8ffda]">Shared rules</div><div className="mt-[2vh] space-y-[1vh] text-[1.7vw] text-[#9cc7a0]"><div>locations + NPCs</div><div>GED question generation</div><div>content packs + themes</div><div>dialogue templates</div><div>offline fallbacks</div></div></Panel>
        <Arrow />
        <div className="space-y-[1.2vh]"><Panel><PanelLabel color="cyan">API</PanelLabel><div className="mt-[1.5vh] text-[2.2vw] text-[#82f2f6]">Enrichment boundary</div></Panel><Panel><PanelLabel>STATE</PanelLabel><div className="mt-[1.5vh] text-[2.2vw] text-[#79ff86]">Persistent progress</div></Panel></div>
      </div>
    </SlideFrame>
  );
}