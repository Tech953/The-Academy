import { Arrow, Panel, PanelLabel, SlideFrame } from "../../components/DeckPrimitives";

export default function Slide22SafetyFallbacks() {
  return (
    <SlideFrame no="22" eyebrow="21 / SAFETY + FALLBACKS" title="The experience fails soft, not silent">
      <div className="grid h-[40vh] grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-[1vw]">
        <Panel><PanelLabel>REQUEST</PanelLabel><div className="mt-[3vh] text-[2.4vw] font-bold text-[#d8ffda]">Network call</div><div className="mt-[1.8vh] text-[1.7vw] leading-[1.45] text-[#86aa8b]">Location, examine, dialogue, or content pack.</div></Panel>
        <Arrow />
        <Panel className="border-[#ffbd69]/60"><PanelLabel color="amber">CHECK</PanelLabel><div className="mt-[3vh] text-[2.4vw] font-bold text-[#ffbd69]">Is the response usable?</div><div className="mt-[1.8vh] text-[1.7vw] leading-[1.45] text-[#86aa8b]">Connectivity and payload quality are separate questions.</div></Panel>
        <Arrow />
        <Panel className="border-[#82f2f6]/60"><PanelLabel color="cyan">RECOVER</PanelLabel><div className="mt-[3vh] text-[2.4vw] font-bold text-[#82f2f6]">Keep the game moving</div><div className="mt-[1.8vh] text-[1.7vw] leading-[1.45] text-[#86aa8b]">Deterministic descriptions, events, quizzes, and dialogue remain playable.</div></Panel>
      </div>
      <div className="mx-[6vw] mt-[3vh] border-t-[0.12vw] border-[#527659] pt-[1.7vh] text-center text-[1.7vw] text-[#9cc7a0]">No fabricated certainty: enriched content is additive, and the canonical state stays local and inspectable.</div>
    </SlideFrame>
  );
}