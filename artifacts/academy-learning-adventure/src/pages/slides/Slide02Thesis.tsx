import { Arrow, Panel, PanelLabel, SlideFrame } from "../../components/DeckPrimitives";

export default function Slide02Thesis() {
  return (
    <SlideFrame no="13" eyebrow="SUPPORT / PRODUCT THESIS" title="A GED study loop inside a campus world" subtitle="One product connects GED practice with campus actions and player state.">
      <div className="grid h-full grid-cols-[1.12fr_0.88fr] gap-[3vw]">
        <div className="flex flex-col justify-center">
          <div className="text-[4.1vw] font-bold leading-[1.08] tracking-[-0.07em] text-[#79ff86] crt-glow">Practice, explore, choose again.</div>
          <div className="mt-[3vh] max-w-[47vw] text-[2vw] leading-[1.45] text-[#a5cda8]">A learner can move between GED practice and campus actions while the current player record updates.</div>
        </div>
        <Panel className="my-auto">
          <PanelLabel>PRODUCT LOOP</PanelLabel>
          <div className="mt-[2.5vh] grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-[0.8vw]">
            <div className="border-[0.12vw] border-[#79ff86]/50 p-[1vw] text-center text-[1.8vw] text-[#d8ffda]">ENTER</div>
            <Arrow />
            <div className="border-[0.12vw] border-[#ffbd69]/50 p-[1vw] text-center text-[1.8vw] text-[#d8ffda]">STUDY</div>
            <Arrow />
            <div className="border-[0.12vw] border-[#82f2f6]/50 p-[1vw] text-center text-[1.8vw] text-[#d8ffda]">RETURN</div>
          </div>
          <div className="mt-[3vh] border-t-[0.12vw] border-[#527659] pt-[2vh] text-[1.7vw] leading-[1.45] text-[#86aa8b]">Practice updates the player state in that app; cross-device save sync is not implied.</div>
        </Panel>
      </div>
    </SlideFrame>
  );
}