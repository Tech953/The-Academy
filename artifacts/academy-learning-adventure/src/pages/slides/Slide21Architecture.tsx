import { Arrow, Panel, PanelLabel, SlideFrame } from "../../components/DeckPrimitives";

export default function Slide21Architecture() {
  return (
    <SlideFrame no="21" eyebrow="20 / PLATFORM ARCHITECTURE" title="Web, mobile, and API meet at a shared game boundary">
      <div className="grid h-full grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-[1vw]">
        <Panel className="h-[37vh]"><PanelLabel>WEB FRONTEND</PanelLabel><div className="mt-[2vh] text-[2.5vw] font-bold text-[#79ff86]">React + Vite</div><div className="mt-[2vh] space-y-[1vh] text-[1.7vw] text-[#9cc7a0]"><div>retro desktop shell</div><div>same-origin API calls</div><div>study + campus apps</div></div></Panel>
        <Arrow />
        <Panel className="h-[45vh] border-[#ffbd69]/65 bg-[#102217]"><PanelLabel color="amber">SHARED GAME LAYER</PanelLabel><div className="mt-[2vh] text-[2.7vw] font-bold text-[#d8ffda]">Game engine</div><div className="mt-[2vh] space-y-[1vh] text-[1.7vw] text-[#9cc7a0]"><div>schema + content</div><div>quiz generation</div><div>dialogue templates</div><div>fallback behavior</div></div><div className="mt-[2vh] border-t-[0.12vw] border-[#527659] pt-[1.4vh] text-[1.6vw] text-[#ffbd69]">SINGLE SOURCE OF PLAY</div></Panel>
        <Arrow />
        <Panel className="h-[37vh]"><PanelLabel color="cyan">API SERVER</PanelLabel><div className="mt-[2vh] text-[2.5vw] font-bold text-[#82f2f6]">Express 5</div><div className="mt-[2vh] space-y-[1vh] text-[1.7vw] text-[#9cc7a0]"><div>content pack route</div><div>AI description route</div><div>AI dialogue route</div></div></Panel>
      </div>
      <div className="absolute bottom-[10vh] left-0 right-0 text-center text-[1.7vw] text-[#527659]">PostgreSQL + Drizzle provide the server-side persistence boundary.</div>
    </SlideFrame>
  );
}