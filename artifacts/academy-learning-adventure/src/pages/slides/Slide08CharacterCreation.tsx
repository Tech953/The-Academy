import { Panel, PanelLabel, ProgressBar, SlideFrame } from "../../components/DeckPrimitives";

export default function Slide08CharacterCreation() {
  return (
    <SlideFrame no="08" eyebrow="07 / CHARACTER CREATION" title="Character creation turns study habits into visible traits">
      <div className="grid h-full grid-cols-[0.78fr_1.22fr] gap-[3vw]">
        <Panel className="flex flex-col justify-between">
          <div><PanelLabel color="amber">RECRUIT PROFILE</PanelLabel><div className="mt-[2vh] text-[3.4vw] font-bold text-[#d8ffda]">MORGAN</div><div className="mt-[0.7vh] text-[1.6vw] text-[#86aa8b]">STATUS / ENROLLED</div></div>
          <div className="border-t-[0.12vw] border-[#527659] pt-[2vh]"><div className="text-[1.6vw] text-[#ffbd69]">STARTER PERK</div><div className="mt-[0.8vh] text-[2.1vw] text-[#d8ffda]">Late Night Reader</div><div className="mt-[2vh] text-[1.6vw] text-[#ffbd69]">TRAIT</div><div className="mt-[0.8vh] text-[2.1vw] text-[#d8ffda]">Curious</div></div>
        </Panel>
        <Panel>
          <PanelLabel>INITIAL STAT BOARD</PanelLabel>
          <div className="mt-[2.5vh] space-y-[1.8vh]">
            <div><div className="mb-[0.8vh] flex justify-between text-[1.7vw]"><span>QUICKNESS</span><span className="text-[#79ff86]">10</span></div><ProgressBar value="mid" /></div>
            <div><div className="mb-[0.8vh] flex justify-between text-[1.7vw]"><span>STRENGTH</span><span className="text-[#79ff86]">10</span></div><ProgressBar value="low" tone="amber" /></div>
            <div><div className="mb-[0.8vh] flex justify-between text-[1.7vw]"><span>MATH / LOGIC</span><span className="text-[#79ff86]">10</span></div><ProgressBar value="high" tone="cyan" /></div>
            <div><div className="mb-[0.8vh] flex justify-between text-[1.7vw]"><span>PRESENCE</span><span className="text-[#79ff86]">10</span></div><ProgressBar value="mid" /></div>
          </div>
        </Panel>
      </div>
    </SlideFrame>
  );
}