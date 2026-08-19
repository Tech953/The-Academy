/**
 * Static offline world model for The Academy.
 *
 * Mirrors the campus layout and cast seeded server-side
 * (artifacts/api-server/src/storage.ts / procedural/generators.ts) so the
 * mobile companion feels like the same institution, not a separate game.
 */

import type { Archetype } from "./dialogueTemplates";

export type LocationId =
  | "main_lobby"
  | "library_larcen"
  | "cafeteria"
  | "classroom_101"
  | "dormitory_wing";

export interface Interactable {
  id: string;
  label: string;
  description: string;
}

export interface LocationExit {
  id: LocationId;
  label: string;
}

export interface LocationDef {
  id: LocationId;
  name: string;
  type: string;
  description: string;
  exits: LocationExit[];
  interactables: Interactable[];
  npcIds: string[];
}

export interface NpcDef {
  id: string;
  name: string;
  title: string;
  archetype: Archetype;
  faction: string | null;
  locationId: LocationId;
  backstory: string;
}

export const LOCATIONS: Record<LocationId, LocationDef> = {
  main_lobby: {
    id: "main_lobby",
    name: "Main Lobby",
    type: "lobby",
    description:
      "Fluorescent light hums over cracked linoleum tile. Faded portraits of past valedictorians line the walls, their eyes seeming to track anyone who lingers too long near the reception desk.",
    exits: [
      { id: "cafeteria", label: "Cafeteria" },
      { id: "library_larcen", label: "Library (Larcen)" },
      { id: "dormitory_wing", label: "Dormitory Wing" },
    ],
    interactables: [
      {
        id: "portraits",
        label: "Portraits",
        description:
          "Rows of past valedictorians in cheap wooden frames. Someone has scratched a tally mark into the corner of the newest one.",
      },
      {
        id: "reception_desk",
        label: "Reception Desk",
        description:
          "A scarred laminate desk stacked with intake forms, a rotary phone that still works, and a bell nobody rings anymore.",
      },
    ],
    npcIds: ["receptionist_emily"],
  },
  library_larcen: {
    id: "library_larcen",
    name: "Library (Larcen)",
    type: "library",
    description:
      "Dust hangs golden in the light from tall, grime-streaked windows. The card catalog has not been touched by a computer in decades, and the air smells like old glue and older secrets.",
    exits: [{ id: "main_lobby", label: "Main Lobby" }],
    interactables: [
      {
        id: "card_catalog",
        label: "Card Catalog",
        description:
          "Thousands of yellowed index cards, alphabetized by a system only the librarian fully understands.",
      },
      {
        id: "ancient_globe",
        label: "Ancient Globe",
        description:
          "A globe with borders that stopped being accurate before your parents were born. It still spins true, though.",
      },
    ],
    npcIds: ["librarian_sage"],
  },
  cafeteria: {
    id: "cafeteria",
    name: "Academy Cafeteria",
    type: "dining",
    description:
      "Long steel tables, the hiss of a broken vent, and the smell of something frying that might be tomorrow's mystery meat. Conversation ricochets off the tile like static.",
    exits: [{ id: "main_lobby", label: "Main Lobby" }],
    interactables: [
      {
        id: "serving_line",
        label: "Serving Line",
        description:
          "Steam trays of food arranged in a strict, unspoken hierarchy. Nobody questions why the good bread only appears on Fridays.",
      },
      {
        id: "notice_board",
        label: "Notice Board",
        description:
          "A cork board layered with flyers — study groups, lost keys, a faded sign-up sheet for the GED prep circle.",
      },
    ],
    npcIds: ["chef_marcus"],
  },
  classroom_101: {
    id: "classroom_101",
    name: "History Classroom",
    type: "classroom",
    description:
      "Rows of graffiti-carved desks face a chalkboard that has never fully erased clean. A world map curls at the edges, taped back up more times than anyone can count.",
    exits: [{ id: "main_lobby", label: "Main Lobby" }],
    interactables: [
      {
        id: "chalkboard",
        label: "Chalkboard",
        description:
          "Ghost-white outlines of a dozen erased lessons show through the chalk dust, like a palimpsest of every class that came before.",
      },
      {
        id: "antique_globe",
        label: "Antique Globe",
        description:
          "A second globe, smaller than the library's, kept as a teaching prop. Someone has doodled a tiny sea monster in the Pacific.",
      },
    ],
    npcIds: ["professor_dawn"],
  },
  dormitory_wing: {
    id: "dormitory_wing",
    name: "Dormitory Wing",
    type: "dormitory",
    description:
      "Narrow hallways lined with numbered doors, each one personalized with contraband posters and taped-up photographs. The linoleum floor squeaks with every step.",
    exits: [{ id: "main_lobby", label: "Main Lobby" }],
    interactables: [
      {
        id: "room_assignments",
        label: "Room Assignments",
        description:
          "A laminated sheet taped to the wall, listing every resident by room number. A few names have been crossed out and rewritten.",
      },
      {
        id: "banners",
        label: "Faction Banners",
        description:
          "Hand-sewn banners hung by residents over the years, each representing a different Academy faction or long-forgotten inside joke.",
      },
    ],
    npcIds: [],
  },
};

export const NPCS: Record<string, NpcDef> = {
  receptionist_emily: {
    id: "receptionist_emily",
    name: "Emily Carter",
    title: "Front Desk Administrator",
    archetype: "socialite",
    faction: null,
    locationId: "main_lobby",
    backstory:
      "Emily has worked the front desk longer than most students have been alive. She knows every rumor before it happens and every rule well enough to bend it.",
  },
  librarian_sage: {
    id: "librarian_sage",
    name: "Prof. Sage Whitmore",
    title: "Head Librarian",
    archetype: "scholar",
    faction: "Seekers",
    locationId: "library_larcen",
    backstory:
      "Sage catalogs more than books — theories about the Academy's founding, half-true legends, and the occasional genuinely useful study tip.",
  },
  chef_marcus: {
    id: "chef_marcus",
    name: "Marcus Thompson",
    title: "Head Chef",
    archetype: "nurturer",
    faction: "Guardians",
    locationId: "cafeteria",
    backstory:
      "Marcus feeds the whole Academy on a shoestring budget and somehow remembers everyone's favorite dish. People tell him things they wouldn't tell a counselor.",
  },
  professor_dawn: {
    id: "professor_dawn",
    name: "Professor Dawn",
    title: "History Faculty",
    archetype: "mentor",
    faction: null,
    locationId: "classroom_101",
    backstory:
      "Professor Dawn treats every student like they might surprise her, because most of them eventually do. Strict grading, warmer than she lets on.",
  },
};

export const STARTING_LOCATION: LocationId = "main_lobby";
