import { Panel, PanelLabel, SlideFrame } from "../../components/DeckPrimitives";

export default function Slide29TheAsk() {
  return (
    <SlideFrame no="29" eyebrow="28 / THE ASK" title="Help us test the return visit">
      <div className="grid h-full grid-cols-[0.8fr_1.2fr] items-center gap-[4vw]">
        <div><div className="text-[5.1vw] font-bold leading-[1] tracking-[-0.08em] text-[#79ff86] crt-glow"><div>A focused</div><div>pilot.</div></div><div className="mt-[3vh] text-[1.8vw] leading-[1.45] text-[#9cc7a0]">No invented scale. Start with a real context, a small cohort, and measures agreed in advance.</div></div>
        <Panel><PanelLabel color="amber">WE ARE ASKING FOR</PanelLabel><div className="mt-[2.5vh] space-y-[1.8vh]"><div className="flex items-start gap-[1vw] text-[2.1vw]"><span className="text-[#ffbd69]">01</span><span>Partner access to a learner or educator context</span></div><div className="flex items-start gap-[1vw] text-[2.1vw]"><span className="text-[#ffbd69]">02</span><span>Content and feedback to shape the campus</span></div><div className="flex items-start gap-[1vw] text-[2.1vw]"><span className="text-[#ffbd69]">03</span><span>Agreement on what to measure before we report</span></div></div></Panel>
      </div>
    </SlideFrame>
  );
}