import { Arrow, Panel, PanelLabel, SlideFrame } from "../../components/DeckPrimitives";

export default function Slide15ToneAwareDialogue() {
  return (
    <SlideFrame no="15" eyebrow="14 / DIALOGUE" title="Tone-aware dialogue makes the learner's voice part of the system">
      <div className="grid h-full grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-[1vw]">
        <Panel><PanelLabel>PLAYER INPUT</PanelLabel><div className="mt-[3vh] text-[2.5vw] leading-[1.2] text-[#d8ffda]">“I’m stuck, but I’m not done.”</div><div className="mt-[2.5vh] text-[1.6vw] text-[#86aa8b]">MESSAGE / RECEIVED</div></Panel>
        <Arrow />
        <Panel><PanelLabel color="amber">TONE ANALYSIS</PanelLabel><div className="mt-[3vh] text-[2.5vw] font-bold text-[#ffbd69]">RESOLUTE</div><div className="mt-[2.5vh] text-[1.7vw] leading-[1.4] text-[#86aa8b]">Emotion and delta are derived before the NPC response is generated.</div></Panel>
        <Arrow />
        <Panel><PanelLabel color="cyan">NPC RESPONSE</PanelLabel><div className="mt-[3vh] text-[2.5vw] leading-[1.2] text-[#82f2f6]">“Then take the next small step.”</div><div className="mt-[2.5vh] text-[1.6vw] text-[#86aa8b]">RELATIONSHIP / UPDATED</div></Panel>
      </div>
      <div className="absolute bottom-[10vh] left-0 right-0 text-center text-[1.8vw] text-[#9cc7a0]">The relationship model can move warmer or cooler. It is not a one-way reward meter.</div>
    </SlideFrame>
  );
}