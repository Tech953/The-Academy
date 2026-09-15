import { Panel, PanelLabel, SlideFrame } from "../../components/DeckPrimitives";

export default function Slide11GedCoverage() {
  return (
    <SlideFrame no="11" eyebrow="10 / GED COVERAGE" title="Four GED subjects, one shared campus">
      <div className="grid h-full grid-cols-4 gap-[1.3vw]">
        <Panel className="border-[#79ff86]/55"><PanelLabel>MATH</PanelLabel><div className="mt-[3vh] text-[3vw] font-bold text-[#79ff86]">MTH</div><div className="mt-[2vh] text-[1.8vw] leading-[1.45] text-[#9cc7a0]">Math and logic questions feed the same XP and stat system as the rest of campus.</div><div className="mt-[3vh] text-[4vw] text-[#79ff86]">∑</div></Panel>
        <Panel className="border-[#ffbd69]/55"><PanelLabel color="amber">LANGUAGE ARTS</PanelLabel><div className="mt-[3vh] text-[3vw] font-bold text-[#ffbd69]">ELA</div><div className="mt-[2vh] text-[1.8vw] leading-[1.45] text-[#9cc7a0]">Reading and writing practice is part of the same repeatable study loop.</div><div className="mt-[3vh] text-[4vw] text-[#ffbd69]">¶</div></Panel>
        <Panel className="border-[#82f2f6]/55"><PanelLabel color="cyan">SCIENCE</PanelLabel><div className="mt-[3vh] text-[3vw] font-bold text-[#82f2f6]">SCI</div><div className="mt-[2vh] text-[1.8vw] leading-[1.45] text-[#9cc7a0]">Science questions are generated from the shared offline-capable engine.</div><div className="mt-[3vh] text-[4vw] text-[#82f2f6]">+</div></Panel>
        <Panel className="border-[#79ff86]/55"><PanelLabel>SOCIAL STUDIES</PanelLabel><div className="mt-[3vh] text-[3vw] font-bold text-[#79ff86]">SOC</div><div className="mt-[2vh] text-[1.8vw] leading-[1.45] text-[#9cc7a0]">History and civics questions live beside campus events and dialogue.</div><div className="mt-[3vh] text-[4vw] text-[#79ff86]">⌂</div></Panel>
      </div>
    </SlideFrame>
  );
}