import { Arrow, Panel, PanelLabel, SlideFrame } from "../../components/DeckPrimitives";

export default function Slide07FirstSession() {
  return (
    <SlideFrame no="07" eyebrow="06 / FIRST SESSION" title="The first session moves from enrollment to agency">
      <div className="grid h-full grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] items-center gap-[0.9vw]">
        <Panel><PanelLabel>01</PanelLabel><div className="mt-[2vh] text-[2.3vw] font-bold text-[#79ff86]">Boot</div><div className="mt-[1.5vh] text-[1.7vw] leading-[1.4] text-[#86aa8b]">The CRT system comes online.</div></Panel>
        <Arrow />
        <Panel><PanelLabel color="amber">02</PanelLabel><div className="mt-[2vh] text-[2.3vw] font-bold text-[#ffbd69]">Enroll</div><div className="mt-[1.5vh] text-[1.7vw] leading-[1.4] text-[#86aa8b]">Name the learner and enter campus.</div></Panel>
        <Arrow />
        <Panel><PanelLabel color="cyan">03</PanelLabel><div className="mt-[2vh] text-[2.3vw] font-bold text-[#82f2f6]">Choose</div><div className="mt-[1.5vh] text-[1.7vw] leading-[1.4] text-[#86aa8b]">Pick a starter perk and trait.</div></Panel>
        <Arrow />
        <Panel><PanelLabel>04</PanelLabel><div className="mt-[2vh] text-[2.3vw] font-bold text-[#79ff86]">Act</div><div className="mt-[1.5vh] text-[1.7vw] leading-[1.4] text-[#86aa8b]">Open an app, study, explore, or talk.</div></Panel>
      </div>
      <div className="absolute bottom-[10vh] left-0 right-0 text-center text-[1.8vw] text-[#9cc7a0]">The first choice is not “what should I study?” It is “who am I in this place?”</div>
    </SlideFrame>
  );
}