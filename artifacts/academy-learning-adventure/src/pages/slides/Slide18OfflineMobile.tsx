import { Panel, PanelLabel, Phone, ProgressBar, SlideFrame } from "../../components/DeckPrimitives";

export default function Slide18OfflineMobile() {
  return (
    <SlideFrame no="08" eyebrow="CORE 08 / MOBILE OFFLINE" title="Mobile study can continue offline" coreStep="CORE PATH · 08/12">
      <div className="grid h-full min-h-0 grid-cols-[0.82fr_1.18fr] items-center gap-[4vw]">
        <Phone>
          <div className="text-[2.3vw] font-bold text-[#79ff86]">DAY 04</div>
          <div className="mt-[1vh] border-[0.12vw] border-[#79ff86]/45 p-[0.8vw]"><div className="text-[1.5vw] text-[#ffbd69]">BUNDLED SET</div><div className="mt-[0.5vh] text-[1.8vw] text-[#d8ffda]">Math / 05 Q</div><div className="mt-[0.9vh]"><ProgressBar value="mid" /></div></div>
          <div className="mt-[0.9vh] border-[0.12vw] border-[#527659] p-[0.8vw] text-[1.6vw] text-[#86aa8b]">ENGINE READY</div>
          <div className="mt-[1vh] text-center text-[1.5vw] tracking-[0.12em] text-[#ffbd69]">STUDY OFFLINE</div>
        </Phone>
        <Panel className="min-h-0 overflow-hidden">
          <PanelLabel color="amber">MOBILE CONTRACT</PanelLabel>
          <div className="mt-[1.2vh] text-[2.3vw] font-bold leading-[1.12] text-[#ffbd69]">Bundled content keeps mobile study available offline.</div>
          <div className="mt-[1.5vh] space-y-[0.7vh]"><div className="text-[1.6vw] leading-[1.2] text-[#d8ffda]">› Player state is stored on the device.</div><div className="text-[1.6vw] leading-[1.2] text-[#d8ffda]">› The local engine supplies study sets and quizzes.</div><div className="text-[1.6vw] leading-[1.2] text-[#d8ffda]">› Remote AI descriptions are optional; fallback text is bundled.</div></div>
        </Panel>
      </div>
    </SlideFrame>
  );
}