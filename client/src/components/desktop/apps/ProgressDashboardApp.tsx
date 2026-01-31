/**
 * Progress Dashboard App
 * Comprehensive view of mastery signals, confidence bands, and GED readiness.
 */

import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Award, Target, BookOpen, GraduationCap } from 'lucide-react';
import { 
  MasterySignalExtractor,
  confidenceEstimator,
  type ConfidenceBand,
  StudentProfile,
  StudentJournal,
  skillGraph
} from '@/lib/academy-engine';

interface ProgressDashboardAppProps {
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

const CONFIDENCE_COLORS: Record<ConfidenceBand, string> = {
  unknown: '#666',
  emerging: ACCENT_COLORS.amber,
  stabilizing: ACCENT_COLORS.cyan,
  reliable: ACCENT_COLORS.green
};

export function ProgressDashboardApp({ windowId, studentId = 'default-student' }: ProgressDashboardAppProps) {
  const [mastery] = useState(() => new MasterySignalExtractor(studentId));
  const [profile] = useState(() => new StudentProfile(studentId));
  const [journal] = useState(() => new StudentJournal(studentId));

  const progress = mastery.getOverallProgress();
  const journalStats = journal.getStats();
  const profileData = profile.getData();
  
  const totalSkills = skillGraph.getAllNodes().length;
  const masteredCount = progress.stable;
  const emergingCount = progress.emerging;
  const fragileCount = progress.fragile;
  
  const domains = ['Math', 'Language', 'Science', 'Social', 'Reasoning'] as const;
  
  const getDomainProgress = (domainPrefix: string) => {
    const domainSkills = skillGraph.getAllNodes().filter(n => n.id.startsWith(domainPrefix));
    const stableSkills = mastery.getStableSkills().filter(id => id.startsWith(domainPrefix));
    return {
      total: domainSkills.length,
      mastered: stableSkills.length,
      percent: domainSkills.length > 0 ? (stableSkills.length / domainSkills.length) * 100 : 0
    };
  };

  const domainPrefixes: Record<string, string> = {
    Math: 'MATH',
    Language: 'LANG',
    Science: 'SCI',
    Social: 'SOC',
    Reasoning: 'REAS'
  };

  const gedReady = domains.every(domain => {
    const prog = getDomainProgress(domainPrefixes[domain]);
    return prog.percent >= 60;
  });

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: '#0a0a0a',
      color: ACCENT_COLORS.green,
      fontFamily: '"Courier New", monospace',
      fontSize: '13px',
      overflow: 'auto'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px',
        borderBottom: `1px solid ${ACCENT_COLORS.green}40`,
        background: '#0d0d0d'
      }}>
        <BarChart3 size={20} color={ACCENT_COLORS.cyan} />
        <span style={{ color: ACCENT_COLORS.cyan, fontWeight: 'bold' }}>PROGRESS DASHBOARD</span>
        <span style={{ color: '#666', marginLeft: 'auto' }}>
          {profileData.displayName}
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '12px',
          marginBottom: '20px'
        }}>
          <div style={{
            background: '#111',
            border: `1px solid ${ACCENT_COLORS.green}30`,
            borderRadius: '6px',
            padding: '16px'
          }}>
            <div style={{ color: '#666', fontSize: '11px', marginBottom: '8px' }}>SKILLS MASTERED</div>
            <div style={{ fontSize: '28px', color: ACCENT_COLORS.green, fontWeight: 'bold' }}>
              {masteredCount}
            </div>
            <div style={{ color: '#666', fontSize: '11px' }}>of {totalSkills} total</div>
          </div>
          
          <div style={{
            background: '#111',
            border: `1px solid ${ACCENT_COLORS.amber}30`,
            borderRadius: '6px',
            padding: '16px'
          }}>
            <div style={{ color: '#666', fontSize: '11px', marginBottom: '8px' }}>IN PROGRESS</div>
            <div style={{ fontSize: '28px', color: ACCENT_COLORS.amber, fontWeight: 'bold' }}>
              {emergingCount}
            </div>
            <div style={{ color: '#666', fontSize: '11px' }}>emerging skills</div>
          </div>
          
          <div style={{
            background: '#111',
            border: `1px solid ${ACCENT_COLORS.cyan}30`,
            borderRadius: '6px',
            padding: '16px'
          }}>
            <div style={{ color: '#666', fontSize: '11px', marginBottom: '8px' }}>STUDY TIME</div>
            <div style={{ fontSize: '28px', color: ACCENT_COLORS.cyan, fontWeight: 'bold' }}>
              {formatTime(profile.getStudyTime())}
            </div>
            <div style={{ color: '#666', fontSize: '11px' }}>total learning</div>
          </div>
          
          <div style={{
            background: '#111',
            border: `1px solid ${ACCENT_COLORS.purple}30`,
            borderRadius: '6px',
            padding: '16px'
          }}>
            <div style={{ color: '#666', fontSize: '11px', marginBottom: '8px' }}>SUCCESS RATE</div>
            <div style={{ fontSize: '28px', color: ACCENT_COLORS.purple, fontWeight: 'bold' }}>
              {Math.round(journalStats.successRate * 100)}%
            </div>
            <div style={{ color: '#666', fontSize: '11px' }}>overall accuracy</div>
          </div>
        </div>

        <div style={{
          background: '#111',
          border: `1px solid ${gedReady ? ACCENT_COLORS.green : ACCENT_COLORS.amber}30`,
          borderRadius: '6px',
          padding: '16px',
          marginBottom: '20px'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            marginBottom: '16px'
          }}>
            <GraduationCap size={24} color={gedReady ? ACCENT_COLORS.green : ACCENT_COLORS.amber} />
            <div>
              <div style={{ 
                color: gedReady ? ACCENT_COLORS.green : ACCENT_COLORS.amber,
                fontWeight: 'bold'
              }}>
                GED READINESS
              </div>
              <div style={{ color: '#666', fontSize: '11px' }}>
                {gedReady 
                  ? 'You are ready for the GED exam!' 
                  : 'Continue building skills to become GED ready'}
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {domains.map(domain => {
              const prog = getDomainProgress(domainPrefixes[domain]);
              const ready = prog.percent >= 60;
              
              return (
                <div key={domain}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    marginBottom: '4px'
                  }}>
                    <span style={{ color: '#888', fontSize: '11px' }}>{domain}</span>
                    <span style={{ 
                      color: ready ? ACCENT_COLORS.green : '#666',
                      fontSize: '11px'
                    }}>
                      {prog.mastered}/{prog.total} ({Math.round(prog.percent)}%)
                    </span>
                  </div>
                  <div style={{
                    height: '6px',
                    background: '#222',
                    borderRadius: '3px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${prog.percent}%`,
                      height: '100%',
                      background: ready ? ACCENT_COLORS.green : ACCENT_COLORS.amber,
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px'
        }}>
          <div style={{
            background: '#111',
            border: `1px solid ${ACCENT_COLORS.green}30`,
            borderRadius: '6px',
            padding: '16px'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              marginBottom: '12px',
              color: ACCENT_COLORS.green
            }}>
              <TrendingUp size={16} />
              <span style={{ fontWeight: 'bold', fontSize: '12px' }}>STRENGTHS</span>
            </div>
            
            {profile.getStrengthAreas().length > 0 ? (
              profile.getStrengthAreas().slice(0, 5).map(skillId => {
                const skill = skillGraph.getNode(skillId);
                return (
                  <div
                    key={skillId}
                    style={{
                      padding: '6px 8px',
                      background: ACCENT_COLORS.green + '10',
                      borderRadius: '3px',
                      marginBottom: '4px',
                      fontSize: '11px',
                      color: '#ccc'
                    }}
                  >
                    {skill?.name || skillId}
                  </div>
                );
              })
            ) : (
              <div style={{ color: '#666', fontSize: '11px' }}>
                Keep practicing to identify your strengths
              </div>
            )}
          </div>
          
          <div style={{
            background: '#111',
            border: `1px solid ${ACCENT_COLORS.amber}30`,
            borderRadius: '6px',
            padding: '16px'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              marginBottom: '12px',
              color: ACCENT_COLORS.amber
            }}>
              <Target size={16} />
              <span style={{ fontWeight: 'bold', fontSize: '12px' }}>FOCUS AREAS</span>
            </div>
            
            {profile.getStruggleAreas().length > 0 ? (
              profile.getStruggleAreas().slice(0, 5).map(skillId => {
                const skill = skillGraph.getNode(skillId);
                return (
                  <div
                    key={skillId}
                    style={{
                      padding: '6px 8px',
                      background: ACCENT_COLORS.amber + '10',
                      borderRadius: '3px',
                      marginBottom: '4px',
                      fontSize: '11px',
                      color: '#ccc'
                    }}
                  >
                    {skill?.name || skillId}
                  </div>
                );
              })
            ) : (
              <div style={{ color: '#666', fontSize: '11px' }}>
                No struggle areas identified yet
              </div>
            )}
          </div>
        </div>

        <div style={{
          background: '#111',
          border: `1px solid ${ACCENT_COLORS.purple}30`,
          borderRadius: '6px',
          padding: '16px',
          marginTop: '12px'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            marginBottom: '12px',
            color: ACCENT_COLORS.purple
          }}>
            <Award size={16} />
            <span style={{ fontWeight: 'bold', fontSize: '12px' }}>COGNITIVE TRAITS</span>
          </div>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {Object.entries(profileData.cognitiveTraits).map(([trait, value]) => (
              <div
                key={trait}
                style={{
                  padding: '8px 12px',
                  background: '#0a0a0a',
                  borderRadius: '4px',
                  border: `1px solid ${value >= 3 ? ACCENT_COLORS.purple : '#333'}30`
                }}
              >
                <div style={{ 
                  color: value >= 3 ? ACCENT_COLORS.purple : '#666',
                  fontSize: '10px',
                  textTransform: 'capitalize',
                  marginBottom: '4px'
                }}>
                  {trait.replace(/([A-Z])/g, ' $1').trim()}
                </div>
                <div style={{ display: 'flex', gap: '2px' }}>
                  {[1, 2, 3, 4, 5].map(level => (
                    <div
                      key={level}
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '2px',
                        background: level <= Math.ceil(value) ? ACCENT_COLORS.purple : '#333'
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
