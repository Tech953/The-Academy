import { Panel, PanelLabel, SlideFrame } from "../../components/DeckPrimitives";

export default function Slide04Disconnected() {
  return (
    <SlideFrame no="04" eyebrow="03 / THE GAP" title="Why studying feels disconnected">
      <div className="grid h-full grid-cols-[1fr_0.86fr] gap-[3vw]">
        <Panel className="micro-grid">
          <PanelLabel>FRAGMENTED STUDY PATH</PanelLabel>
          <div className="mt-[3vh] space-y-[1.8vh]">
            <div className="flex items-center gap-[1.5vw] border-b-[0.12vw] border-[#527659]/50 pb-[1.5vh]"><span className="text-[2vw] text-[#ffbd69]">01</span><span className="text-[2vw] text-[#d8ffda]">Find a lesson</span><span className="ml-auto text-[1.6vw] text-[#86aa8b]">NEW TAB</span></div>
            <div className="flex items-center gap-[1.5vw] border-b-[0.12vw] border-[#527659]/50 pb-[1.5vh]"><span className="text-[2vw] text-[#ffbd69]">02</span><span className="text-[2vw] text-[#d8ffda]">Answer a quiz</span><span className="ml-auto text-[1.6vw] text-[#86aa8b]">NO CONTEXT</span></div>
            <div className="flex items-center gap-[1.5vw] border-b-[0.12vw] border-[#527659]/50 pb-[1.5vh]"><span className="text-[2vw] text-[#ffbd69]">03</span><span className="text-[2vw] text-[#d8ffda]">Track the result</span><span className="ml-auto text-[1.6vw] text-[#86aa8b]">SEPARATE LOG</span></div>
            <div className="flex items-center gap-[1.5vw]"><span className="text-[2vw] text-[#ffbd69]">04</span><span className="text-[2vw] text-[#d8ffda]">Decide what is next</span><span className="ml-auto text-[1.6vw] text-[#ff7b73]">MANUAL</span></div>
          </div>
        </Panel>
        <div className="flex flex-col justify-center">
          <PanelLabel color="amber">SYSTEM RESPONSE</PanelLabel>
          <div className="mt-[2vh] text-[4vw] font-bold leading-[1.05] tracking-[-0.07em] text-[#ffbd69]">Make the next step visible.</div>
          <div className="mt-[3vh] text-[2vw] leading-[1.45] text-[#a5cda8]">The Academy keeps the learner inside a coherent place: a desktop, a campus, a study history, and a reason to continue.</div>
        </div>
      </div>
    </SlideFrame>
  );
}