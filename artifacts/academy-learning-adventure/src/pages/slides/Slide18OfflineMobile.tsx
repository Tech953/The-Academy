import { Panel, PanelLabel, Phone, ProgressBar, SlideFrame } from "../../components/DeckPrimitives";

export default function Slide18OfflineMobile() {
  return (
    <SlideFrame no="18" eyebrow="17 / MOBILE" title="Offline-first mobile keeps the study loop available">
      <div className="grid h-full min-h-0 grid-cols-[0.82fr_1.18fr] items-center gap-[4vw]">
        <Phone>
          <div className="text-[2.3vw] font-bold text-[#79ff86]">DAY 04</div>
          <div className="mt-[1vh] border-[0.12vw] border-[#79ff86]/45 p-[0.8vw]"><div className="text-[1.5vw] text-[#ffbd69]">CURRENT SET</div><div className="mt-[0.5vh] text-[1.8vw] text-[#d8ffda]">Math / 05 Q</div><div className="mt-[0.9vh]"><ProgressBar value="mid" /></div></div>
          <div className="mt-[0.9vh] border-[0.12vw] border-[#527659] p-[0.8vw] text-[1.6vw] text-[#86aa8b]">LOCAL ENGINE READY</div>
          <div className="mt-[1vh] text-center text-[1.5vw] tracking-[0.12em] text-[#ffbd69]">CONNECTION NOT REQUIRED</div>
        </Phone>
        <Panel className="min-h-0 overflow-hidden">
          <PanelLabel color="amber">MOBILE CONTRACT</PanelLabel>
          <div className="mt-[1.7vh] text-[2.7vw] font-bold leading-[1.1] text-[#ffbd69]">The study loop works even when enrichment is unavailable.</div>
          <div className="mt-[2.3vh] space-y-[1.2vh]"><div className="text-[1.9vw] text-[#d8ffda]">› AsyncStorage keeps player state local.</div><div className="text-[1.9vw] text-[#d8ffda]">› A deterministic engine serves study content and quizzes.</div><div className="text-[1.9vw] text-[#d8ffda]">› AI enrichment is an enhancement, not a dependency.</div></div>
        </Panel>
      </div>
    </SlideFrame>
  );
}