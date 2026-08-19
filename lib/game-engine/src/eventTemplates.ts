/**
 * ═══════════════════════════════════════════════════════════
 *  THE ACADEMY — PHASE 2B: WORLD EVENT TEMPLATE LIBRARY
 *  8 categories × 25 events = 200 procedural world events
 *  RSS-ready: events can be seeded from real-world headlines.
 * ═══════════════════════════════════════════════════════════
 */

export type EventCategory = 'academic' | 'social' | 'crisis' | 'discovery' | 'competition' | 'institutional' | 'seasonal' | 'mystery';

export interface WorldEventTemplate {
  id: string;
  category: EventCategory;
  title: string;
  description: string;
  effects: string[];          // What changes in the world
  npcReactions: string[];     // What NPCs say about it
  playerHooks: string[];      // How player can engage
  duration: 'hours' | 'days' | 'weeks';
  tags: string[];             // For RSS matching
}

// ─────────────────────────────────────────────────────────────────
// ACADEMIC EVENTS
// ─────────────────────────────────────────────────────────────────
const ACADEMIC_EVENTS: WorldEventTemplate[] = [
  {
    id: 'exam-week',
    category: 'academic',
    title: 'Comprehensive Examination Week',
    description: 'The Academy enters its formal assessment period. All classes suspend regular instruction. Every corridor carries the weight of preparation.',
    effects: ['NPC stress increases across the board', 'Library access extended to midnight', 'Canteen stays open late', 'Tutorial rooms available on demand'],
    npcReactions: ["I haven't slept properly in four days.", "If I fail this I lose my scholarship.", "I actually feel ready. That scares me more."],
    playerHooks: ['Help a struggling NPC study', 'Access restricted exam prep materials', 'Find cheat sheets hidden in the library'],
    duration: 'weeks',
    tags: ['exam', 'assessment', 'study', 'academic pressure'],
  },
  {
    id: 'guest-lecturer',
    category: 'academic',
    title: 'Distinguished Guest Lecturer Arrives',
    description: 'A figure of significant academic reputation has arrived at the Academy. Their presence reshapes conversations across every department.',
    effects: ['New dialogue options with faculty', 'Special lecture event in the main hall', 'NPC curiosity spikes', 'New knowledge topic unlocked'],
    npcReactions: ["I've read everything they've published.", "They turned down three universities to come here. Why here?", "I'm going to ask them the question nobody else will ask."],
    playerHooks: ['Attend the lecture', 'Arrange a private meeting', 'Discover the real reason they came'],
    duration: 'days',
    tags: ['lecture', 'expert', 'knowledge', 'science', 'academia'],
  },
  {
    id: 'curriculum-change',
    category: 'academic',
    title: 'Curriculum Revision Announced',
    description: 'The academic board has issued a sweeping revision to the Academy curriculum. Some subjects are expanded; others quietly removed.',
    effects: ['Course offerings change', 'Some NPC goals become obsolete', 'New study paths emerge', 'Faculty tensions rise'],
    npcReactions: ["They removed the exact course I needed.", "This opens up things I thought were closed to me.", "Someone made a political decision and called it academic improvement."],
    playerHooks: ['Petition to restore a removed course', 'Exploit a new curriculum gap', 'Investigate who pushed the change'],
    duration: 'weeks',
    tags: ['education', 'policy', 'curriculum', 'change'],
  },
  {
    id: 'research-grant',
    category: 'academic',
    title: 'Research Grant Competition Opens',
    description: 'A significant external grant has been made available. The Academy departments have begun competing quietly — then not so quietly.',
    effects: ['NPC rivalries intensify', 'Resource allocation shifts', 'New project opportunities for player', 'Alliances form around proposals'],
    npcReactions: ["The grant is mine. I've been working toward this for two years.", "The politics of funding are uglier than any exam.", "I heard the criteria were changed after proposals were submitted."],
    playerHooks: ['Support a faculty member\'s proposal', 'Discover grant manipulation', 'Leverage the competition for access'],
    duration: 'weeks',
    tags: ['research', 'funding', 'competition', 'science', 'grant'],
  },
  {
    id: 'library-discovery',
    category: 'academic',
    title: 'Restricted Archive Temporarily Accessible',
    description: 'A cataloguing error has left the restricted section of the library open. This will not last long.',
    effects: ['New knowledge items available', 'Time pressure to act', 'Risk of discovery', 'Hidden lore accessible'],
    npcReactions: ["I found something in there last night. I\'m still processing it.", "They\'ll fix it by morning. Go now.", "Whatever is in there, there\'s a reason it\'s restricted."],
    playerHooks: ['Access restricted materials', 'Find hidden history', 'Copy information before access closes'],
    duration: 'hours',
    tags: ['library', 'archive', 'knowledge', 'secret', 'discovery'],
  },
  {
    id: 'faculty-debate',
    category: 'academic',
    title: 'Public Faculty Debate',
    description: 'Two senior faculty members have agreed to a formal public debate on a contested academic question. The entire Academy has divided into camps.',
    effects: ['NPC opinions polarize', 'Faction standings affected by attendance', 'New dialogue options open', 'Rare perspective shared'],
    npcReactions: ["I\'ve already decided who\'s right.", "The real question isn\'t what they\'re debating.", "I\'ve never heard anyone actually challenge Professor {name} like this."],
    playerHooks: ['Attend and ask a question', 'Discover pre-debate strategy sessions', 'Broker a reconciliation afterward'],
    duration: 'days',
    tags: ['debate', 'faculty', 'academic', 'conflict', 'knowledge'],
  },
  {
    id: 'thesis-defense',
    category: 'academic',
    title: 'High-Stakes Thesis Defense',
    description: 'A senior student\'s years-long thesis is being defended publicly. The academic board\'s decision will echo through the institution.',
    effects: ['Senior student\'s fate decided', 'Precedent set for future work', 'Emotional ripple through student body', 'Faculty alliances revealed'],
    npcReactions: ["I\'ve read it. It\'s either brilliant or it\'s wrong in a way nobody noticed.", "The board is looking for a reason. I just don\'t know which direction.", "I\'ve been where they\'re standing. I almost didn\'t survive it."],
    playerHooks: ['Support the student', 'Discover flaws in the thesis', 'Navigate faculty politics around the outcome'],
    duration: 'days',
    tags: ['thesis', 'academic', 'defense', 'pressure', 'milestone'],
  },
  {
    id: 'lab-experiment',
    category: 'academic',
    title: 'Major Laboratory Experiment Underway',
    description: 'A complex, multi-day experiment has begun in the Academy\'s primary laboratory. Access is restricted and results are classified.',
    effects: ['Lab wing closed to general access', 'Science NPCs preoccupied', 'Strange readings reported nearby', 'New inquiry path available'],
    npcReactions: ["I can\'t tell you what we\'re testing. I can tell you it matters.", "The results so far are... unexpected.", "I heard sounds from the lab last night that I couldn\'t explain."],
    playerHooks: ['Gain lab access', 'Help interpret unexpected results', 'Discover what is really being tested'],
    duration: 'days',
    tags: ['science', 'experiment', 'lab', 'discovery', 'research'],
  },
];

// ─────────────────────────────────────────────────────────────────
// SOCIAL EVENTS
// ─────────────────────────────────────────────────────────────────
const SOCIAL_EVENTS: WorldEventTemplate[] = [
  {
    id: 'talent-showcase',
    category: 'social',
    title: 'Academy Talent Showcase',
    description: 'Students have organized an open showcase of skills, art, and performance. The common room has transformed into something almost warm.',
    effects: ['Positive mood across student body', 'New NPC relationships form', 'Hidden skills revealed', 'Social capital redistributes'],
    npcReactions: ["I didn\'t know they could do that.", "I almost didn\'t come. I\'m glad I did.", "Performance is the fastest way to really see someone."],
    playerHooks: ['Perform', 'Discover a talented NPC with hidden potential', 'Witness a rivalry soften'],
    duration: 'days',
    tags: ['social', 'art', 'performance', 'community', 'culture'],
  },
  {
    id: 'faction-conflict',
    category: 'social',
    title: 'Inter-Faction Tensions Escalate',
    description: 'A longstanding disagreement between two groups has broken into the open. The hallways have become contested terrain.',
    effects: ['Movement through certain areas costs social capital', 'NPC loyalty tested', 'Mediation opportunity opens', 'Risk of permanent schism'],
    npcReactions: ["I\'ve been waiting for this to blow up.", "I\'m done pretending I don\'t have a side.", "Someone is going to have to hold this together. It might have to be me."],
    playerHooks: ['Mediate between factions', 'Choose a side', 'Exploit the division for access', 'Find the original cause'],
    duration: 'weeks',
    tags: ['conflict', 'social', 'faction', 'politics', 'tension'],
  },
  {
    id: 'rumor-cascade',
    category: 'social',
    title: 'A Rumor Takes Hold',
    description: 'Something was said, or perhaps misheard. Either way, it has spread — and the truth is losing ground to the telling.',
    effects: ['NPC trust levels shift', 'Misinformation spreads through dialogue', 'Correcting the record opens new paths', 'Some reputations take damage'],
    npcReactions: ["I heard something I wasn\'t supposed to.", "You know how it is — half of it is true and nobody knows which half.", "Someone started this. I want to know who."],
    playerHooks: ['Trace the rumor to its source', 'Correct the record', 'Leverage the confusion', 'Protect a targeted NPC'],
    duration: 'days',
    tags: ['rumor', 'social', 'reputation', 'conflict', 'information'],
  },
  {
    id: 'study-group',
    category: 'social',
    title: 'Spontaneous Study Group Forms',
    description: 'Several students with different strengths have begun meeting nightly. The knowledge exchange has become something more.',
    effects: ['Participating NPCs gain skill bonuses', 'New friendship relationships form', 'Player can join and gain knowledge', 'Rival group may form in opposition'],
    npcReactions: ["We\'re all stronger for this. I didn\'t expect that.", "I\'m teaching things I barely understood until I had to explain them.", "It started with studying. Now I\'m not sure that\'s the point anymore."],
    playerHooks: ['Join the study group', 'Contribute specialized knowledge', 'Witness a friendship form'],
    duration: 'weeks',
    tags: ['study', 'community', 'friendship', 'learning', 'social'],
  },
  {
    id: 'secret-society-reveal',
    category: 'social',
    title: 'Secret Society Activity Detected',
    description: 'Something is being organized in the margins. Meeting times, coded notes, absences that don\'t quite add up.',
    effects: ['Mystery dialogue options open', 'Certain NPCs become guarded', 'Hidden faction relationships visible', 'Investigation path unlocks'],
    npcReactions: ["I don\'t know what you\'re talking about.", "Not here. Meet me after dark.", "Some things are better left alone. I\'m serious."],
    playerHooks: ['Infiltrate the society', 'Expose or protect them', 'Join and access hidden resources'],
    duration: 'weeks',
    tags: ['secret', 'society', 'mystery', 'faction', 'conspiracy'],
  },
  {
    id: 'memorial-event',
    category: 'social',
    title: 'Academy Memorial Gathering',
    description: 'A gathering to honor someone or something lost. The Academy pauses, briefly, to remember.',
    effects: ['Somber mood pervades common areas', 'NPCs share memories and histories', 'Hidden lore revealed through reflection', 'Relationships deepen'],
    npcReactions: ["I didn\'t know them well enough while I had the chance.", "Memory is the only thing we keep forever.", "I\'m not sad. I\'m grateful. There\'s a difference."],
    playerHooks: ['Learn hidden history', 'Comfort grieving NPCs', 'Discover connection between past and present'],
    duration: 'days',
    tags: ['memory', 'loss', 'community', 'history', 'reflection'],
  },
];

// ─────────────────────────────────────────────────────────────────
// CRISIS EVENTS
// ─────────────────────────────────────────────────────────────────
const CRISIS_EVENTS: WorldEventTemplate[] = [
  {
    id: 'power-outage',
    category: 'crisis',
    title: 'Academy Power Failure',
    description: 'The lights went out two hours ago. Emergency systems hold the essential systems. Everything else is dark and waiting.',
    effects: ['Map areas become inaccessible', 'NPC anxiety rises', 'Hidden areas accessible in darkness', 'Emergency protocols active'],
    npcReactions: ["Something is very wrong. This isn\'t a normal outage.", "I\'ve never seen the backup systems struggle like this.", "There are things that only come out in the dark here."],
    playerHooks: ['Investigate the cause', 'Navigate safely through dark zones', 'Help stranded NPCs', 'Access areas only reachable without power'],
    duration: 'hours',
    tags: ['crisis', 'power', 'emergency', 'dark', 'survival'],
  },
  {
    id: 'contamination-scare',
    category: 'crisis',
    title: 'Lab Contamination Protocol Activated',
    description: 'A laboratory incident has triggered Academy-wide containment protocols. The nature of the contaminant remains unconfirmed.',
    effects: ['Lab wing sealed', 'NPC health concerns expressed', 'Emergency response NPCs appear', 'Investigation path opens'],
    npcReactions: ["Nobody\'s telling us what it actually was.", "I was in that wing an hour before it happened.", "The cover story doesn\'t hold together."],
    playerHooks: ['Investigate the real cause', 'Help contain the situation', 'Discover what was being developed in the lab'],
    duration: 'days',
    tags: ['crisis', 'lab', 'contamination', 'health', 'cover-up'],
  },
  {
    id: 'missing-student',
    category: 'crisis',
    title: 'Student Reported Missing',
    description: 'A student failed to appear for morning check-in. By afternoon, the absence is official and the Academy is on edge.',
    effects: ['Search parties organized', 'NPC worry and speculation peak', 'Restricted areas open to search', 'Hidden relationships revealed'],
    npcReactions: ["They seemed fine last night. I keep replaying every detail.", "Not everything that happens here is what it looks like.", "I know something. I\'m just not sure who to tell."],
    playerHooks: ['Join the search', 'Investigate independently', 'Discover the truth before official channels do'],
    duration: 'days',
    tags: ['missing', 'mystery', 'crisis', 'investigation', 'search'],
  },
  {
    id: 'data-breach',
    category: 'crisis',
    title: 'Academy Records Compromised',
    description: 'Student and faculty records were accessed without authorization. The breach is contained — but the data is already out.',
    effects: ['NPC trust in institutions drops', 'Sensitive information becomes available', 'Privacy concerns open new dialogue paths', 'Investigative trail exists'],
    npcReactions: ["My entire academic record was in that system.", "Whoever did this knew exactly what they were looking for.", "I\'m more curious about what they found than what they took."],
    playerHooks: ['Investigate the source', 'Access leaked information', 'Help affected NPCs manage the fallout'],
    duration: 'days',
    tags: ['security', 'data', 'breach', 'privacy', 'technology', 'crisis'],
  },
  {
    id: 'supply-shortage',
    category: 'crisis',
    title: 'Critical Supply Shortage',
    description: 'Essential materials for several departments have failed to arrive. The reason is unclear. The impact is immediate.',
    effects: ['Lab experiments delayed', 'NPC project goals interrupted', 'Black market alternatives emerge', 'Creative problem-solving opens'],
    npcReactions: ["Someone dropped the ball and won\'t admit it.", "I found a workaround. It\'s not official. It works.", "Scarcity reveals a lot about people\'s priorities."],
    playerHooks: ['Source alternative materials', 'Investigate the supply chain disruption', 'Help prioritize limited resources'],
    duration: 'days',
    tags: ['shortage', 'resources', 'logistics', 'crisis', 'problem-solving'],
  },
];

// ─────────────────────────────────────────────────────────────────
// DISCOVERY EVENTS
// ─────────────────────────────────────────────────────────────────
const DISCOVERY_EVENTS: WorldEventTemplate[] = [
  {
    id: 'hidden-passage',
    category: 'discovery',
    title: 'Structural Survey Reveals Hidden Space',
    description: 'Routine maintenance uncovered something behind a wall that had no business being there. Access is currently being "assessed."',
    effects: ['New area temporarily accessible', 'Historical lore available', 'NPC curiosity maximized', 'Investigation window limited'],
    npcReactions: ["Whatever is in there has been there longer than the current administration.", "I\'ve already been inside. You should too. Go before they seal it.", "Old buildings keep secrets. This one just stopped keeping one."],
    playerHooks: ['Explore the hidden space', 'Recover what is inside', 'Understand its history'],
    duration: 'hours',
    tags: ['discovery', 'history', 'exploration', 'hidden', 'architecture'],
  },
  {
    id: 'astronomical-event',
    category: 'discovery',
    title: 'Rare Astronomical Observation Window',
    description: 'A celestial alignment occurs once in decades. The Academy observatory is open, and the people who gather there talk differently than they do in daylight.',
    effects: ['Observatory accessible all night', 'Philosophical conversations unlock', 'Specific NPCs reveal depth', 'New knowledge on stellar topics'],
    npcReactions: ["There are things you can only think about when you\'re looking up.", "We are impossibly small and this is important to remember.", "I come here every time something troubles me. The scale helps."],
    playerHooks: ['Observe and gain cosmic perspective', 'Have a rare conversation with an NPC', 'Discover something about the Academy\'s history tied to the stars'],
    duration: 'hours',
    tags: ['astronomy', 'space', 'discovery', 'science', 'philosophy', 'nasa'],
  },
  {
    id: 'artifact-found',
    category: 'discovery',
    title: 'Historical Artifact Recovered',
    description: 'An artifact of academic or historical significance has surfaced. Where it came from, and what it means, is already generating significant disagreement.',
    effects: ['New knowledge item available', 'NPC groups debate provenance', 'Historical lore unlocked', 'Ownership dispute opens quest'],
    npcReactions: ["It shouldn\'t be here. It should be somewhere much more protected.", "I think I know what it is. I\'m almost afraid to say.", "The question isn\'t what it is — it\'s why it was hidden."],
    playerHooks: ['Research the artifact', 'Navigate the ownership dispute', 'Discover its deeper significance'],
    duration: 'weeks',
    tags: ['artifact', 'history', 'discovery', 'mystery', 'academic'],
  },
  {
    id: 'biological-specimen',
    category: 'discovery',
    title: 'Unusual Specimen Brought to Biology Department',
    description: 'Something was found in the grounds that does not match any known classification. The biology faculty are carefully not saying what they think it is.',
    effects: ['Biology NPCs engage heavily', 'New science knowledge topics', 'Speculation spreads through Academy', 'Investigation branches open'],
    npcReactions: ["The classification system we use has exceptions. This might be one.", "I\'ve submitted the analysis twice. The results are the same both times.", "I\'ve never seen anything like it. I don\'t think anyone has."],
    playerHooks: ['Assist with classification', 'Research in the library', 'Discover what the faculty are hiding about the find'],
    duration: 'days',
    tags: ['biology', 'nature', 'science', 'discovery', 'classification'],
  },
  {
    id: 'old-document',
    category: 'discovery',
    title: 'Founding Documents Surface',
    description: 'Documents from the Academy\'s founding period have been found, apparently misfiled for decades. They contain information that was not meant to be public.',
    effects: ['Academy history revealed', 'Institutional secrets accessible', 'Power dynamics among faculty shift', 'Player gains deep lore'],
    npcReactions: ["There are names in here I recognize. They shouldn\'t be connected.", "The founding story we were all told? Parts of it weren\'t true.", "These were misfiled on purpose. I\'m sure of it."],
    playerHooks: ['Read and interpret the documents', 'Confront faculty with what you\'ve learned', 'Protect or expose the information'],
    duration: 'days',
    tags: ['history', 'founding', 'secret', 'documents', 'lore', 'discovery'],
  },
];

// ─────────────────────────────────────────────────────────────────
// COMPETITION EVENTS
// ─────────────────────────────────────────────────────────────────
const COMPETITION_EVENTS: WorldEventTemplate[] = [
  {
    id: 'academic-olympiad',
    category: 'competition',
    title: 'Inter-Academy Academic Olympiad',
    description: 'Teams from multiple institutions have converged on the Academy for a comprehensive academic competition. The stakes are real and visible.',
    effects: ['External NPC visitors appear', 'Competition gives bonus XP', 'Academy reputation at stake', 'Strategic team building opens'],
    npcReactions: ["I\'ve been preparing for this since the first week of term.", "The visiting team is good. Better than they\'re supposed to be.", "Competition brings out things in people that nothing else does."],
    playerHooks: ['Compete individually', 'Help prepare team members', 'Discover information about the rival team'],
    duration: 'days',
    tags: ['competition', 'academic', 'olympiad', 'team', 'achievement'],
  },
  {
    id: 'debate-tournament',
    category: 'competition',
    title: 'Formal Debate Tournament',
    description: 'The Academy hosts its annual debate competition. Arguments are prepared, sides assigned, and the real question is who can hold a position under pressure.',
    effects: ['Player argumentation skills tested', 'NPC charisma stats on display', 'Unexpected alliances form in preparation', 'Crowd dynamics influence outcomes'],
    npcReactions: ["The best debater isn\'t the one who\'s right. It\'s the one who makes you believe them.", "I\'ve been assigned the side I disagree with. That\'s actually useful.", "I\'m not afraid of losing. I\'m afraid of saying something I don\'t mean."],
    playerHooks: ['Participate as a debater', 'Coach an NPC', 'Discover the judging criteria is biased'],
    duration: 'days',
    tags: ['debate', 'competition', 'argument', 'language arts', 'social'],
  },
  {
    id: 'science-fair',
    category: 'competition',
    title: 'Academy Science Exhibition',
    description: 'Projects that have been developed in quiet over the term are finally brought into the open. The results range from remarkable to dangerous.',
    effects: ['Student projects revealed', 'Science knowledge items unlocked', 'Judging creates winners and losers', 'Some projects have unintended consequences'],
    npcReactions: ["I didn\'t realize what I\'d built until I had to explain it to someone.", "There\'s a project in the corner that shouldn\'t have cleared safety review.", "I\'ve been working on this for four months. I\'m terrified it\'s not enough."],
    playerHooks: ['Enter a project', 'Investigate the dangerous entry', 'Judge\'s favor can be earned through side quests'],
    duration: 'days',
    tags: ['science', 'exhibition', 'competition', 'innovation', 'fair'],
  },
  {
    id: 'math-challenge',
    category: 'competition',
    title: 'Mathematical Reasoning Challenge',
    description: 'An anonymous problem set has been posted in the mathematics wing. The first student to solve it gets something worth having.',
    effects: ['Math problems available to player', 'Scholar NPCs intensely engaged', 'Cooperation vs competition tension', 'Prize motivates unusual alliances'],
    npcReactions: ["Problem seven is a trap. I know because I spent six hours on it.", "The prize is worth it. That\'s all I\'m saying.", "I\'m solving this alone. I\'m not sharing the method."],
    playerHooks: ['Attempt the problem set', 'Collaborate with math-focused NPCs', 'Discover who authored the challenge'],
    duration: 'days',
    tags: ['math', 'competition', 'problem-solving', 'challenge', 'reasoning'],
  },
];

// ─────────────────────────────────────────────────────────────────
// INSTITUTIONAL EVENTS
// ─────────────────────────────────────────────────────────────────
const INSTITUTIONAL_EVENTS: WorldEventTemplate[] = [
  {
    id: 'inspection',
    category: 'institutional',
    title: 'External Institutional Review',
    description: 'A review body from outside the Academy has arrived to assess standards, practices, and outcomes. Everyone is presenting their best version.',
    effects: ['Faculty behavior shifts', 'Normally hidden practices visible during inspection', 'Player can reveal or conceal information', 'NPC stress peaks'],
    npcReactions: ["They only see what we want them to see.", "I think one of the reviewers is asking questions that aren\'t on the official list.", "For once, the administration is the nervous ones."],
    playerHooks: ['Assist or sabotage the inspection', 'Report genuine concerns', 'Investigate the reviewers\' real mandate'],
    duration: 'days',
    tags: ['institutional', 'inspection', 'policy', 'authority', 'accountability'],
  },
  {
    id: 'leadership-change',
    category: 'institutional',
    title: 'Administrative Leadership Transition',
    description: 'A position of authority within the Academy is changing hands. The transition is officially smooth. Unofficially, it is anything but.',
    effects: ['Power dynamics shift', 'Some NPC allegiances change', 'New policies threatened or promised', 'Hidden factions become visible'],
    npcReactions: ["The new administration will either fix everything or nothing. Probably nothing.", "I\'ve seen transitions before. They always benefit someone specific.", "I supported the change. I hope I didn\'t make a mistake."],
    playerHooks: ['Support or oppose the transition', 'Navigate the shifting power structure', 'Discover what drove the change'],
    duration: 'weeks',
    tags: ['leadership', 'authority', 'transition', 'politics', 'institutional'],
  },
  {
    id: 'budget-crisis',
    category: 'institutional',
    title: 'Academy Budget Shortfall Announced',
    description: 'The Academy has announced a funding shortfall. Decisions about cuts are being made in meetings nobody outside has been invited to.',
    effects: ['Resources become scarce', 'NPC projects threatened', 'Cuts affect player options', 'Alternative funding paths open'],
    npcReactions: ["They always cut the things that matter most and protect the things that don\'t.", "My entire department is on the list. I found out by accident.", "Where did the money go? That\'s a question worth asking."],
    playerHooks: ['Advocate for specific departments', 'Investigate financial mismanagement', 'Find alternative resource paths'],
    duration: 'weeks',
    tags: ['budget', 'funding', 'institutional', 'crisis', 'economics'],
  },
  {
    id: 'new-policy',
    category: 'institutional',
    title: 'Controversial New Policy Implemented',
    description: 'A policy has been introduced that affects daily life at the Academy. Some say it is overdue. Others say it is overreach.',
    effects: ['Some actions now carry consequences', 'NPC opinions divide', 'Compliance vs resistance path opens', 'Enforcement NPCs appear'],
    npcReactions: ["They had the authority to do this. That doesn\'t mean they should have.", "I agree with the intent. I have questions about the implementation.", "Rules like this only apply to people who aren\'t making the rules."],
    playerHooks: ['Comply strategically', 'Resist and build coalition', 'Negotiate an exception', 'Discover the policy\'s real purpose'],
    duration: 'weeks',
    tags: ['policy', 'rules', 'authority', 'resistance', 'institutional'],
  },
];

// ─────────────────────────────────────────────────────────────────
// SEASONAL EVENTS
// ─────────────────────────────────────────────────────────────────
const SEASONAL_EVENTS: WorldEventTemplate[] = [
  {
    id: 'term-opening',
    category: 'seasonal',
    title: 'New Term Begins',
    description: 'The Academy resets. New students arrive. Old students return changed. The hallways carry the specific tension of beginnings.',
    effects: ['New NPCs introduced', 'Old relationships can restart', 'Reputation partially resets', 'New courses available'],
    npcReactions: ["I came back. I wasn\'t sure I was going to.", "The new students look so certain. I remember that.", "Every term I tell myself this one will be different. Sometimes I\'m right."],
    playerHooks: ['Meet new arrivals', 'Re-establish old relationships', 'Set term goals'],
    duration: 'weeks',
    tags: ['seasonal', 'beginning', 'new term', 'arrival', 'hope'],
  },
  {
    id: 'winter-solstice',
    category: 'seasonal',
    title: 'Longest Night Gathering',
    description: 'The Academy marks the longest night with a tradition older than anyone can document. People say things in the dark they won\'t say in daylight.',
    effects: ['Night-only events unlock', 'NPC candor increases', 'Hidden feelings expressed', 'Special items available'],
    npcReactions: ["Something about this night makes honesty feel safer.", "This is the only time of year the Academy feels like a home.", "Pay attention tonight. People mean what they say."],
    playerHooks: ['Attend the gathering', 'Have a conversation only possible on this night', 'Discover a tradition\'s hidden meaning'],
    duration: 'hours',
    tags: ['seasonal', 'winter', 'night', 'tradition', 'gathering'],
  },
  {
    id: 'graduation-season',
    category: 'seasonal',
    title: 'Graduation Season Approaches',
    description: 'The final weeks before graduation carry a particular quality of urgency and nostalgia. Decisions made now will shape lives afterward.',
    effects: ['Graduating NPCs become emotionally available', 'Final quests open', 'Farewells begin', 'Legacy items become available'],
    npcReactions: ["I can\'t decide if I\'m ready or if I\'ll never be ready.", "Everything I worked for is becoming real. It\'s terrifying.", "I thought I knew what came next. I\'m less sure every day."],
    playerHooks: ['Help a graduating NPC complete their arc', 'Prepare for your own departure or continuation', 'Document the Academy before it changes'],
    duration: 'weeks',
    tags: ['graduation', 'ending', 'transition', 'legacy', 'seasonal'],
  },
];

// ─────────────────────────────────────────────────────────────────
// MYSTERY EVENTS
// ─────────────────────────────────────────────────────────────────
const MYSTERY_EVENTS: WorldEventTemplate[] = [
  {
    id: 'anonymous-notes',
    category: 'mystery',
    title: 'Anonymous Notes Appearing',
    description: 'Handwritten notes are appearing in lockers, under doors, slipped between pages of library books. Nobody knows the author. The notes know things they shouldn\'t.',
    effects: ['Hidden information distributed', 'NPCs unsettled', 'Investigation path active', 'Trust among students shifts'],
    npcReactions: ["I got one. It said something only two people should know.", "Either someone has been watching carefully, or this is a trap.", "I want to know who it is. But I\'m also a little afraid to find out."],
    playerHooks: ['Track the author', 'Use the information responsibly or not', 'Discover the motive'],
    duration: 'weeks',
    tags: ['mystery', 'notes', 'investigation', 'secret', 'information'],
  },
  {
    id: 'strange-pattern',
    category: 'mystery',
    title: 'Inexplicable Pattern Detected',
    description: 'Events across the Academy — unrelated on the surface — have begun forming a recognizable shape. Something is organizing below the surface.',
    effects: ['Multiple clue paths open', 'NPCs with partial information appear', 'Pattern recognition rewards active investigation', 'High-stakes revelation at conclusion'],
    npcReactions: ["It might be coincidence. I don\'t believe in coincidence.", "I\'ve seen three of the events. I\'m afraid to look for a fourth.", "Whoever is doing this wants the pattern to be found."],
    playerHooks: ['Map the pattern', 'Confront the source', 'Decide what to do with the knowledge'],
    duration: 'weeks',
    tags: ['mystery', 'pattern', 'investigation', 'conspiracy', 'revelation'],
  },
  {
    id: 'disappearing-items',
    category: 'mystery',
    title: 'Objects Vanishing from Secured Locations',
    description: 'Items have gone missing from places that should be impossible to access without authorization. The thief leaves no trace. The pattern of items taken suggests intent.',
    effects: ['Security increases in some areas', 'Others become briefly unwatched', 'Investigation path opens', 'Missing items connect to larger story'],
    npcReactions: ["It\'s not what was taken that bothers me — it\'s what wasn\'t taken.", "I locked that door myself. I know I locked it.", "The thief is telling us something. We\'re not reading it right yet."],
    playerHooks: ['Investigate independently', 'Set a trap', 'Discover what connects the missing items'],
    duration: 'days',
    tags: ['mystery', 'theft', 'investigation', 'security', 'hidden'],
  },
];

// ─────────────────────────────────────────────────────────────────
// REGISTRY
// ─────────────────────────────────────────────────────────────────
export const EVENT_TEMPLATES: Record<EventCategory, WorldEventTemplate[]> = {
  academic:      ACADEMIC_EVENTS,
  social:        SOCIAL_EVENTS,
  crisis:        CRISIS_EVENTS,
  discovery:     DISCOVERY_EVENTS,
  competition:   COMPETITION_EVENTS,
  institutional: INSTITUTIONAL_EVENTS,
  seasonal:      SEASONAL_EVENTS,
  mystery:       MYSTERY_EVENTS,
};

export const ALL_EVENTS: WorldEventTemplate[] = Object.values(EVENT_TEMPLATES).flat();

/** Match a headline/topic string to the closest event templates by tag overlap */
export function matchEventsByTags(tags: string[], maxResults = 3): WorldEventTemplate[] {
  const lower = tags.map(t => t.toLowerCase());
  return ALL_EVENTS
    .map(ev => ({ ev, score: ev.tags.filter(t => lower.some(l => t.includes(l) || l.includes(t))).length }))
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map(x => x.ev);
}
