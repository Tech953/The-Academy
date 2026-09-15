import { Panel, PanelLabel, SlideFrame } from "../../components/DeckPrimitives";

export default function Slide19OnlineEnrichment() {
  return (
    <SlideFrame no="19" eyebrow="18 / ONLINE ENRICHMENT" title="When the network is present, the world gains texture">
      <div className="grid h-full grid-cols-3 gap-[1.4vw]">
        <Panel className="flex flex-col justify-between"><div><PanelLabel>BASE LAYER</PanelLabel><div className="mt-[3vh] text-[2.7vw] font-bold text-[#79ff86]">Local state</div></div><div className="text-[1.8vw] leading-[1.45] text-[#86aa8b]">Game rules, progress, stats, questions, and dialogue templates remain available on device.</div></Panel>
        <Panel className="flex flex-col justify-between"><div><PanelLabel color="cyan">NETWORK LAYER</PanelLabel><div className="mt-[3vh] text-[2.7vw] font-bold text-[#82f2f6]">Live content</div></div><div className="text-[1.8vw] leading-[1.45] text-[#86aa8b]">The app can fetch weekly content packs and request richer descriptions or replies through the API.</div></Panel>
        <Panel className="flex flex-col justify-between"><div><PanelLabel color="amber">RECOVERY LAYER</PanelLabel><div className="mt-[3vh] text-[2.7vw] font-bold text-[#ffbd69]">Predictable fallback</div></div><div className="text-[1.8vw] leading-[1.45] text-[#86aa8b]">If a request fails or returns no usable events, deterministic content restores a playable path.</div></Panel>
      </div>
      <div className="absolute bottom-[10vh] left-[14vw] right-[14vw] border-t-[0.12vw] border-[#527659] pt-[1.8vh] text-center text-[1.7vw] tracking-[0.12em] text-[#9cc7a0]">CONNECTED IS RICHER. OFFLINE IS STILL COMPLETE.</div>
    </SlideFrame>
  );
}