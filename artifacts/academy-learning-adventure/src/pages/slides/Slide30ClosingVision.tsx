const base = import.meta.env.BASE_URL;

export default function Slide30ClosingVision() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-[#061008] text-[#d8ffda]">
      <img src={`${base}academy-crt-hero.png`} crossOrigin="anonymous" alt="A CRT workstation in a study room" className="absolute inset-0 h-full w-full object-cover opacity-38" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(4,12,6,0.98)_0%,rgba(4,12,6,0.82)_55%,rgba(4,12,6,0.45)_100%)]" />
      <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent_0,transparent_0.38vh,rgba(121,255,134,0.16)_0.44vh,transparent_0.52vh)] opacity-25" />
      <div className="absolute left-[7vw] right-[7vw] top-[8vh] flex justify-between text-[1.6vw] tracking-[0.22em]">
        <span className="text-[#ffbd69]">THE ACADEMY / CLOSING VISION</span>
        <span className="text-[#79ff86]">CORE PATH · 12/12</span>
      </div>
      <div className="absolute left-[7vw] top-[22vh] max-w-[63vw]">
        <div className="text-[1.7vw] tracking-[0.18em] text-[#79ff86]">DESIGN GOAL / CONNECT THE NEXT STEP</div>
        <h1 className="mt-[2.4vh] text-[6vw] font-bold leading-[0.98] tracking-[-0.09em] text-[#d8ffda] crt-glow"><div>Build a place</div><div>worth returning to.</div></h1>
        <p className="mt-[3vh] max-w-[51vw] text-[2.3vw] leading-[1.35] text-[#b3dcb6]">Bring GED practice, campus exploration, and visible game state into one experience—then test what helps learners continue.</p>
      </div>
      <div className="absolute bottom-[8vh] left-[7vw] right-[7vw] flex items-end justify-between">
        <div className="text-[1.6vw] tracking-[0.16em] text-[#79ff86]">THE ACADEMY</div>
        <div className="text-right text-[1.5vw] leading-[1.6] text-[#86aa8b]"><div>SURFACES IN CODE: WEB + MOBILE + API</div><div>CORE TALK ENDS HERE / OPTIONAL SLIDES FOLLOW</div></div>
      </div>
    </div>
  );
}