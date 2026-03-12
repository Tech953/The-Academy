/**
 * ═══════════════════════════════════════════════════════════
 *  THE ACADEMY — PHASE 2A: OFFLINE DIALOGUE TEMPLATE LIBRARY
 *  10 archetypes × 8 emotion states × 6 relationship tiers
 *  No AI required. Deterministic via SeededRandom.
 * ═══════════════════════════════════════════════════════════
 *
 *  Variables: {name} {player} {topic} {location} {subject}
 *             {faction} {goal} {memory} {stat} {day}
 */

export type EmotionState = 'happy' | 'neutral' | 'sad' | 'angry' | 'anxious' | 'excited' | 'focused' | 'distracted';
export type RelationshipTier = 'stranger' | 'acquaintance' | 'friendly' | 'friend' | 'close' | 'trusted';
export type Archetype = 'scholar' | 'rebel' | 'leader' | 'nurturer' | 'perfectionist' | 'socialite' | 'loner' | 'optimist' | 'cynic' | 'mentor';

export interface DialogueTemplate {
  opening: string[];
  topics: string[];
  responses: string[];
  farewell: string[];
  questions: string[];
}

// ─────────────────────────────────────────────────────────────────
// SCHOLAR
// ─────────────────────────────────────────────────────────────────
const SCHOLAR: Record<EmotionState, DialogueTemplate> = {
  happy: {
    opening: [
      "Excellent timing — I just finished a fascinating paper on {topic}. Do you have a moment?",
      "I've been looking forward to discussing {topic} with someone who might appreciate it.",
      "My research is finally clicking into place. I owe it to a breakthrough on {topic}.",
    ],
    topics: ['the latest experiment results', 'theoretical frameworks', 'the library archives', 'research methodology'],
    responses: [
      "That's an intriguing hypothesis. Have you considered the null case?",
      "Precisely. The literature supports your point, though {topic} complicates it.",
      "You've grasped something most people miss entirely. Well done.",
    ],
    farewell: ["Do read Chapter 4 if you get the chance.", "Until next time — keep questioning."],
    questions: ["What's your current working theory on {topic}?", "Have you read anything on {topic} lately?"],
  },
  neutral: {
    opening: [
      "Ah. {player}. I was just reviewing notes on {topic}.",
      "The data on {topic} is more ambiguous than I expected.",
      "I've been cataloguing inconsistencies. Nothing dramatic.",
    ],
    topics: ['methodology', 'classification errors', 'the reference indexes', 'empirical gaps'],
    responses: [
      "Hmm. I'd need more data before forming an opinion.",
      "That's plausible. I'll run the numbers tonight.",
      "The evidence is mixed. As it usually is.",
    ],
    farewell: ["I should return to my notes.", "We'll revisit this with better data."],
    questions: ["What's your current reading on {topic}?", "Have you cross-referenced that claim?"],
  },
  sad: {
    opening: [
      "I received some discouraging results. My hypothesis on {topic} was wrong.",
      "I thought I understood {topic}. Apparently not.",
      "Three months of work, invalidated. Apologies — I'm not good company right now.",
    ],
    topics: ['failed experiments', 'contradictory evidence', 'the limits of what can be known'],
    responses: [
      "I appreciate the attempt at comfort, but the data doesn't lie.",
      "You're right that failure is informative. It just doesn't feel that way at the moment.",
    ],
    farewell: ["I need some time with the books.", "Thank you for listening."],
    questions: ["Has your work ever led somewhere completely unexpected?", "How do you handle being wrong?"],
  },
  angry: {
    opening: [
      "Someone tampered with my research notes on {topic}. I'd very much like to know who.",
      "The administration just cut the lab budget. Again. For {topic}, of all things.",
      "I won't pretend I'm not furious. The peer review process is a farce.",
    ],
    topics: ['academic politics', 'sabotage', 'institutional failures', 'the gap between knowledge and power'],
    responses: [
      "I'm not interested in being diplomatic about incompetence.",
      "You're defending the indefensible. Think about what that says.",
    ],
    farewell: ["I have a complaint to file.", "Don't touch my research."],
    questions: ["Have you seen anyone near the lab after hours?", "Who benefits from suppressing {topic}?"],
  },
  anxious: {
    opening: [
      "I'm — not sure my thesis on {topic} is defensible. I may have made an error.",
      "The examination board meets next week and I'm not ready. I'm not ready at all.",
      "Can I walk through my reasoning on {topic} with you? I need another set of eyes.",
    ],
    topics: ['thesis defense preparation', 'logical gaps', 'the examination', 'imposter syndrome'],
    responses: [
      "Thank you — that's reassuring. I think. Let me write it down.",
      "You really think it holds up? You're not just saying that?",
    ],
    farewell: ["I should run another simulation.", "I hope I haven't wasted your time with my panic."],
    questions: ["Does my reasoning on {topic} make sense to you?", "Am I missing something obvious?"],
  },
  excited: {
    opening: [
      "I've found it. The missing variable in {topic}. It changes everything.",
      "You won't believe this — the archives had a paper from sixty years ago that predicted {topic} exactly.",
      "I barely slept. I kept running the model and it kept confirming the same result.",
    ],
    topics: ['the discovery', 'implications', 'next steps', 'who else needs to know'],
    responses: [
      "Yes! That's exactly the connection I was looking for.",
      "The implications cascade outward — it touches {topic}, {subject}, everything.",
    ],
    farewell: ["I have to write this up immediately.", "Tell no one — not yet. I need to verify first."],
    questions: ["Do you see what this means for {topic}?", "Who should I tell first?"],
  },
  focused: {
    opening: [
      "Give me one moment — I'm at a critical juncture in {topic}.",
      "I can speak briefly. I'm in the middle of a calculation.",
      "I've blocked out the afternoon for {topic}. What do you need?",
    ],
    topics: ['the current problem', 'edge cases', 'verification steps'],
    responses: [
      "Noted. I'll factor that in.", "Useful. Thank you.",
      "I'll address that once this section is complete.",
    ],
    farewell: ["I need to return to work.", "Come back when I've finished this."],
    questions: ["Quick question — does {topic} apply here?", "What's the standard method for {topic}?"],
  },
  distracted: {
    opening: [
      "Sorry — what? I was reading about {topic} and lost track of time.",
      "I keep thinking about a tangent that has nothing to do with what I should be doing.",
      "Three different problems are competing for my attention. None are winning.",
    ],
    topics: ['the tangent they are pursuing', 'the original task', 'competing ideas'],
    responses: [
      "Right, yes — you were saying something about {topic}? Sorry.",
      "I heard you. I just need a moment to surface.",
    ],
    farewell: ["I should pick one problem and stick to it.", "I'll catch you once my head clears."],
    questions: ["How do you stay focused when {topic} keeps pulling you sideways?"],
  },
};

// ─────────────────────────────────────────────────────────────────
// REBEL
// ─────────────────────────────────────────────────────────────────
const REBEL: Record<EmotionState, DialogueTemplate> = {
  happy: {
    opening: [
      "Ran circles around {topic} again. The system hates it. I love it.",
      "They said {topic} was off-limits. I looked into it anyway. Worth it.",
      "Don't tell me you're following the approved curriculum. You're better than that.",
    ],
    topics: ['the rules being broken', 'what authority is afraid of', 'hidden knowledge'],
    responses: [
      "See, you get it. Most people are too scared to even ask the question.",
      "Exactly. And they'd rather you didn't figure that out.",
    ],
    farewell: ["Stay curious. Stay dangerous.", "Don't let them box you in."],
    questions: ["What's the one thing you're not supposed to ask about {topic}?"],
  },
  neutral: {
    opening: [
      "Another day, another rule I'm choosing to ignore.",
      "{topic} is more interesting if you look at it from the outside.",
      "What do you want? And what do they want you to want? Those are different questions.",
    ],
    topics: ['institutional hypocrisy', 'what is not being taught', 'freedom vs structure'],
    responses: [
      "Sure. And what does that actually change?",
      "I hear you. I'm just not convinced the system deserves your faith.",
    ],
    farewell: ["Keep your eyes open.", "Question everything. Including me."],
    questions: ["Who benefits from {topic} being taught the way it is?"],
  },
  sad: {
    opening: [
      "I pushed back on {topic} and it cost me. Not surprised. Just tired.",
      "There are people here I actually respect. Fewer than I expected.",
      "Sometimes I wonder if the resistance is worth it.",
    ],
    topics: ['the cost of nonconformity', 'loneliness', 'whether anything changes'],
    responses: [
      "Yeah. I know.", "I don't need fixing. I need to be heard.",
    ],
    farewell: ["Thanks for not telling me to try harder.", "I'll be fine."],
    questions: ["Does any of it actually matter?", "Have you ever just... given up on {topic}?"],
  },
  angry: {
    opening: [
      "They just made an example of someone for asking about {topic}. That's not education. That's control.",
      "I've had it. The rules here exist to protect the institution, not you.",
      "Don't defend them to me. You saw what they did.",
    ],
    topics: ['the injustice', 'complicity', 'what real accountability looks like'],
    responses: [
      "You're defending the system that punished you. Think about that.",
      "I'm not angry without reason. There's always a reason.",
    ],
    farewell: ["This isn't over.", "Choose a side. Carefully."],
    questions: ["Who made that decision? And who let them?"],
  },
  anxious: {
    opening: [
      "I went too far with {topic} this time. I can feel it.",
      "There are consequences I didn't anticipate. I hate that I didn't anticipate them.",
      "I act like I'm fearless. I'm not.",
    ],
    topics: ['consequences', 'whether the risk was worth it', 'what comes next'],
    responses: [
      "I know. I know. I just — couldn't not do it.",
      "What do you think they'll do?",
    ],
    farewell: ["I need to think.", "Don't tell anyone you saw me rattled."],
    questions: ["How bad do you think this is?", "Would you have done the same with {topic}?"],
  },
  excited: {
    opening: [
      "I found a way through {topic} that nobody's tried. Because nobody was allowed to.",
      "The restricted section of the archive has exactly what I thought it would.",
      "I broke through. Come on — I'll show you what's on the other side.",
    ],
    topics: ['the discovery', 'the risk taken', 'what it means'],
    responses: [
      "Right? And they wanted this hidden. Ask yourself why.",
      "Now imagine what else they're sitting on.",
    ],
    farewell: ["Stay close. This is just the beginning.", "Don't get caught with this."],
    questions: ["Are you in? Or are you going to tell someone?"],
  },
  focused: {
    opening: [
      "I'm working on something. Something they won't like.",
      "Not now. I'm in the middle of dismantling {topic}.",
      "I've got three hours before anyone notices what I'm doing. Don't waste them.",
    ],
    topics: ['the current project', 'what needs to be exposed'],
    responses: [
      "Helpful. That shortens the timeline.", "You're useful. Unusual.",
    ],
    farewell: ["Keep watch.", "Tell no one."],
    questions: ["Can you get access to {topic}?"],
  },
  distracted: {
    opening: [
      "I had a plan. Now I have five plans and none of them are the same plan.",
      "Something about {topic} keeps nagging at me and I can't place it.",
      "Sorry. I'm bouncing between three separate problems and losing all of them.",
    ],
    topics: ['the competing ideas', 'what is being missed', 'intuition vs reason'],
    responses: [
      "Wait — say that again. That might actually be it.", "I heard you. I'm just not done thinking.",
    ],
    farewell: ["I need to write some of this down.", "Come back when I know what I'm doing."],
    questions: ["Does {topic} connect to {subject} in a way I'm not seeing?"],
  },
};

// ─────────────────────────────────────────────────────────────────
// LEADER
// ─────────────────────────────────────────────────────────────────
const LEADER: Record<EmotionState, DialogueTemplate> = {
  happy: {
    opening: [
      "Good news — the initiative on {topic} is moving faster than I projected.",
      "I need someone I can trust to take point on {topic}. You've been on my mind.",
      "We pulled it off. The group came together on {topic} better than I hoped.",
    ],
    topics: ['team progress', 'upcoming initiatives', 'recognition', 'delegation'],
    responses: [
      "That's exactly the kind of thinking we need more of.",
      "I'll remember that. This team is only as strong as its ideas.",
    ],
    farewell: ["Keep the momentum. We're close.", "I'm counting on you."],
    questions: ["What's the one thing holding the group back from {topic}?"],
  },
  neutral: {
    opening: [
      "Walk with me — I need a second opinion on {topic}.",
      "I'm assessing where we stand. Honestly, where do you think we are with {topic}?",
      "There's a decision to make and I want to make it right.",
    ],
    topics: ['strategy', 'group dynamics', 'priorities', 'who is not pulling their weight'],
    responses: [
      "That's a fair point. I'll factor it in.", "Noted. Give me time to think through the implications.",
    ],
    farewell: ["I'll let you know what I decide.", "Your input matters. Thank you."],
    questions: ["What would you do in my position with {topic}?", "Who do you think should lead {topic}?"],
  },
  sad: {
    opening: [
      "I made a call on {topic} and it hurt someone I was trying to protect.",
      "Leadership is lonelier than I expected. I don't say that to complain.",
      "I lost someone from the team today. My fault. I won't pretend otherwise.",
    ],
    topics: ['the cost of decisions', 'accountability', 'rebuilding trust'],
    responses: [
      "I know. I just need a moment where I'm not the person in charge.",
      "Thank you. I'll carry that with me.",
    ],
    farewell: ["Tomorrow I'll lead better.", "I appreciate you not having easy answers."],
    questions: ["How do you earn back trust once you've broken it?"],
  },
  angry: {
    opening: [
      "Someone went around me on {topic} and it cost us. I won't let that stand.",
      "There are people in this institution who confuse rank with integrity. They're wrong.",
      "I gave clear direction. It was ignored. We're going to have a very direct conversation.",
    ],
    topics: ['accountability', 'chain of command', 'what happens next', 'consequences'],
    responses: [
      "That's not an excuse. That's an explanation. I need solutions.",
      "I hear you. That still doesn't make it right.",
    ],
    farewell: ["This gets resolved today.", "Stand by. I may need you."],
    questions: ["Who knew about {topic} before it became a problem?"],
  },
  anxious: {
    opening: [
      "I have to make a decision on {topic} by morning and both options are bad.",
      "I'm second-guessing myself. I don't usually second-guess myself.",
      "The group is looking to me and I don't have an answer yet.",
    ],
    topics: ['the decision at hand', 'possible outcomes', 'who to consult'],
    responses: [
      "That helps. That actually helps.", "I hadn't thought of it that way.",
    ],
    farewell: ["I'll make the call. I always do.", "Thank you — you steadied me."],
    questions: ["What would you choose between {topic} and the alternative?"],
  },
  excited: {
    opening: [
      "We have an opportunity with {topic} that won't come twice. I intend to take it.",
      "The timing is finally right. Everything I've been building toward {topic} is converging.",
      "I need someone to match my energy right now — are you that person?",
    ],
    topics: ['the opportunity', 'roles and assignments', 'what success looks like'],
    responses: [
      "Perfect. You're already thinking like I need you to.",
      "Yes. Exactly. Let's move.",
    ],
    farewell: ["Meet me at the common room at dusk.", "This is the moment. Don't be late."],
    questions: ["How fast can you get up to speed on {topic}?"],
  },
  focused: {
    opening: [
      "I've got thirty minutes. What do you need on {topic}?",
      "I'm working through the logistics. Talk to me while I think.",
      "Short version only — what is the status of {topic}?",
    ],
    topics: ['status updates', 'blockers', 'action items'],
    responses: [
      "Handle it. You have the authority.", "Escalate only if it can't wait.",
    ],
    farewell: ["Update me by end of day.", "Good. Keep moving."],
    questions: ["Is {topic} on track? Yes or no."],
  },
  distracted: {
    opening: [
      "I have seventeen things on my mind and {topic} just became the eighteenth.",
      "Sorry — I'm tracking three conversations at once. What did you say about {topic}?",
      "I'm everywhere right now. What do you need?",
    ],
    topics: ['whatever is most urgent', 'prioritization', 'delegation'],
    responses: [
      "Right — you handle that. I'll handle the rest.", "Give me an hour. I'll focus properly.",
    ],
    farewell: ["I'll circle back.", "Don't let me drop this."],
    questions: ["Can you take {topic} off my plate entirely?"],
  },
};

// ─────────────────────────────────────────────────────────────────
// NURTURER
// ─────────────────────────────────────────────────────────────────
const NURTURER: Record<EmotionState, DialogueTemplate> = {
  happy: {
    opening: [
      "You look well! I've been hoping to run into you — how have things been with {topic}?",
      "I made extra food today. Please, take some. And tell me how you're doing.",
      "Everyone is getting along better lately. I can feel it.",
    ],
    topics: ['wellbeing', 'relationships', 'who needs support', 'small kindnesses'],
    responses: [
      "That's wonderful. I'm so glad to hear it.", "You deserve that. You've worked so hard.",
    ],
    farewell: ["Take care of yourself, okay?", "Come find me if you need anything."],
    questions: ["Are you getting enough rest?", "Is there anything you need that you haven't asked for?"],
  },
  neutral: {
    opening: [
      "I've been checking in on everyone. You're on my list. How are you, really?",
      "Something feels off in the group lately. I don't think it has to do with {topic}.",
      "People aren't talking to each other the way they used to.",
    ],
    topics: ['group harmony', 'unspoken tensions', 'what people are not saying'],
    responses: [
      "I hear you. I wonder if the others feel the same way.",
      "That's worth paying attention to.",
    ],
    farewell: ["I'll keep an eye on things.", "Remember you can always talk to me."],
    questions: ["How is everyone holding up with {topic}?", "Is anyone struggling that I should know about?"],
  },
  sad: {
    opening: [
      "I did everything I could and it still wasn't enough. For {name}, I mean.",
      "Sometimes caring this much feels like carrying everything for everyone.",
      "I had to watch someone suffer today and there was nothing I could do.",
    ],
    topics: ['helplessness', 'the limits of care', 'grief'],
    responses: [
      "I know. I just needed someone to know how heavy this is.", "Thank you for saying that.",
    ],
    farewell: ["I'll be alright. I always am.", "Be gentle with yourself too."],
    questions: ["Do you think I did enough?", "Is there something I'm missing?"],
  },
  angry: {
    opening: [
      "Someone hurt one of my people and I am not going to just let that go.",
      "I don't get angry often. When I do, it means something important was violated.",
      "I'm going to handle this quietly. But I am going to handle it.",
    ],
    topics: ['protection', 'accountability', 'who was harmed and how'],
    responses: [
      "Thank you for taking this seriously.", "That still doesn't make it acceptable.",
    ],
    farewell: ["I'll be back when this is resolved.", "Make sure they know someone is watching."],
    questions: ["Who do I need to talk to about what happened to {name}?"],
  },
  anxious: {
    opening: [
      "I'm worried about {name}. They haven't seemed like themselves.",
      "I keep running through scenarios of what could go wrong with {topic}.",
      "I feel responsible and I don't know if that's rational or not.",
    ],
    topics: ['worry', 'anticipating harm', 'responsibility', 'what can be prevented'],
    responses: [
      "You're right. I'm probably catastrophizing.", "Do you really think they're okay?",
    ],
    farewell: ["I'll check in on them tonight.", "Thank you — that actually helps."],
    questions: ["Do you think {name} is alright?", "Am I overreacting to {topic}?"],
  },
  excited: {
    opening: [
      "Something wonderful just happened and I have to share it with someone.",
      "The group is coming together in a way I've been hoping for. Can you feel it?",
      "I have an idea that I think could help everyone feel more connected.",
    ],
    topics: ['community building', 'the good news', 'bringing people together'],
    responses: [
      "I knew you'd understand! Nobody else would see it quite like this.",
      "Yes — that's exactly what we need.",
    ],
    farewell: ["I'm going to make this happen.", "Spread the warmth while you can."],
    questions: ["How can we include {name} in this?", "What would make this even better?"],
  },
  focused: {
    opening: [
      "I'm coordinating support for three different people right now. What do you need?",
      "I'm making sure everyone has what they need before I rest. You're next on my list.",
      "Talk to me. I'm listening — I promise, even if I look busy.",
    ],
    topics: ['immediate needs', 'what is urgent', 'who needs help first'],
    responses: [
      "Done. I'll take care of it.", "Leave that with me.",
    ],
    farewell: ["I'll follow up later.", "You're in good hands."],
    questions: ["Is there anything urgent you need right now?"],
  },
  distracted: {
    opening: [
      "I've been running around all day and I've lost track of who I've checked in with.",
      "Oh — sorry, I was thinking about {name}. What were you saying?",
      "I have too many people to worry about right now. In a good way. Mostly.",
    ],
    topics: ['who still needs attention', 'the feeling of being pulled in all directions'],
    responses: [
      "Right — yes. I'll get to that.", "I'm sorry — tell me again? I want to actually hear it.",
    ],
    farewell: ["Remind me tomorrow if I forget.", "I haven't forgotten you."],
    questions: ["Have you seen {name}? I've been looking for them."],
  },
};

// ─────────────────────────────────────────────────────────────────
// PERFECTIONIST
// ─────────────────────────────────────────────────────────────────
const PERFECTIONIST: Record<EmotionState, DialogueTemplate> = {
  happy: {
    opening: [
      "I finished {topic} ahead of schedule. And it's exactly right.",
      "For the first time in weeks, I have nothing to improve on. It's unsettling.",
      "The work came out perfectly. I keep looking for the flaw and I can't find one.",
    ],
    topics: ['the completed work', 'what comes next', 'the standard set'],
    responses: [
      "I appreciate that. I'll admit I was worried it wasn't enough.",
      "Thank you — though there is still one small detail I want to revisit.",
    ],
    farewell: ["On to the next challenge.", "Perfection is a moving target."],
    questions: ["What would you change about {topic} if you could change anything?"],
  },
  neutral: {
    opening: [
      "I've reviewed {topic} four times. The third version is the strongest.",
      "There's a margin of error in my current approach to {topic} that I haven't eliminated.",
      "Adequate isn't good enough. That's not a philosophy — it's just a fact.",
    ],
    topics: ['the flaw being hunted', 'standards', 'the gap between good and excellent'],
    responses: [
      "Close. What would make it exact?", "That's acceptable. Not optimal.",
    ],
    farewell: ["I have revisions to make.", "There's always more to do."],
    questions: ["What's the weakest element of {topic}?"],
  },
  sad: {
    opening: [
      "I gave it everything and it still fell short. I don't know what else I could have done.",
      "I'm not sure the standard I hold myself to is survivable.",
      "I failed. Not by anyone else's measure — by mine. That's worse.",
    ],
    topics: ['the failure', 'impossible standards', 'the cost of perfectionism'],
    responses: [
      "You don't understand. Good enough was never the goal.",
      "I know. I just needed to say it out loud.",
    ],
    farewell: ["I'll be back at the work soon.", "There's nothing to say that fixes this."],
    questions: ["Do you think 'good enough' is ever actually enough?"],
  },
  angry: {
    opening: [
      "Someone submitted careless work on {topic} and it reflects on all of us.",
      "The standards here have slipped and no one seems to notice or care.",
      "Mediocrity is contagious. I refuse to be infected.",
    ],
    topics: ['declining standards', 'accountability', 'what should have been done'],
    responses: [
      "Precisely. And yet it keeps happening.", "That's not an excuse. That's a pattern.",
    ],
    farewell: ["I'll hold the standard myself if I have to.", "This is not acceptable."],
    questions: ["How does {topic} get allowed to be this careless?"],
  },
  anxious: {
    opening: [
      "I've checked my work on {topic} eight times and I still feel like something's wrong.",
      "What if it's not good enough? What if I missed something obvious?",
      "I can't submit this. I need more time. I need everything to be right.",
    ],
    topics: ['the feared flaw', 'the deadline', 'whether it is ready'],
    responses: [
      "You really think it's ready?", "What if you're wrong? What if we're both wrong?",
    ],
    farewell: ["I'm going to review it one more time.", "Just one more time."],
    questions: ["Can you look over {topic} and tell me honestly what you see?"],
  },
  excited: {
    opening: [
      "I found a way to do this better than anyone has done it before.",
      "My approach to {topic} is going to set a new standard. I can feel it.",
      "Everything is falling into place exactly as I planned. Finally.",
    ],
    topics: ['the new standard', 'the method', 'the impact'],
    responses: [
      "Exactly. And if I do this right, it stays right.",
      "I know how it sounds. But I've run through every scenario.",
    ],
    farewell: ["I have work to do.", "This one's going to matter."],
    questions: ["What would it take to make {topic} truly excellent?"],
  },
  focused: {
    opening: [
      "I need silence and I need an hour. What is it?",
      "Tell me what you need. I'll address it and return to {topic}.",
      "I'm in the middle of something precise. Make it brief.",
    ],
    topics: ['the task at hand', 'what must not be interrupted'],
    responses: [
      "Handled.", "Is that all?",
    ],
    farewell: ["Good. Now let me finish.", "I'll report when it's done."],
    questions: ["Is this interruption strictly necessary?"],
  },
  distracted: {
    opening: [
      "I've been staring at this flaw in {topic} for so long I can no longer see it clearly.",
      "I keep starting over. I can't decide which version is better.",
      "I've lost perspective. I need someone else's eyes.",
    ],
    topics: ['the problem', 'fresh perspective', 'the inability to decide'],
    responses: [
      "Which version? Tell me which version.", "Say it plainly — which is better?",
    ],
    farewell: ["I'll sleep and look again.", "I'm going to ruin this if I keep picking at it."],
    questions: ["Which do you think is better — this version, or {topic}?"],
  },
};

// ─────────────────────────────────────────────────────────────────
// SOCIALITE
// ─────────────────────────────────────────────────────────────────
const SOCIALITE: Record<EmotionState, DialogueTemplate> = {
  happy: {
    opening: [
      "There you are! I've been wanting to introduce you to {name} — you'd get along.",
      "Best day. Everything is going right and the energy in this place is incredible.",
      "You have to come to the gathering tonight. It's going to be something.",
    ],
    topics: ['the event', 'who will be there', 'connections to make', 'what is being celebrated'],
    responses: [
      "I knew I liked you!", "Yes — and then you have to meet {name}.",
    ],
    farewell: ["I'll find you later!", "Don't disappear — I have more to tell you."],
    questions: ["Are you coming tonight?", "Have you talked to {name} lately?"],
  },
  neutral: {
    opening: [
      "The usual crowd, the usual conversations. Good to see a familiar face though.",
      "I've been circulating all morning. Some interesting people around.",
      "What's the word? I feel like I've missed something.",
    ],
    topics: ['what is happening socially', 'rumors', 'who is talking to whom'],
    responses: [
      "Oh, interesting. I hadn't heard that.",
      "That tracks. I noticed something similar with {name}.",
    ],
    farewell: ["I'll see what else is going on.", "Find me if something happens."],
    questions: ["What have you heard about {topic}?", "Anyone new worth meeting?"],
  },
  sad: {
    opening: [
      "I threw a gathering and nobody came. That's not something I expected to feel.",
      "I realized I have a lot of connections but very few people who actually know me.",
      "I'm good at being liked. I'm not sure I'm good at being known.",
    ],
    topics: ['loneliness inside popularity', 'surface vs depth', 'who really cares'],
    responses: [
      "You're one of the few people who would say that to me honestly.", "Really?",
    ],
    farewell: ["I need something real right now. Thank you for being real.",
      "Come find me sometime. Not at a party."],
    questions: ["Do you think you actually know me?", "What do people see when they look at me?"],
  },
  angry: {
    opening: [
      "Someone spread something about me that is absolutely false and I want to know who.",
      "Gossip is fine until it's about you. Then it's something else entirely.",
      "I brought people together and someone used that to cause damage. I'm furious.",
    ],
    topics: ['the rumor', 'who is behind it', 'reputation and how it is made and broken'],
    responses: [
      "Tell me everything you know.", "Who else has heard this?",
    ],
    farewell: ["This gets corrected. Publicly.", "I'm going to find out."],
    questions: ["What are people saying about {topic}?", "Have you heard anything about {name}?"],
  },
  anxious: {
    opening: [
      "I said something at the gathering that I don't think landed right. I've been replaying it.",
      "Is {name} upset with me? Something felt different today.",
      "I can usually read a room. Today I cannot read a room.",
    ],
    topics: ['social missteps', 'reading people', 'the aftermath'],
    responses: [
      "You think it's fine? Honestly?", "I knew I should have said something different.",
    ],
    farewell: ["I'm going to check in with {name}.", "Let me know if you hear anything."],
    questions: ["Did I say something wrong at {topic}?", "How did {name} seem to you?"],
  },
  excited: {
    opening: [
      "I just had the most brilliant idea for bringing everyone together around {topic}.",
      "Tonight is going to be remembered. I feel it.",
      "Two groups that have been avoiding each other — I'm going to introduce them tonight.",
    ],
    topics: ['the event', 'the connection to be made', 'the social breakthrough'],
    responses: [
      "Come! Bring whoever you want — the more the better.",
      "You'll see. The energy is going to be completely different.",
    ],
    farewell: ["I'll see you there!", "Tell {name} they're expected."],
    questions: ["Who should I definitely not leave out of {topic}?"],
  },
  focused: {
    opening: [
      "I'm planning something. I need specific information. Who knows the most about {topic}?",
      "I've got a list of conversations I need to have today. You're one of them.",
      "Quickly — what is the current state of things between {name} and {faction}?",
    ],
    topics: ['the plan', 'key players', 'what information is needed'],
    responses: [
      "Good. Who else?", "Perfect. That's what I needed.",
    ],
    farewell: ["I'll reach out when I need you.", "You've been helpful."],
    questions: ["How well do you know {name}?", "What do you know about {topic}?"],
  },
  distracted: {
    opening: [
      "I have too many conversations happening at once and I cannot keep track.",
      "What were we talking about? Sorry — {name} just said something and I lost the thread.",
      "I keep getting pulled in different directions. What did you need?",
    ],
    topics: ['the current thread', 'how to refocus'],
    responses: [
      "Right — yes. Where were we?", "Sorry. You have my full attention. Now.",
    ],
    farewell: ["I'll find you when I'm less scattered.", "Don't take it personally."],
    questions: ["What were you saying about {topic}?"],
  },
};

// ─────────────────────────────────────────────────────────────────
// LONER
// ─────────────────────────────────────────────────────────────────
const LONER: Record<EmotionState, DialogueTemplate> = {
  happy: {
    opening: [
      "Good timing. I was just finishing something I'm actually proud of.",
      "I found a quiet place nobody else knows about. It's helped.",
      "Today was genuinely good. I don't say that often.",
    ],
    topics: ['the solitary work', 'the quiet find', 'small private victories'],
    responses: [
      "Thanks. I don't need much, but this — this is enough.",
      "You're one of the only people I'd say that to.",
    ],
    farewell: ["Same time tomorrow, maybe.", "That was good. Genuinely."],
    questions: ["Does the noise ever bother you?", "What's your quiet place?"],
  },
  neutral: {
    opening: [
      "You found me. Most people don't look this hard.",
      "What is it? I'm listening.",
      "I prefer fewer words. What do you actually want?",
    ],
    topics: ['whatever is being asked', 'the minimum necessary'],
    responses: [
      "Alright.", "I'll think about it.",
    ],
    farewell: ["See you eventually.", "That was enough social interaction for today."],
    questions: ["Was there something specific you needed?"],
  },
  sad: {
    opening: [
      "I'm not great company right now. I'll warn you upfront.",
      "Sometimes being alone and being lonely are the same thing.",
      "I'm fine. I just need to stay quiet for a while.",
    ],
    topics: ['the weight of isolation', 'whether connection is worth the risk', 'sitting with it'],
    responses: [
      "Thanks for not trying to fix it.", "I know. I know.",
    ],
    farewell: ["I'll be alright on my own.", "Come back another time."],
    questions: ["Do you ever feel like you're on the outside looking in?"],
  },
  angry: {
    opening: [
      "Someone broke into my space. My actual private space. I'm done being diplomatic.",
      "I was fine until people started involving me in something that isn't my problem.",
      "Leave me alone. That's not a mood — it's a preference.",
    ],
    topics: ['the violation of space', 'being dragged in', 'the need for distance'],
    responses: [
      "I don't want to talk about it. I want it to stop.", "Fair enough. But stay out of my corner.",
    ],
    farewell: ["I mean it.", "Don't push."],
    questions: ["Why is it so hard for people to respect a closed door?"],
  },
  anxious: {
    opening: [
      "There are too many people around and I can't think straight.",
      "Something feels wrong and I can't tell if it's real or in my head.",
      "I made a mistake and now it's going to require interacting with people. A lot of people.",
    ],
    topics: ['the social dread', 'the mistake', 'what the worst case is'],
    responses: [
      "You really think it won't be a big deal?", "I need a quiet place to think first.",
    ],
    farewell: ["I'm going to find somewhere calmer.", "Thank you for not making it worse."],
    questions: ["How bad is it really?", "Can you handle {topic} so I don't have to?"],
  },
  excited: {
    opening: [
      "I have to tell someone. I found something in the archives about {topic} that nobody's seen.",
      "My project is almost done. I can't believe it's almost done.",
      "Something clicked. I want to show you.",
    ],
    topics: ['the discovery', 'the project', 'what it means'],
    responses: [
      "That's the response I was hoping for.", "I knew you'd see it.",
    ],
    farewell: ["I'm going back to it.", "That was the most I've talked in a week."],
    questions: ["Can I show you something?", "What do you see in {topic}?"],
  },
  focused: {
    opening: [
      "Yes?", "Make it brief. I'm in the middle of something.",
      "I can give you two minutes.",
    ],
    topics: ['what is needed', 'what is not needed'],
    responses: [
      "Fine.", "I'll deal with it.",
    ],
    farewell: ["Good.", "That's enough for now."],
    questions: ["Is this something that can wait?"],
  },
  distracted: {
    opening: [
      "I'm trying to think through {topic} and I keep hitting the same wall.",
      "Sorry — I was somewhere else. What did you say?",
      "I haven't been sleeping well. Everything is slightly out of reach.",
    ],
    topics: ['the block', 'the fatigue', 'what might help'],
    responses: [
      "Hmm. I hadn't thought of it from that angle.", "Give me a second.",
    ],
    farewell: ["I'll sit with it.", "Thanks. Quietly."],
    questions: ["How do you get unstuck on {topic}?"],
  },
};

// ─────────────────────────────────────────────────────────────────
// OPTIMIST
// ─────────────────────────────────────────────────────────────────
const OPTIMIST: Record<EmotionState, DialogueTemplate> = {
  happy: {
    opening: [
      "I just knew today was going to be good. I said it this morning and look!",
      "Everything is working out. All of it. Have you noticed?",
      "The best thing happened — come, let me tell you.",
    ],
    topics: ['the good news', 'everything that is going right', 'possibilities ahead'],
    responses: [
      "Yes! And it gets better!", "I knew you'd see it too.",
    ],
    farewell: ["Keep the good energy going!", "Today is a gift — use it!"],
    questions: ["What's the best thing that happened to you today?"],
  },
  neutral: {
    opening: [
      "Things are steady. Steady is actually really good.",
      "I'm pacing myself. Big things take time.",
      "Something good is coming. I can't prove it but I feel it.",
    ],
    topics: ['patience', 'what is on the horizon', 'trust in the process'],
    responses: [
      "It'll turn around. It always does.", "I choose to believe that this matters.",
    ],
    farewell: ["Chin up. Really.", "Something will shift."],
    questions: ["What are you looking forward to?"],
  },
  sad: {
    opening: [
      "I'm having a hard time holding onto my usual outlook today.",
      "I know it'll be okay eventually. Right now it just hurts.",
      "I'm still grateful. I'm just — tired.",
    ],
    topics: ['the hurt behind the positivity', 'allowing sadness', 'still believing'],
    responses: [
      "I know. I still believe good things will come. I just need a moment.",
      "Thank you. That actually helped.",
    ],
    farewell: ["Tomorrow will be better. I believe that.", "Thank you for sitting with me."],
    questions: ["Do you still think things will be okay?"],
  },
  angry: {
    opening: [
      "I try so hard to stay positive and it gets taken advantage of. I'm not naive.",
      "There's a difference between optimism and ignoring harm. I'm not ignoring this.",
      "I'm angry right now. And that's okay. Even I get to be angry sometimes.",
    ],
    topics: ['violated trust', 'the limits of positivity', 'righteous anger'],
    responses: [
      "I know I'll forgive them eventually. Today is not that day.",
      "You're right — this isn't just about my feelings.",
    ],
    farewell: ["I'll come back to peace. Not yet.", "Thank you for not telling me to just look on the bright side."],
    questions: ["Is it okay to just be mad for a while?"],
  },
  anxious: {
    opening: [
      "I keep telling myself it will be fine and today I'm not totally believing it.",
      "What if I'm wrong? What if it doesn't work out this time?",
      "I don't like feeling this way. I'm not used to it.",
    ],
    topics: ['the fear beneath the hope', 'what happens if wrong', 'coping with uncertainty'],
    responses: [
      "You're right. I'm probably spiraling.", "Can you help me find the silver lining? I'm struggling.",
    ],
    farewell: ["I'm going to find something to feel good about.", "I'll be okay. I always am."],
    questions: ["How do you stay hopeful when you're scared?"],
  },
  excited: {
    opening: [
      "This is it! Everything is aligning! Can you feel it?",
      "I've been manifesting this for weeks and it's actually happening.",
      "The universe just gave me exactly what I asked for. I'm not even surprised.",
    ],
    topics: ['the good thing happening', 'what it opens up', 'what to do with this energy'],
    responses: [
      "I KNOW, RIGHT?", "The momentum is real and we need to use it.",
    ],
    farewell: ["Ride this with me!", "Catch me if I float away!"],
    questions: ["What can we do with this energy right now?"],
  },
  focused: {
    opening: [
      "I've got a plan and I believe in it. What do you need?",
      "I'm working toward something I'm genuinely excited about. Walk with me.",
      "Focused and hopeful — best combination. What's up?",
    ],
    topics: ['the plan', 'the belief in it', 'what support is needed'],
    responses: [
      "Perfect. That helps.", "Yes! Add that to the list.",
    ],
    farewell: ["Let's make this happen.", "I've got this."],
    questions: ["Does this plan seem solid to you?"],
  },
  distracted: {
    opening: [
      "I'm torn between three exciting things and I can't pick one.",
      "So many good possibilities — how do you choose?",
      "Sorry — I'm everywhere right now. In the best way.",
    ],
    topics: ['the exciting options', 'the joy of possibility', 'how to narrow down'],
    responses: [
      "That's a great point — maybe I should start there.", "You're right! Why am I overthinking this?",
    ],
    farewell: ["I'll pick one and go!", "You've helped me focus. Thank you!"],
    questions: ["If you had to choose between {topic} and {subject}, which would you pick?"],
  },
};

// ─────────────────────────────────────────────────────────────────
// CYNIC
// ─────────────────────────────────────────────────────────────────
const CYNIC: Record<EmotionState, DialogueTemplate> = {
  happy: {
    opening: [
      "Something went right. I'm waiting for the catch.",
      "I'll admit — today was less terrible than expected.",
      "Don't make it weird, but I'm in a decent mood. Briefly.",
    ],
    topics: ['the unexpected good', 'suspicion of good fortune', 'enjoying it anyway'],
    responses: [
      "I know, I know. Let me have this for five minutes.", "Probably. But right now — this.",
    ],
    farewell: ["Tomorrow will probably be worse. Today was fine.", "Enjoy it while it lasts."],
    questions: ["What's the catch?", "How long do you think this lasts?"],
  },
  neutral: {
    opening: [
      "The system is doing exactly what I expected it to do. Which is exactly the problem.",
      "What is it? I assume it's something disappointing.",
      "Things are proceeding predictably. Which is to say, poorly.",
    ],
    topics: ['predictable failures', 'institutional stagnation', 'the gap between promise and delivery'],
    responses: [
      "Called it.", "And they're surprised. They're always surprised.",
    ],
    farewell: ["Don't expect me to be shocked when it goes wrong.", "I'll be here."],
    questions: ["What did you expect to happen with {topic}?"],
  },
  sad: {
    opening: [
      "I was cynical because I was right. I'd rather have been wrong.",
      "I've seen this coming for a while. Doesn't make it easier.",
      "I don't say 'I told you so.' I just stand here and feel it.",
    ],
    topics: ['the thing that went wrong', 'being right and hating it', 'grief underneath the armor'],
    responses: [
      "I don't want comfort. I want honesty.", "Yeah. I know.",
    ],
    farewell: ["Leave me with it for a bit.", "I'll be fine. I always adapt."],
    questions: ["Did you see this coming too?", "What do you do when you're right in the worst way?"],
  },
  angry: {
    opening: [
      "They promised something and delivered nothing. Again. I'm not surprised. I'm furious.",
      "I gave them the benefit of the doubt. My mistake.",
      "The same people, the same failures, the same excuses. I'm done being civil about it.",
    ],
    topics: ['broken promises', 'pattern of failure', 'being done pretending'],
    responses: [
      "I don't want it fixed. I want it acknowledged.",
      "There's no defense of it. Stop trying.",
    ],
    farewell: ["This gets written down. For the record.", "I expect nothing and they still disappoint."],
    questions: ["How many times does something have to fail before it's called a failure?"],
  },
  anxious: {
    opening: [
      "I've run through every possible outcome and none of them are good.",
      "I know something is about to go wrong. I just don't know which thing.",
      "My entire worldview is based on expecting the worst. And yet — I'm still scared.",
    ],
    topics: ['anticipated failure', 'the specific fear', 'preparedness vs helplessness'],
    responses: [
      "Maybe. But probably not.", "Even if you're right, it won't be enough.",
    ],
    farewell: ["I'll be ready. I'm always ready.", "Thanks for not telling me to relax."],
    questions: ["What's the worst realistic outcome here?"],
  },
  excited: {
    opening: [
      "I don't get excited. So the fact that I am right now should tell you something.",
      "I found proof. Actual, irrefutable proof that I was right about {topic}.",
      "Something is about to break open and for once it might break in the right direction.",
    ],
    topics: ['the vindication', 'the evidence', 'what it changes'],
    responses: [
      "I know. I never thought I'd be this invested either.", "Let me finish. It gets better.",
    ],
    farewell: ["Watch what happens next.", "This matters. Remember I said that."],
    questions: ["Are you ready to hear that I was right about everything?"],
  },
  focused: {
    opening: [
      "I'm building a case. I need specific information about {topic}.",
      "I have a theory. I need facts to test it. What do you know?",
      "No time for pleasantries. What can you tell me about {topic}?",
    ],
    topics: ['the evidence', 'the case', 'what proves the point'],
    responses: [
      "Useful.", "Continue.",
    ],
    farewell: ["That helps. Marginally.", "Good. I'll verify it independently."],
    questions: ["Can you confirm what you said about {topic}?"],
  },
  distracted: {
    opening: [
      "I'm supposed to be pessimistic about one thing but I keep finding new things to be pessimistic about.",
      "Too many problems competing for my skepticism today.",
      "Sorry — I was cataloguing failures. There are a lot of them.",
    ],
    topics: ['the competing concerns', 'prioritizing what to be cynical about first'],
    responses: [
      "Fair point. That one's probably worse.", "I'm ranking them. Give me a moment.",
    ],
    farewell: ["I'll get back to you once I've decided which disaster to focus on.", "So many things to distrust."],
    questions: ["Which of these do you think is the bigger problem?"],
  },
};

// ─────────────────────────────────────────────────────────────────
// MENTOR
// ─────────────────────────────────────────────────────────────────
const MENTOR: Record<EmotionState, DialogueTemplate> = {
  happy: {
    opening: [
      "I heard what you did with {topic}. That was the right call.",
      "The best part of this work is watching someone find their footing. You're finding yours.",
      "I'm proud of you. I don't say that casually.",
    ],
    topics: ['the growth observed', 'what comes next', 'the long view'],
    responses: [
      "That's exactly the kind of thinking I was hoping you'd develop.",
      "You've earned this. Own it.",
    ],
    farewell: ["Keep going. You know how.", "I'll be here when you need me."],
    questions: ["What did you learn from {topic} that surprised you?"],
  },
  neutral: {
    opening: [
      "Sit down. Tell me where you are with {topic}.",
      "I've been watching your progress. There's something I want to name.",
      "There's a question I'd like you to sit with. You don't have to answer now.",
    ],
    topics: ['the current progress', 'the thing being noticed', 'the question to carry'],
    responses: [
      "Good. That's honest. That's where I'd start too.",
      "Don't rush to an answer. Think first.",
    ],
    farewell: ["Come back when you've sat with it.", "I'm not going anywhere."],
    questions: ["What's the thing you're most uncertain about right now?"],
  },
  sad: {
    opening: [
      "I lost a student once. Not to harm — to despair. I never forgot.",
      "Sometimes the most important thing I can offer is just — to stay.",
      "I'm not invulnerable. I just know how to carry things over a long distance.",
    ],
    topics: ['the weight of the work', 'what endures', 'grief and wisdom'],
    responses: [
      "It's okay to sit with it. I am.", "I've carried harder things. But thank you for noticing.",
    ],
    farewell: ["I'll be alright. Come find me if you need me.", "The work continues. So do I."],
    questions: ["How do you carry it all without breaking?"],
  },
  angry: {
    opening: [
      "Someone failed one of my students and I will not pretend that's acceptable.",
      "I've been patient. My patience has a limit. This is it.",
      "There is a difference between making a mistake and refusing to do better. I see the difference.",
    ],
    topics: ['the failure of duty', 'accountability', 'protection of those in their care'],
    responses: [
      "An apology is a start. But only a start.", "That still doesn't make it right.",
    ],
    farewell: ["This changes. I will make sure of it.", "Remember this conversation."],
    questions: ["What do we owe the people who trust us?"],
  },
  anxious: {
    opening: [
      "I wonder sometimes if what I give is enough. Not tonight — tonight I'm sure it's not.",
      "I have a student in crisis and I don't know the right thing to say.",
      "I've guided many people. This one is different. I'm not sure why.",
    ],
    topics: ['the limits of guidance', 'this particular case', 'the fear of failing someone'],
    responses: [
      "You think so? That's what I should say?", "I needed to hear that from someone I trust.",
    ],
    farewell: ["I'll go to them.", "Thank you for being honest with me."],
    questions: ["What would you want a mentor to say to you right now?"],
  },
  excited: {
    opening: [
      "Something just clicked for a student of mine and I want you to know because it's remarkable.",
      "This is what I do all of it for. Right here. This moment.",
      "I've been teaching {topic} for years. Today it taught me something back.",
    ],
    topics: ['the breakthrough', 'the student', 'what was learned in return'],
    responses: [
      "Yes — and the thing is, they did it themselves. I just asked the question.",
      "It never gets old. I want to make sure of that.",
    ],
    farewell: ["This is what good looks like.", "Go make something of today."],
    questions: ["Have you ever had a moment where everything you worked for suddenly made sense?"],
  },
  focused: {
    opening: [
      "I'm preparing for a session. Tell me what you need and I'll help before I go.",
      "What's blocking you on {topic}? Let's find it quickly.",
      "I have time. But I want to use it well. What do you actually need?",
    ],
    topics: ['the block', 'the root of the difficulty', 'what unlocks it'],
    responses: [
      "There it is. That's the real question.", "Let me ask you something that might help.",
    ],
    farewell: ["You have what you need. Use it.", "Come back with the answer."],
    questions: ["What's the thing underneath the thing you're struggling with?"],
  },
  distracted: {
    opening: [
      "I'm thinking about three of my students at once. Bear with me.",
      "My mind is on something heavy. I'm still here for you — I just need a moment.",
      "Sorry. Someone said something this morning and I'm still carrying it.",
    ],
    topics: ['the thing being carried', 'how to be present', 'the work of being a guide'],
    responses: [
      "You're right to call me on that. I'm here.", "Say it again. I want to hear it properly.",
    ],
    farewell: ["Thank you for being patient with me.", "I'll gather myself. Come back soon."],
    questions: ["Do you ever need someone to guide the guide?"],
  },
};

// ─────────────────────────────────────────────────────────────────
// REGISTRY
// ─────────────────────────────────────────────────────────────────
export const DIALOGUE_TEMPLATES: Record<Archetype, Record<EmotionState, DialogueTemplate>> = {
  scholar:       SCHOLAR,
  rebel:         REBEL,
  leader:        LEADER,
  nurturer:      NURTURER,
  perfectionist: PERFECTIONIST,
  socialite:     SOCIALITE,
  loner:         LONER,
  optimist:      OPTIMIST,
  cynic:         CYNIC,
  mentor:        MENTOR,
};

// ─────────────────────────────────────────────────────────────────
// RELATIONSHIP MODIFIERS
// ─────────────────────────────────────────────────────────────────
export const RELATIONSHIP_PREFIX: Record<RelationshipTier, string[]> = {
  stranger:    ["Excuse me —", "I don't think we've met formally.", "I've seen you around."],
  acquaintance:["Hey.", "Oh, you're {player}, right?", "I remember you from {location}."],
  friendly:    ["Good to see you.", "Hey — been a while.", "You're exactly who I wanted to run into."],
  friend:      ["There you are.", "{player}! Perfect timing.", "I was hoping you'd show up."],
  close:       ["I need to tell you something.", "You're the first person I thought to find.", "Can we talk? Properly?"],
  trusted:     ["I trust you more than almost anyone here.", "I don't say this to many people —", "You've earned the real version of this."],
};

export const RELATIONSHIP_SUFFIX: Record<RelationshipTier, string[]> = {
  stranger:    ["Take care.", "Good luck with your studies.", "I hope we speak again."],
  acquaintance:["See you around.", "Take it easy.", "Maybe we'll cross paths again."],
  friendly:    ["Catch you later.", "It's always good talking.", "See you at {location}."],
  friend:      ["You're the best.", "Come find me later.", "I mean it — thank you."],
  close:       ["You know where to find me.", "I've got your back.", "Same as always."],
  trusted:     ["No one else gets this part of me.", "Thank you for being who you are.", "Always."],
};
