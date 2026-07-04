import { 
  EngagementAnalytics, 
  AdaptiveRecommendation, 
  LearningPath,
  CourseProgress 
} from '@shared/schema';

export type RecommendationType = 
  | 'review_fundamentals'
  | 'proceed_next_unit'
  | 'practice_more'
  | 'take_break'
  | 'focus_weak_area'
  | 'challenge_ready'
  | 'complete_assignment'
  | 'read_textbook'
  | 'create_notes'
  | 'attend_lecture';

export interface RecommendationContext {
  analytics: EngagementAnalytics;
  courseProgress: Record<string, CourseProgress>;
  recentScores: number[];
  unreadChapters: string[];
  pendingAssignments: string[];
  missedLectures: string[];
  currentStreak: number;
  studyTimeToday: number;
}

export function generateAdaptiveRecommendations(
  context: RecommendationContext
): AdaptiveRecommendation[] {
  const recommendations: AdaptiveRecommendation[] = [];

  recommendations.push(...generateScoreBasedRecommendations(context));
  recommendations.push(...generateProgressBasedRecommendations(context));
  recommendations.push(...generateEngagementBasedRecommendations(context));
  recommendations.push(...generateTimeBasedRecommendations(context));

  return prioritizeRecommendations(recommendations).slice(0, 5);
}

function generateScoreBasedRecommendations(
  context: RecommendationContext
): AdaptiveRecommendation[] {
  const recommendations: AdaptiveRecommendation[] = [];
  const { recentScores, courseProgress } = context;

  if (recentScores.length === 0) return recommendations;

  const avgScore = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
  const latestScore = recentScores[recentScores.length - 1];

  if (latestScore < 60) {
    recommendations.push({
      type: 'review_fundamentals',
      title: 'Review Core Concepts',
      description: 'Your recent score suggests reviewing foundational material before continuing.',
      priority: 10,
      resourceType: 'textbook',
      resourceId: findWeakestSubject(courseProgress),
      actionLabel: 'Start Review',
      estimatedTime: 30
    });
  } else if (latestScore < 70) {
    recommendations.push({
      type: 'practice_more',
      title: 'Additional Practice Needed',
      description: 'Practice makes perfect! Work through more exercises to solidify understanding.',
      priority: 8,
      resourceType: 'assignment',
      actionLabel: 'Practice Now',
      estimatedTime: 20
    });
  } else if (latestScore < 85) {
    recommendations.push({
      type: 'proceed_next_unit',
      title: 'Ready for Next Unit',
      description: 'Good progress! Consider reviewing incorrect answers, then proceed.',
      priority: 5,
      resourceType: 'chapter',
      actionLabel: 'Continue Learning',
      estimatedTime: 25
    });
  } else if (latestScore >= 90) {
    recommendations.push({
      type: 'challenge_ready',
      title: 'Challenge Yourself',
      description: 'Excellent work! You are ready for advanced material or the next course level.',
      priority: 4,
      resourceType: 'course',
      actionLabel: 'Take on Challenge',
      estimatedTime: 45
    });
  }

  if (avgScore < 70 && recentScores.length >= 3) {
    const weakSubject = findWeakestSubject(courseProgress);
    recommendations.push({
      type: 'focus_weak_area',
      title: 'Focus on Weak Areas',
      description: `Your ${weakSubject} scores need attention. Dedicated review is recommended.`,
      priority: 9,
      resourceType: 'textbook',
      resourceId: weakSubject,
      actionLabel: 'Focus Review',
      estimatedTime: 40
    });
  }

  return recommendations;
}

function generateProgressBasedRecommendations(
  context: RecommendationContext
): AdaptiveRecommendation[] {
  const recommendations: AdaptiveRecommendation[] = [];
  const { unreadChapters, pendingAssignments, missedLectures } = context;

  if (unreadChapters.length > 0) {
    recommendations.push({
      type: 'read_textbook',
      title: `${unreadChapters.length} Unread Chapter${unreadChapters.length > 1 ? 's' : ''}`,
      description: 'Stay on track by reading your assigned textbook chapters.',
      priority: 7,
      resourceType: 'chapter',
      resourceId: unreadChapters[0],
      actionLabel: 'Read Now',
      estimatedTime: 15
    });
  }

  if (pendingAssignments.length > 0) {
    recommendations.push({
      type: 'complete_assignment',
      title: `${pendingAssignments.length} Pending Assignment${pendingAssignments.length > 1 ? 's' : ''}`,
      description: 'Complete your assignments to demonstrate understanding.',
      priority: 8,
      resourceType: 'assignment',
      resourceId: pendingAssignments[0],
      actionLabel: 'Start Assignment',
      estimatedTime: 30
    });
  }

  if (missedLectures.length > 0) {
    recommendations.push({
      type: 'attend_lecture',
      title: `${missedLectures.length} Missed Lecture${missedLectures.length > 1 ? 's' : ''}`,
      description: 'Catch up on lectures to stay current with course material.',
      priority: 6,
      resourceType: 'lecture',
      resourceId: missedLectures[0],
      actionLabel: 'Attend Lecture',
      estimatedTime: 45
    });
  }

  return recommendations;
}

function generateEngagementBasedRecommendations(
  context: RecommendationContext
): AdaptiveRecommendation[] {
  const recommendations: AdaptiveRecommendation[] = [];
  const { analytics, currentStreak } = context;

  const noteCount = Object.keys(analytics.notesUsage).length;
  if (noteCount < 3) {
    recommendations.push({
      type: 'create_notes',
      title: 'Start Taking Notes',
      description: 'Creating study notes improves retention and understanding.',
      priority: 4,
      resourceType: 'note',
      actionLabel: 'Create Note',
      estimatedTime: 10
    });
  }

  if (currentStreak === 0) {
    recommendations.push({
      type: 'review_fundamentals',
      title: 'Get Back on Track',
      description: 'Start a new study streak today! Even a short session helps.',
      priority: 6,
      resourceType: 'textbook',
      actionLabel: 'Study Now',
      estimatedTime: 15
    });
  } else if (currentStreak >= 7) {
    recommendations.push({
      type: 'challenge_ready',
      title: 'Impressive Streak!',
      description: `${currentStreak} day streak! Consider tackling more challenging material.`,
      priority: 3,
      resourceType: 'assignment',
      actionLabel: 'Take Challenge',
      estimatedTime: 30
    });
  }

  return recommendations;
}

function generateTimeBasedRecommendations(
  context: RecommendationContext
): AdaptiveRecommendation[] {
  const recommendations: AdaptiveRecommendation[] = [];
  const { studyTimeToday } = context;

  const RECOMMENDED_DAILY_MINUTES = 60;
  const studyMinutesToday = studyTimeToday / 60000;

  if (studyMinutesToday >= RECOMMENDED_DAILY_MINUTES * 2) {
    recommendations.push({
      type: 'take_break',
      title: 'Take a Break',
      description: 'You have been studying for a while. Rest helps consolidate learning.',
      priority: 9,
      resourceType: 'break',
      actionLabel: 'Take Break',
      estimatedTime: 15
    });
  } else if (studyMinutesToday < 15) {
    recommendations.push({
      type: 'read_textbook',
      title: 'Quick Study Session',
      description: 'Even 15 minutes of focused study makes a difference.',
      priority: 5,
      resourceType: 'textbook',
      actionLabel: 'Quick Study',
      estimatedTime: 15
    });
  }

  return recommendations;
}

function findWeakestSubject(courseProgress: Record<string, CourseProgress>): string {
  let weakestSubject = 'Mathematical Reasoning';
  let lowestScore = 100;

  Object.entries(courseProgress).forEach(([subject, progress]) => {
    if (progress.averageScore < lowestScore) {
      lowestScore = progress.averageScore;
      weakestSubject = subject;
    }
  });

  return weakestSubject;
}

function prioritizeRecommendations(
  recommendations: AdaptiveRecommendation[]
): AdaptiveRecommendation[] {
  return recommendations.sort((a, b) => b.priority - a.priority);
}

export function createLearningPath(
  subject: string,
  currentLevel: number,
  targetLevel: number,
  courseProgress: CourseProgress
): LearningPath {
  const milestones: LearningPath['milestones'] = [];
  const levelGap = targetLevel - currentLevel;

  for (let i = 1; i <= levelGap; i++) {
    milestones.push({
      level: currentLevel + i,
      title: `Level ${currentLevel + i} Mastery`,
      requirements: [
        `Complete Chapter ${currentLevel + i}`,
        `Score 80%+ on Level ${currentLevel + i} Assignment`,
        `Create study notes for key concepts`
      ],
      completed: false
    });
  }

  return {
    subject,
    currentLevel,
    targetLevel,
    milestones,
    estimatedWeeks: Math.ceil(levelGap * 1.5),
    startedAt: new Date().toISOString(),
    progress: 0
  };
}

export function updateLearningPathProgress(
  path: LearningPath,
  completedMilestones: number[]
): LearningPath {
  const updatedMilestones = path.milestones.map((m, idx) => ({
    ...m,
    completed: completedMilestones.includes(idx)
  }));

  const completedCount = updatedMilestones.filter(m => m.completed).length;
  const progress = Math.round((completedCount / updatedMilestones.length) * 100);

  return {
    ...path,
    milestones: updatedMilestones,
    progress,
    currentLevel: path.currentLevel + completedCount
  };
}

export function generateQuickRecommendation(score: number): string {
  if (score < 60) {
    return 'Recommendation: Review foundational concepts and repeat practice exercises.';
  } else if (score < 70) {
    return 'Recommendation: Additional practice recommended. Focus on areas with incorrect answers.';
  } else if (score < 85) {
    return 'Recommendation: Proceed to next unit, but review any incorrect responses.';
  } else if (score < 95) {
    return 'Recommendation: Excellent progress! Ready to advance to next unit.';
  }
  return 'Recommendation: Outstanding! Consider taking on advanced challenges or helping peers.';
}

export function formatRecommendations(recommendations: AdaptiveRecommendation[]): string {
  if (recommendations.length === 0) {
    return 'No specific recommendations at this time. Keep up the great work!';
  }

  const lines: string[] = [
    '=== STUDY RECOMMENDATIONS ===',
    ''
  ];

  recommendations.forEach((rec, idx) => {
    lines.push(`${idx + 1}. ${rec.title}`);
    lines.push(`   ${rec.description}`);
    if (rec.estimatedTime) {
      lines.push(`   Estimated time: ${rec.estimatedTime} minutes`);
    }
    lines.push('');
  });

  return lines.join('\n');
}

export function getSubjectRecommendations(
  subject: string,
  progress: CourseProgress
): AdaptiveRecommendation[] {
  const recommendations: AdaptiveRecommendation[] = [];

  if (progress.chaptersRead < progress.totalChapters) {
    const unreadCount = progress.totalChapters - progress.chaptersRead;
    recommendations.push({
      type: 'read_textbook',
      title: `Read ${subject} Chapters`,
      description: `${unreadCount} chapters remaining in this subject.`,
      priority: 7,
      resourceType: 'chapter',
      resourceId: subject,
      actionLabel: 'Continue Reading',
      estimatedTime: unreadCount * 15
    });
  }

  if (progress.assignmentsCompleted < progress.totalAssignments) {
    recommendations.push({
      type: 'complete_assignment',
      title: `Complete ${subject} Assignments`,
      description: `${progress.totalAssignments - progress.assignmentsCompleted} assignments pending.`,
      priority: 8,
      resourceType: 'assignment',
      resourceId: subject,
      actionLabel: 'Work on Assignments',
      estimatedTime: 30
    });
  }

  if (progress.averageScore < 70) {
    recommendations.push({
      type: 'review_fundamentals',
      title: `Review ${subject} Basics`,
      description: 'Your scores indicate a need for foundational review.',
      priority: 9,
      resourceType: 'textbook',
      resourceId: subject,
      actionLabel: 'Start Review',
      estimatedTime: 45
    });
  }

  return recommendations;
}
