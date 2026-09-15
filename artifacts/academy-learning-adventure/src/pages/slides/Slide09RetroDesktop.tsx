import { PanelLabel, SlideFrame, Window } from "../../components/DeckPrimitives";

export default function Slide09RetroDesktop() {
  return (
    <SlideFrame no="09" eyebrow="08 / EXPERIENCE" title="The retro desktop is not decoration; it is the navigation model">
      <div className="h-full border-[0.2vw] border-[#2f5237] bg-[#030a04] p-[0.8vw] shadow-[0_0_3vw_rgba(121,255,134,0.12)]">
        <div className="flex items-center justify-between border-b-[0.12vw] border-[#79ff86]/50 px-[1vw] py-[0.9vh] text-[1.5vw] text-[#79ff86]"><span>THEMNION OS / CAMPUS DESKTOP</span><span>12:48 PM / DAY 04</span></div>
        <div className="relative h-[49vh] bg-[radial-gradient(circle_at_80%_20%,rgba(121,255,134,0.12),transparent_25%),#07130a] p-[1.2vw]">
          <div className="absolute left-[5vw] top-[6vh] w-[32vw]"><Window title="ACADEMY OFFICE"><PanelLabel>WELCOME, MORGAN</PanelLabel><div className="mt-[1.5vh] text-[2vw] text-[#d8ffda]">Choose your next action.</div><div className="mt-[2vh] text-[1.6vw] leading-[1.6] text-[#86aa8b]">[1] Study  [2] Explore  [3] Talk  [4] Stats</div></Window></div>
          <div className="absolute right-[5vw] top-[10vh] w-[25vw]"><Window title="CAMPUS BULLETIN"><div className="text-[1.7vw] leading-[1.55] text-[#ffbd69]"><div>WEEKLY THEME</div><div>SIGNAL / ACTIVE</div><div className="text-[#d8ffda]">Questions are waiting.</div></div></Window></div>
          <div className="absolute bottom-[3vh] left-[1vw] right-[1vw] flex items-center justify-between border-t-[0.12vw] border-[#527659] pt-[1.2vh] text-[1.5vw] text-[#86aa8b]"><span>APPS: OFFICE / CAMPUS / RECORDS</span><span className="text-[#79ff86]">NETWORK: READY</span></div>
        </div>
      </div>
    </SlideFrame>
  );
}