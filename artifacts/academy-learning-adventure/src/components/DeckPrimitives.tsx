import type { ReactNode } from "react";

export function SlideFrame({ no, eyebrow, title, subtitle, children, dark = false }: { no: string; eyebrow: string; title: string; subtitle?: string; children: ReactNode; dark?: boolean }) {
  return (
    <div className={`w-screen h-screen overflow-hidden relative deck-frame ${dark ? "bg-[#050b07]" : ""}`}>
      <div className="absolute left-[5.5vw] right-[5.5vw] top-[4.2vh] z-10">
        <div className="flex items-center justify-between text-[1.5vw] tracking-[0.18em] text-[#79ff86]"><span>THE ACADEMY / SYSTEM PITCH</span><span className="crt-muted">SLIDE {no} / 30</span></div>
        <div className="mt-[1.8vh] pixel-rule" />
      </div>
      <div className="absolute left-[5.5vw] right-[5.5vw] top-[11vh] bottom-[7vh] z-10">
        <div className="text-[1.6vw] uppercase tracking-[0.17em] text-[#ffbd69]">{eyebrow}</div>
        <h1 className="mt-[1.2vh] max-w-[82vw] text-[3.7vw] font-bold leading-[1.06] tracking-[-0.055em] text-[#d8ffda] crt-glow">{title}</h1>
        {subtitle ? <p className="mt-[1.4vh] max-w-[78vw] text-[2vw] leading-[1.35] text-[#9cc7a0]">{subtitle}</p> : null}
        <div className="mt-[4vh] h-[56vh] overflow-hidden">{children}</div>
      </div>
      <div className="absolute bottom-[2.5vh] left-[5.5vw] right-[5.5vw] z-10 flex justify-between text-[1.5vw] tracking-[0.12em] text-[#527659]"><span>GED ACADEMIC RPG</span><span>PHOSPHOR ARCHIVE / 1980s INSTITUTIONAL COMPUTER</span></div>
    </div>
  );
}

export function Bullet({ children, color = "green" }: { children: ReactNode; color?: "green" | "amber" | "cyan" }) {
  const colorClass = color === "amber" ? "text-[#ffbd69]" : color === "cyan" ? "text-[#82f2f6]" : "text-[#79ff86]";
  return <div className="flex items-start gap-[1vw] text-[2vw] leading-[1.35] text-[#d8ffda]"><span className={`${colorClass} mt-[0.15vh]`}>›</span><span>{children}</span></div>;
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`crt-surface p-[1.5vw] ${className}`}>{children}</div>;
}

export function PanelLabel({ children, color = "green" }: { children: ReactNode; color?: "green" | "amber" | "cyan" }) {
  const colorClass = color === "amber" ? "text-[#ffbd69]" : color === "cyan" ? "text-[#82f2f6]" : "text-[#79ff86]";
  return <div className={`${colorClass} text-[1.5vw] uppercase tracking-[0.14em]`}>{children}</div>;
}

export function Window({ title, children, className = "" }: { title: string; children: ReactNode; className?: string }) {
  return <div className={`crt-border bg-[#07130a]/90 ${className}`}><div className="flex items-center justify-between border-b-[0.12vw] border-[#79ff86]/35 bg-[#0d2312] px-[1.1vw] py-[0.85vh] text-[1.5vw] tracking-[0.1em] text-[#79ff86]"><span>{title}</span><span className="text-[#527659]">[—] [□] [×]</span></div><div className="p-[1.2vw]">{children}</div></div>;
}

export function ProgressBar({ value, tone = "green" }: { value: "low" | "mid" | "high"; tone?: "green" | "amber" | "cyan" }) {
  const width = value === "low" ? "w-[34%]" : value === "mid" ? "w-[62%]" : "w-[86%]";
  const color = tone === "amber" ? "bg-[#ffbd69]" : tone === "cyan" ? "bg-[#82f2f6]" : "bg-[#79ff86]";
  return <div className="h-[1.2vh] border-[0.1vw] border-[#527659] bg-[#061008]"><div className={`h-full ${width} ${color}`} /></div>;
}

export function Phone({ children }: { children: ReactNode }) {
  return <div className="mx-auto w-[20vw] rounded-[1.4vw] border-[0.35vw] border-[#2f5237] bg-[#020603] p-[0.7vw] shadow-[0_0_3vw_rgba(121,255,134,0.14)]"><div className="rounded-[0.7vw] border-[0.12vw] border-[#79ff86]/40 bg-[#07130a] p-[1vw]"><div className="mb-[1.2vh] flex justify-between text-[1.35vw] text-[#527659]"><span>ACADEMY</span><span>OFFLINE</span></div>{children}</div><div className="mx-auto mt-[0.8vh] h-[0.35vh] w-[4vw] rounded-full bg-[#2f5237]" /></div>;
}

export function TinyCode({ children }: { children: ReactNode }) {
  return <div className="font-mono text-[1.6vw] leading-[1.45] text-[#9cc7a0]">{children}</div>;
}

export function Arrow() {
  return <div className="text-center text-[2.5vw] text-[#ffbd69]">→</div>;
}