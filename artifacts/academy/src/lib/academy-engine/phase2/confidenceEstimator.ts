/**
 * Phase 2: Skill Confidence Estimator
 * Produces student-visible confidence bands - honest, calm, non-punitive.
 */

import type { MasteryState } from './masterySignalExtractor';

export type ConfidenceBand = 'unknown' | 'emerging' | 'stabilizing' | 'reliable';

export interface ConfidenceDisplay {
  band: ConfidenceBand;
  label: string;
  description: string;
  color: string;
  progress: number;
}

const BAND_DISPLAYS: Record<ConfidenceBand, Omit<ConfidenceDisplay, 'band' | 'progress'>> = {
  unknown: {
    label: 'Just Starting',
    description: 'We\'re still learning about your understanding here.',
    color: '#6B7280'
  },
  emerging: {
    label: 'Growing',
    description: 'You\'re developing understanding in this area.',
    color: '#F59E0B'
  },
  stabilizing: {
    label: 'Building Confidence',
    description: 'Your skills are becoming more consistent.',
    color: '#3B82F6'
  },
  reliable: {
    label: 'Strong Foundation',
    description: 'You\'ve demonstrated solid understanding.',
    color: '#10B981'
  }
};

export class ConfidenceEstimator {
  estimate(masteryState: MasteryState): ConfidenceBand {
    switch (masteryState) {
      case 'stable':
        return 'reliable';
      case 'emerging':
        return 'stabilizing';
      case 'fragile':
        return 'emerging';
      case 'insufficient_data':
      default:
        return 'unknown';
    }
  }

  estimateFromSuccessRate(successRate: number, attempts: number): ConfidenceBand {
    if (attempts < 3) return 'unknown';
    if (successRate >= 0.8 && attempts >= 5) return 'reliable';
    if (successRate >= 0.6) return 'stabilizing';
    if (successRate >= 0.3) return 'emerging';
    return 'unknown';
  }

  getDisplay(band: ConfidenceBand, attempts: number = 0): ConfidenceDisplay {
    const baseDisplay = BAND_DISPLAYS[band];
    
    let progress = 0;
    switch (band) {
      case 'unknown':
        progress = Math.min(attempts / 3, 0.25);
        break;
      case 'emerging':
        progress = 0.25 + (Math.min(attempts / 5, 1) * 0.25);
        break;
      case 'stabilizing':
        progress = 0.5 + (Math.min(attempts / 8, 1) * 0.25);
        break;
      case 'reliable':
        progress = 0.75 + (Math.min(attempts / 10, 1) * 0.25);
        break;
    }
    
    return {
      band,
      ...baseDisplay,
      progress
    };
  }

  getAllBands(): ConfidenceBand[] {
    return ['unknown', 'emerging', 'stabilizing', 'reliable'];
  }

  getBandProgress(currentBand: ConfidenceBand): {
    current: ConfidenceBand;
    next: ConfidenceBand | null;
    suggestions: string[];
  } {
    const bands: ConfidenceBand[] = ['unknown', 'emerging', 'stabilizing', 'reliable'];
    const currentIndex = bands.indexOf(currentBand);
    const nextBand = currentIndex < bands.length - 1 ? bands[currentIndex + 1] : null;
    
    const suggestions: string[] = [];
    
    switch (currentBand) {
      case 'unknown':
        suggestions.push('Complete a few more practice problems.');
        suggestions.push('Try different types of questions.');
        break;
      case 'emerging':
        suggestions.push('Keep practicing to build consistency.');
        suggestions.push('Try explaining concepts in your own words.');
        break;
      case 'stabilizing':
        suggestions.push('Apply your knowledge to new situations.');
        suggestions.push('Connect this skill to related concepts.');
        break;
      case 'reliable':
        suggestions.push('Consider helping others learn this skill.');
        suggestions.push('Challenge yourself with advanced problems.');
        break;
    }
    
    return { current: currentBand, next: nextBand, suggestions };
  }

  formatBandForDisplay(band: ConfidenceBand): string {
    return BAND_DISPLAYS[band].label;
  }

  getEncouragingMessage(band: ConfidenceBand): string {
    const messages: Record<ConfidenceBand, string[]> = {
      unknown: [
        'Every expert was once a beginner.',
        'You\'re just getting started on this journey.',
        'Learning takes time, and that\'s okay.'
      ],
      emerging: [
        'You\'re making real progress here.',
        'Keep going - you\'re building something valuable.',
        'Each attempt teaches you something new.'
      ],
      stabilizing: [
        'Your understanding is really developing.',
        'You\'re getting more consistent - that\'s great!',
        'You\'re on the path to mastery.'
      ],
      reliable: [
        'You\'ve built a strong foundation here.',
        'Your hard work is paying off.',
        'This is a skill you can count on.'
      ]
    };
    
    const bandMessages = messages[band];
    return bandMessages[Math.floor(Math.random() * bandMessages.length)];
  }
}

export const confidenceEstimator = new ConfidenceEstimator();
