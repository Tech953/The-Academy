import { Panel, PanelLabel, SlideFrame, Window } from "../../components/DeckPrimitives";

export default function Slide12AssignmentsQuizzes() {
  return (
    <SlideFrame no="12" eyebrow="11 / PRACTICE" title="Assignments and quizzes make the learning state tangible">
      <div className="grid h-full min-h-0 grid-cols-[1fr_1fr] gap-[2.4vw]">
        <div className="paper-terminal relative min-h-0 overflow-hidden p-[2vw] text-[#122014]">
          <div className="text-[1.5vw] tracking-[0.16em] text-[#45634b]">ACADEMY RECORD / ASSIGNMENT</div>
          <div className="mt-[3vh] text-[3.2vw] font-bold leading-[1.05]">Reading the room</div>
          <div className="mt-[2.5vh] text-[1.9vw] leading-[1.45]">A task can sit inside the world as an object to pick up, inspect, and finish.</div>
          <div className="absolute bottom-[2vw] left-[2vw] right-[2vw] border-t-[0.12vw] border-[#78917b] pt-[1.4vh] text-[1.6vw] text-[#45634b]">STATUS / READY FOR REVIEW</div>
        </div>
        <Window title="QUIZ TERMINAL / MATH" className="min-h-0 overflow-hidden">
          <PanelLabel color="amber">QUESTION 03 / 05</PanelLabel>
          <div className="mt-[1.6vh] text-[2.1vw] leading-[1.3] text-[#d8ffda]">Which operation preserves equality on both sides?</div>
          <div className="mt-[1.8vh] space-y-[0.8vh] text-[1.8vw] text-[#9cc7a0]">
            <div className="border-[0.12vw] border-[#527659] p-[0.6vw]">A / Divide one side only</div>
            <div className="border-[0.12vw] border-[#79ff86] bg-[#79ff86]/10 p-[0.6vw] text-[#79ff86]">B / Add the same value</div>
            <div className="border-[0.12vw] border-[#527659] p-[0.6vw]">C / Change the variable</div>
          </div>
          <div className="mt-[1.6vh] text-[1.6vw] text-[#86aa8b]">ANSWER LOGGED / EXPLANATION AVAILABLE</div>
        </Window>
      </div>
    </SlideFrame>
  );
}