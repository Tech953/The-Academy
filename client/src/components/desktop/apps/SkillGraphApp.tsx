/**
 * Skill Graph App
 * Visual representation of the GED-aligned competency graph with mastery tracking.
 */

import { useState, useEffect } from 'react';
import { Network, Target, CheckCircle2, Circle, AlertCircle, ChevronRight } from 'lucide-react';
import { 
  skillGraph, 
  type SkillNode, 
  type SkillDomain,
  MasterySignalExtractor,
  confidenceEstimator,
  type MasteryState 
} from '@/lib/academy-engine';

interface SkillGraphAppProps {
  windowId: string;
  studentId?: string;
}

const ACCENT_COLORS = {
  green: '#00ff41',
  cyan: '#00d4ff',
  amber: '#ffb000',
  purple: '#bf00ff',
  pink: '#ff0080',
  red: '#ff3366'
};

const DOMAIN_COLORS: Record<SkillDomain, string> = {
  Math: ACCENT_COLORS.cyan,
  Language: ACCENT_COLORS.green,
  Science: ACCENT_COLORS.purple,
  Social: ACCENT_COLORS.amber,
  Reasoning: ACCENT_COLORS.pink
};

const MASTERY_COLORS: Record<MasteryState, string> = {
  insufficient_data: '#666',
  fragile: ACCENT_COLORS.red,
  emerging: ACCENT_COLORS.amber,
  stable: ACCENT_COLORS.green
};

export function SkillGraphApp({ windowId, studentId = 'default-student' }: SkillGraphAppProps) {
  const [mastery] = useState(() => new MasterySignalExtractor(studentId));
  const [selectedDomain, setSelectedDomain] = useState<SkillDomain | 'all'>('all');
  const [selectedSkill, setSelectedSkill] = useState<SkillNode | null>(null);
  const [nodes, setNodes] = useState<SkillNode[]>([]);

  useEffect(() => {
    const allNodes = skillGraph.getAllNodes();
    if (selectedDomain === 'all') {
      setNodes(allNodes);
    } else {
      setNodes(skillGraph.getNodesByDomain(selectedDomain));
    }
  }, [selectedDomain]);

  const getMasteryState = (skillId: string): MasteryState => {
    const signal = mastery.getSignal(skillId);
    return signal?.state || 'insufficient_data';
  };

  const getConfidenceBand = (skillId: string) => {
    const state = getMasteryState(skillId);
    return confidenceEstimator.estimate(state);
  };

  const domains: SkillDomain[] = ['Math', 'Language', 'Science', 'Social', 'Reasoning'];
  
  const progress = mastery.getOverallProgress();
  const stableCount = progress.stable;
  const totalAttempted = progress.stable + progress.emerging + progress.fragile;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: '#0a0a0a',
      color: ACCENT_COLORS.green,
      fontFamily: '"Courier New", monospace',
      fontSize: '13px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px',
        borderBottom: `1px solid ${ACCENT_COLORS.green}40`,
        background: '#0d0d0d'
      }}>
        <Network size={20} color={ACCENT_COLORS.purple} />
        <span style={{ color: ACCENT_COLORS.purple, fontWeight: 'bold' }}>SKILL GRAPH</span>
        <span style={{ color: '#666', marginLeft: 'auto' }}>
          {stableCount} mastered | {totalAttempted} attempted | {nodes.length} total skills
        </span>
      </div>

      <div style={{
        display: 'flex',
        gap: '8px',
        padding: '12px',
        borderBottom: `1px solid ${ACCENT_COLORS.green}20`,
        flexWrap: 'wrap'
      }}>
        <button
          onClick={() => setSelectedDomain('all')}
          style={{
            padding: '4px 12px',
            background: selectedDomain === 'all' ? ACCENT_COLORS.green + '20' : 'transparent',
            border: `1px solid ${selectedDomain === 'all' ? ACCENT_COLORS.green : '#444'}`,
            color: selectedDomain === 'all' ? ACCENT_COLORS.green : '#888',
            borderRadius: '4px',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: '11px'
          }}
        >
          All Domains
        </button>
        
        {domains.map(domain => (
          <button
            key={domain}
            onClick={() => setSelectedDomain(domain)}
            style={{
              padding: '4px 12px',
              background: selectedDomain === domain ? DOMAIN_COLORS[domain] + '20' : 'transparent',
              border: `1px solid ${selectedDomain === domain ? DOMAIN_COLORS[domain] : '#444'}`,
              color: selectedDomain === domain ? DOMAIN_COLORS[domain] : '#888',
              borderRadius: '4px',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: '11px'
            }}
          >
            {domain}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{
          width: '60%',
          overflow: 'auto',
          padding: '12px',
          borderRight: `1px solid ${ACCENT_COLORS.green}20`
        }}>
          {domains.filter(d => selectedDomain === 'all' || d === selectedDomain).map(domain => {
            const domainNodes = nodes.filter(n => n.domain === domain);
            if (domainNodes.length === 0) return null;
            
            return (
              <div key={domain} style={{ marginBottom: '20px' }}>
                <h3 style={{ 
                  color: DOMAIN_COLORS[domain],
                  fontSize: '12px',
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Target size={14} />
                  {domain}
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {domainNodes.map(node => {
                    const state = getMasteryState(node.id);
                    const isSelected = selectedSkill?.id === node.id;
                    
                    return (
                      <div
                        key={node.id}
                        onClick={() => setSelectedSkill(node)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 12px',
                          background: isSelected ? DOMAIN_COLORS[domain] + '15' : '#111',
                          border: `1px solid ${isSelected ? DOMAIN_COLORS[domain] : '#222'}`,
                          borderRadius: '4px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {state === 'stable' && <CheckCircle2 size={14} color={MASTERY_COLORS.stable} />}
                        {state === 'emerging' && <Circle size={14} color={MASTERY_COLORS.emerging} />}
                        {state === 'fragile' && <AlertCircle size={14} color={MASTERY_COLORS.fragile} />}
                        {state === 'insufficient_data' && <Circle size={14} color={MASTERY_COLORS.insufficient_data} />}
                        
                        <span style={{ flex: 1, color: '#ccc' }}>{node.name}</span>
                        
                        <span style={{
                          fontSize: '10px',
                          padding: '2px 6px',
                          borderRadius: '3px',
                          background: MASTERY_COLORS[state] + '20',
                          color: MASTERY_COLORS[state]
                        }}>
                          {state === 'insufficient_data' ? 'not started' : state}
                        </span>
                        
                        <ChevronRight size={14} color="#444" />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{
          width: '40%',
          padding: '12px',
          overflow: 'auto'
        }}>
          {selectedSkill ? (
            <div>
              <h3 style={{ 
                color: DOMAIN_COLORS[selectedSkill.domain],
                marginBottom: '12px'
              }}>
                {selectedSkill.name}
              </h3>
              
              <p style={{ color: '#888', marginBottom: '16px', lineHeight: 1.5 }}>
                {selectedSkill.description}
              </p>
              
              <div style={{ marginBottom: '16px' }}>
                <span style={{ color: '#666', fontSize: '11px' }}>SKILL ID</span>
                <p style={{ color: ACCENT_COLORS.cyan, fontSize: '12px' }}>{selectedSkill.id}</p>
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <span style={{ color: '#666', fontSize: '11px' }}>COGNITIVE LOAD</span>
                <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                  {[1, 2, 3, 4, 5].map(level => (
                    <div
                      key={level}
                      style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '2px',
                        background: level <= selectedSkill.cognitiveLoad 
                          ? DOMAIN_COLORS[selectedSkill.domain] 
                          : '#333'
                      }}
                    />
                  ))}
                </div>
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <span style={{ color: '#666', fontSize: '11px' }}>REPRESENTATIONS</span>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px' }}>
                  {selectedSkill.representations.map(rep => (
                    <span
                      key={rep}
                      style={{
                        fontSize: '10px',
                        padding: '2px 8px',
                        background: '#222',
                        border: '1px solid #333',
                        borderRadius: '3px',
                        color: '#888'
                      }}
                    >
                      {rep}
                    </span>
                  ))}
                </div>
              </div>
              
              {selectedSkill.prerequisites.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <span style={{ color: '#666', fontSize: '11px' }}>PREREQUISITES</span>
                  <div style={{ marginTop: '4px' }}>
                    {selectedSkill.prerequisites.map(prereq => {
                      const prereqNode = skillGraph.getNode(prereq);
                      const prereqState = getMasteryState(prereq);
                      return (
                        <div
                          key={prereq}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '4px 8px',
                            background: '#111',
                            borderRadius: '3px',
                            marginBottom: '4px'
                          }}
                        >
                          {prereqState === 'stable' 
                            ? <CheckCircle2 size={12} color={ACCENT_COLORS.green} />
                            : <Circle size={12} color="#666" />
                          }
                          <span style={{ color: '#888', fontSize: '11px' }}>
                            {prereqNode?.name || prereq}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              <div style={{ marginBottom: '16px' }}>
                <span style={{ color: '#666', fontSize: '11px' }}>MASTERY STATUS</span>
                <div style={{
                  marginTop: '8px',
                  padding: '12px',
                  background: MASTERY_COLORS[getMasteryState(selectedSkill.id)] + '10',
                  border: `1px solid ${MASTERY_COLORS[getMasteryState(selectedSkill.id)]}40`,
                  borderRadius: '4px'
                }}>
                  <span style={{ 
                    color: MASTERY_COLORS[getMasteryState(selectedSkill.id)],
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    fontSize: '11px'
                  }}>
                    {getMasteryState(selectedSkill.id) === 'insufficient_data' 
                      ? 'Not Started' 
                      : getMasteryState(selectedSkill.id)}
                  </span>
                  <p style={{ color: '#888', fontSize: '11px', marginTop: '4px' }}>
                    {confidenceEstimator.getEncouragingMessage(getConfidenceBand(selectedSkill.id))}
                  </p>
                </div>
              </div>
              
              {selectedSkill.gedAlignment && (
                <div>
                  <span style={{ color: '#666', fontSize: '11px' }}>GED ALIGNMENT</span>
                  <p style={{ color: ACCENT_COLORS.amber, fontSize: '12px', marginTop: '4px' }}>
                    {selectedSkill.gedAlignment}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div style={{ 
              textAlign: 'center', 
              color: '#666', 
              padding: '40px' 
            }}>
              <Network size={40} style={{ marginBottom: '12px', opacity: 0.5 }} />
              <p>Select a skill to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
