const base = import.meta.env.BASE_URL;

export default function Slide30ClosingVision() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-[#061008] text-[#d8ffda]">
      <img src={`${base}academy-crt-hero.png`} crossOrigin="anonymous" alt="A CRT workstation in a study room" className="absolute inset-0 h-full w-full object-cover opacity-38" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(4,12,6,0.98)_0%,rgba(4,12,6,0.82)_55%,rgba(4,12,6,0.45)_100%)]" />
      <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent_0,transparent_0.38vh,rgba(121,255,134,0.16)_0.44vh,transparent_0.52vh)] opacity-25" />
      <div className="absolute left-[7vw] top-[8vh] text-[1.6vw] tracking-[0.22em] text-[#ffbd69]">THE ACADEMY / CLOSING VISION</div>
      <div className="absolute left-[7vw] top-[22vh] max-w-[63vw]">
        <div className="text-[1.7vw] tracking-[0.18em] text-[#79ff86]">SYSTEM STATUS / READY FOR THE NEXT CHAPTER</div>
        <h1 className="mt-[2.4vh] text-[6vw] font-bold leading-[0.98] tracking-[-0.09em] text-[#d8ffda] crt-glow"><div>Make the return</div><div>visit worth making.</div></h1>
        <p className="mt-[3vh] max-w-[51vw] text-[2.3vw] leading-[1.35] text-[#b3dcb6]">The Academy is a playable place for GED practice, progress, and the people who help learners keep going.</p>
      </div>
      <div className="absolute bottom-[8vh] left-[7vw] right-[7vw] flex items-end justify-between">
        <div className="text-[1.6vw] tracking-[0.16em] text-[#79ff86]">THE ACADEMY</div>
        <div className="text-right text-[1.5vw] leading-[1.6] text-[#86aa8b]"><div>WEB + ANDROID + API</div><div>PHOSPHOR ARCHIVE / 30 OF 30</div></div>
      </div>
    </div>
  );
}