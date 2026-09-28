import type { ComponentProps } from "react";
import type { TerminalLine as GameStateTerminalLine } from "./gameState";
import type { TerminalLine } from "./terminalLine";

type IsExactly<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
type Assert<T extends true> = T;

export type TerminalLineKeepsNarrative = Assert<
  "narrative" extends TerminalLine["type"] ? true : false
>;

export type GameStateReexportsSharedTerminalLine = Assert<
  IsExactly<GameStateTerminalLine, TerminalLine>
>;

export type AcademyGameLayoutUsesSharedTerminalLine = Assert<
  IsExactly<
    ComponentProps<typeof import("../components/AcademyGameLayout").default>["terminalLines"],
    TerminalLine[]
  >
>;

export type TerminalInterfaceUsesSharedTerminalLine = Assert<
  IsExactly<
    ComponentProps<typeof import("../components/TerminalInterface").default>["lines"],
    TerminalLine[]
  >
>;