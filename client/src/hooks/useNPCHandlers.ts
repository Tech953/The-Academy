import { GameState, TerminalLine, gameStateManager } from '@/lib/gameState';
import { getEmotionalState, radiantAI as radiantAISingleton, addMemory as addNPCMemory } from '@/lib/radiantAI';
import {
  getOrCreateNPCLog,
  appendConversationEntries,
  getConvHistoryForAI,
  getMemorySummary,
  getEncounterNote,
} from '@/lib/npcMemoryStore';
import { NPC } from '@shared/schema';

export interface NPCDeps {
  gameState: GameState | null;
  character: any;
  addTerminalLine: (text: string, type?: TerminalLine['type']) => void;
  setTerminalLines: React.Dispatch<React.SetStateAction<TerminalLine[]>>;
  radiantAI: any;
  lastTalkedNpcRef: React.MutableRefObject<{ id: string; name: string; topics: string[] } | null>;
  sessionIdRef: React.MutableRefObject<string>;
  addMessage: (msg: any) => void;
}

export function useNPCHandlers(deps: NPCDeps) {
  const {
    gameState, character, addTerminalLine, setTerminalLines,
    radiantAI, lastTalkedNpcRef, sessionIdRef, addMessage,
  } = deps;

  async function callNpcDialogueAI(
    npc: NPC,
    playerMessage: string,
    topicContextText?: string,
    topicKey?: string,
  ): Promise<string | null> {
    const radiantNPC = radiantAI.getNPC(npc.id);
    const relationship = radiantNPC ? radiantAI.getRelationshipWithPlayer(npc.id) : null;
    const dialogue = npc.dialogue as any;
    const knownTopics = dialogue.topics || {};
    const charId = character?.name ?? 'default';
    const playerName = character?.name || '';
    const history = getConvHistoryForAI(charId, npc.id, 30);
    const memorySummary = getMemorySummary(charId, npc.id, playerName);
    const contextualMessage = topicContextText
      ? `${playerMessage}\n[Context — your known view on this: "${topicContextText}"]`
      : playerMessage;
    try {
      const res = await fetch('/api/npc-dialogue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          npcName: npc.name,
          npcTitle: npc.title || '',
          npcRole: (npc as any).role || '',
          npcFaction: (npc as any).faction || '',
          npcSpecialty: radiantNPC?.specialty || '',
          npcPersonality: radiantNPC?.personality,
          npcEmotions: radiantNPC?.emotions,
          npcQuirks: radiantNPC?.quirks || [],
          npcBackstory: radiantNPC?.backstory || '',
          npcGoals: radiantNPC?.goals?.filter((g: any) => g.status === 'active').map((g: any) => g.description) || [],
          npcClub: radiantNPC?.club || '',
          npcSecretSociety: radiantNPC?.secretSociety || '',
          npcRelationship: relationship?.type || 'stranger',
          knownTopics,
          locationName: gameState?.currentLocation?.name || '',
          playerName,
          playerMessage: contextualMessage,
          conversationHistory: history,
          memorySummary: memorySummary ?? undefined,
        }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.response || data.fallback || null;
    } catch {
      return null;
    }
  }

  async function updateConversationReputation(npc: any, topic: string) {
    if (!gameState) return;
    let reputationGain = 1;
    if (npc.faction === gameState.character.faction) reputationGain += 1;
    if (topic.includes('academy') || topic.includes('secret')) reputationGain += 1;
    if (reputationGain > 1) {
      addTerminalLine('');
      addTerminalLine(`Your conversation with ${npc.name.split(' ')[0]} has strengthened your reputation.`, 'system');
    }
  }

  async function talk(target: string) {
    const npcs = await gameStateManager.getNPCsInCurrentLocation();
    const npc = npcs.find(n =>
      n.name.toLowerCase().includes(target.toLowerCase()) ||
      n.title?.toLowerCase().includes(target.toLowerCase()) ||
      target.toLowerCase().includes(n.name.toLowerCase().split(' ')[0])
    );

    if (npc) {
      addTerminalLine('');
      let archetypeId = 'STUDENT_NPC';
      if (
        npc.faction === 'faculty' ||
        npc.title?.toLowerCase().includes('professor') ||
        npc.title?.toLowerCase().includes('dean') ||
        npc.title?.toLowerCase().includes('instructor')
      ) {
        archetypeId = 'FACULTY_NPC';
      }
      const radiantNPC = radiantAI.getNPC(npc.id);
      const npcMood = radiantNPC ? getEmotionalState(radiantNPC.emotions) : 'neutral';
      const playerRelationship = radiantNPC ? radiantAI.getRelationshipWithPlayer(npc.id) : null;
      const outcome = gameStateManager.processInteraction('Talk' as any, archetypeId);
      if (radiantNPC) {
        const interactionOutcome = outcome?.success ? 'positive' : (outcome?.wasMisread ? 'negative' : 'neutral');
        radiantAI.processInteraction(npc.id, 'talk', interactionOutcome);
      }
      if (outcome?.wasMisread) {
        addTerminalLine(outcome.message, 'system');
        addTerminalLine('');
      }
      const dialogue = npc.dialogue as any;
      const greeting = dialogue.greeting || 'Hello there.';
      let moodPrefix = '';
      if (radiantNPC) {
        const moodMap: Record<string, string> = {
          joyful: '*smiling warmly* ', anxious: '*nervously* ', distressed: '*looking troubled* ',
          confident: '*with assurance* ', insecure: '*hesitantly* ', intrigued: '*curiously* ',
          suspicious: '*watching you carefully* ', melancholic: '*sighing softly* ',
        };
        moodPrefix = moodMap[npcMood] ?? '';
      }
      if (outcome && !outcome.success && outcome.wasMisread) {
        addTerminalLine(`${npc.name}: *eyes you suspiciously* "${greeting}"`);
      } else {
        addTerminalLine(`${npc.name}: ${moodPrefix}"${greeting}"`);
      }
      if (playerRelationship && playerRelationship.type !== 'stranger') {
        const firstName = npc.name.split(' ')[0];
        const relText = playerRelationship.type === 'friendship'
          ? `${firstName} considers you a friend.`
          : playerRelationship.type === 'rivalry'
          ? `There's tension between you and ${firstName}.`
          : playerRelationship.type === 'mentorship'
          ? `${firstName} has taken an interest in guiding you.`
          : `${firstName} knows you as an acquaintance.`;
        addTerminalLine(`[${relText}]`, 'system');
      }
      const topicKeys = Object.keys(dialogue.topics || {});
      lastTalkedNpcRef.current = { id: npc.id, name: npc.name, topics: topicKeys };
      const charId = character?.name ?? 'default';
      getOrCreateNPCLog(charId, npc.id, npc.name, sessionIdRef.current);
      const encounterNote = getEncounterNote(charId, npc.id, npc.name.split(' ')[0], sessionIdRef.current);
      if (encounterNote) addTerminalLine(encounterNote, 'system');
      if (topicKeys.length > 0) {
        const firstName = npc.name.split(' ')[0];
        addTerminalLine('');
        addTerminalLine(`You can ask ${firstName} about:`, 'system');
        topicKeys.forEach(topic => addTerminalLine(`- ${topic.replace(/_/g, ' ').toUpperCase()}`));
        addTerminalLine('');
        addTerminalLine(`Type the topic name to continue the conversation.`, 'system');
        addTerminalLine(`Example: just type "${topicKeys[0].replace(/_/g, ' ').toUpperCase()}"`, 'system');
      }
      if (gameState && npc.faction) {
        const playerFaction = gameState.character.faction;
        if (playerFaction === npc.faction) {
          addTerminalLine('');
          addTerminalLine(`${npc.name.split(' ')[0]} regards you warmly as a fellow ${npc.faction}.`, 'system');
        } else if (playerFaction && npc.faction) {
          addTerminalLine('');
          addTerminalLine(`${npc.name.split(' ')[0]} seems cautious - different factions often have complex relationships.`, 'system');
        }
      }
      if (gameStateManager.isMythicFlagActive('WatchersEye') && archetypeId === 'FACULTY_NPC') {
        addTerminalLine('');
        addTerminalLine('[You sense this faculty member already knows things about you...]', 'system');
      }
      if (Math.random() < 0.15) {
        const followUpMessages: Record<string, string[]> = {
          FACULTY_NPC: [
            `I've been thinking about our conversation. Please review the assigned readings when you get a chance.`,
            `Good to meet you. Remember, my office hours are always open if you have questions.`,
            `It was nice talking with you. I see potential in you - don't waste it.`,
          ],
          STUDENT_NPC: [
            `Hey! Nice talking to you earlier. We should hang out more.`,
            `Thanks for the chat! This place can be weird but at least we're in it together.`,
            `Good running into you. Let me know if you want to study together sometime!`,
          ],
        };
        const pool = followUpMessages[archetypeId] || followUpMessages['STUDENT_NPC'];
        const followUpContent = pool[Math.floor(Math.random() * pool.length)];
        setTimeout(() => {
          addMessage({
            from: npc.name,
            fromTitle: npc.title || (archetypeId === 'FACULTY_NPC' ? 'Faculty' : 'Student'),
            content: followUpContent,
          });
        }, 5000 + Math.random() * 10000);
      }
    } else {
      addTerminalLine('');
      const lastNpc = lastTalkedNpcRef.current;
      if (lastNpc && lastNpc.topics.length > 0) {
        const targetNorm = target.toLowerCase().replace(/[_\s]/g, '');
        const topicMatch = lastNpc.topics.find(t =>
          t.toLowerCase().replace(/[_\s]/g, '') === targetNorm ||
          t.toLowerCase().replace(/[_\s]/g, '').startsWith(targetNorm.slice(0, 4)) ||
          targetNorm.startsWith(t.toLowerCase().replace(/[_\s]/g, '').slice(0, 4))
        );
        if (topicMatch) {
          addTerminalLine(`[ "${target}" looks like a topic — talking to ${lastNpc.name.split(' ')[0]} about ${topicMatch.replace(/_/g, ' ').toUpperCase()} ]`, 'system');
          await talkTopic(lastNpc.name, topicMatch);
          return;
        }
        addTerminalLine(`[ Asking ${lastNpc.name.split(' ')[0]} about "${target}" ]`, 'system');
        await talkTopic(lastNpc.name, target, true);
      } else {
        addTerminalLine(`You don't see anyone named "${target}" here.`, 'error');
        addTerminalLine('Type LIST to see who is present, or LOOK to check your surroundings.', 'system');
      }
    }
  }

  async function talkTopic(personName: string, topic: string, freeForm = false) {
    const npcs = await gameStateManager.getNPCsInCurrentLocation();
    const npc = npcs.find(n =>
      n.name.toLowerCase().includes(personName.toLowerCase()) ||
      personName.toLowerCase().includes(n.name.toLowerCase().split(' ')[0]) ||
      n.name.toLowerCase() === personName.toLowerCase()
    );
    if (!npc) {
      addTerminalLine('');
      addTerminalLine(`You don't see anyone named ${personName} here.`, 'error');
      return;
    }
    const dialogue = npc.dialogue as any;
    const topics = dialogue.topics || {};
    const firstName = npc.name.split(' ')[0];
    let matchedTopic: string | null = null;
    let topicContextText: string | null = null;
    if (!freeForm) {
      if (topics[topic]) { matchedTopic = topic; topicContextText = topics[topic]; }
      else if (topics[topic.replace(/_/g, '')]) {
        matchedTopic = topic.replace(/_/g, ''); topicContextText = topics[matchedTopic];
      } else {
        const k = Object.keys(topics).find(t =>
          t.toLowerCase().replace(/\s+/g, '_') === topic.toLowerCase().replace(/\s+/g, '_')
        );
        if (k) { matchedTopic = k; topicContextText = topics[k]; }
      }
      if (!matchedTopic) {
        const norm = (s: string) => s.toLowerCase().replace(/[_\s]/g, '');
        const nq = norm(topic);
        const fk = Object.keys(topics).find(t => {
          const n = norm(t);
          return n === nq || (n.startsWith(nq.slice(0, 4)) && nq.length >= 4) || (nq.startsWith(n.slice(0, 4)) && n.length >= 4);
        });
        if (fk) {
          matchedTopic = fk; topicContextText = topics[fk];
          addTerminalLine(`[ Interpreted as: ${fk.replace(/_/g, ' ').toUpperCase()} ]`, 'system');
        }
      }
    }
    const displayTopic = matchedTopic ? matchedTopic.replace(/_/g, ' ') : topic.replace(/_/g, ' ');
    const playerMessage = freeForm ? topic : `Tell me about ${displayTopic}.`;
    addTerminalLine('');
    addTerminalLine(`You: "${freeForm ? topic : `Tell me about ${displayTopic}`}"`, 'system');
    const thinkingText = `[ ${firstName} is thinking... ]`;
    addTerminalLine(thinkingText, 'system');
    const charId = character?.name ?? 'default';
    const locationName = gameState?.currentLocation?.name || '';
    const aiResponse = await callNpcDialogueAI(
      npc, playerMessage, topicContextText ?? undefined, matchedTopic ?? undefined,
    );
    setTerminalLines(prev => prev.filter(l => l.text !== thinkingText));
    if (aiResponse) {
      addTerminalLine(`${npc.name}: "${aiResponse}"`);
      appendConversationEntries(
        charId, npc.id, npc.name,
        [
          { isFromPlayer: true, content: playerMessage, topic: matchedTopic ?? undefined, location: locationName },
          { isFromPlayer: false, content: aiResponse, topic: matchedTopic ?? undefined, location: locationName },
        ],
        locationName,
        sessionIdRef.current,
      );
      const rawNPC = radiantAISingleton.getNPC(npc.id);
      if (rawNPC) {
        const updatedWithMemory = addNPCMemory(
          rawNPC, 'interaction', character?.name || 'player',
          `Discussed "${matchedTopic ?? topic.replace(/_/g, ' ')}" — player said: "${playerMessage.slice(0, 100)}"`,
          1, matchedTopic ? 4 : 2,
        );
        radiantAISingleton.updateNPC(npc.id, updatedWithMemory);
      }
      if (gameState && matchedTopic) await updateConversationReputation(npc, matchedTopic);
      const persistentHistory = getConvHistoryForAI(charId, npc.id, 100);
      const exchangeCount = Math.floor(persistentHistory.filter(e => !e.isFromPlayer).length);
      const topicKeys = Object.keys(topics);
      if (exchangeCount > 0 && exchangeCount % 2 === 0 && topicKeys.length > 1) {
        const remaining = topicKeys.filter(t => t !== matchedTopic);
        if (remaining.length > 0) {
          addTerminalLine('');
          addTerminalLine(
            `[ You can also ask about: ${remaining.slice(0, 3).map(t => t.replace(/_/g, ' ').toUpperCase()).join(', ')} ]`,
            'system',
          );
        }
      }
    } else {
      if (topicContextText) {
        addTerminalLine(`${npc.name}: "${topicContextText}"`);
        appendConversationEntries(
          charId, npc.id, npc.name,
          [
            { isFromPlayer: true, content: playerMessage, topic: matchedTopic ?? undefined, location: locationName },
            { isFromPlayer: false, content: topicContextText, topic: matchedTopic ?? undefined, location: locationName },
          ],
          locationName, sessionIdRef.current,
        );
      } else {
        addTerminalLine(`${npc.name}: "I'm not sure how to answer that right now."`);
        const topicKeys = Object.keys(topics);
        if (topicKeys.length > 0) {
          addTerminalLine('');
          addTerminalLine(`You can ask ${firstName} about:`, 'system');
          topicKeys.slice(0, 4).forEach(t => addTerminalLine(`- ${t.replace(/_/g, ' ').toUpperCase()}`));
        }
      }
    }
  }

  return { talk, talkTopic, callNpcDialogueAI };
}
