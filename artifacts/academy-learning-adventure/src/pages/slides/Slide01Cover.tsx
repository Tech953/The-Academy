const base = import.meta.env.BASE_URL;

export default function Slide01Cover() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-[#061008] text-[#d8ffda]">
      <img
        src={`${base}academy-crt-hero.png`}
        crossOrigin="anonymous"
        alt="A CRT workstation in a study room"
        className="absolute inset-0 h-full w-full object-cover opacity-70"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(4,12,6,0.98)_0%,rgba(4,12,6,0.82)_44%,rgba(4,12,6,0.28)_100%)]" />
      <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent_0,transparent_0.38vh,rgba(121,255,134,0.16)_0.44vh,transparent_0.52vh)] opacity-25" />
      <div className="absolute left-[7vw] top-[8vh] text-[1.6vw] tracking-[0.22em] text-[#ffbd69]">THE ACADEMY / SYSTEM PITCH</div>
      <div className="absolute left-[7vw] top-[22vh] max-w-[54vw]">
        <div className="text-[1.7vw] tracking-[0.18em] text-[#79ff86]">BOOT SEQUENCE 01.1984 // READY</div>
        <h1 className="mt-[2.6vh] text-[7vw] font-bold leading-[0.94] tracking-[-0.09em] text-[#d8ffda] crt-glow">The Academy</h1>
        <p className="mt-[3vh] max-w-[45vw] text-[2.4vw] leading-[1.3] text-[#b3dcb6]">A GED-focused academic RPG wrapped in a retro CRT desktop adventure.</p>
      </div>
      <div className="absolute bottom-[9vh] left-[7vw] right-[7vw] flex items-end justify-between">
        <div className="text-[1.55vw] tracking-[0.15em] text-[#86aa8b]">STUDY / EXPLORE / PROGRESS</div>
        <div className="text-right text-[1.5vw] leading-[1.6] text-[#86aa8b]">
          <div className="text-[#79ff86]">ACADEMY NETWORK LINKED</div>
          <div>WEB + ANDROID + API</div>
        </div>
      </div>
    </div>
  );
}