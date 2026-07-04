/**
 * Academic Utilities
 * GPA calculation, grading, and academic progress tracking
 */

import type { Enrollment, Assignment, AcademicProgress } from "@shared/schema";

/**
 * Grade letter to GPA points mapping (on 4.0 scale)
 */
const GRADE_POINTS: Record<string, number> = {
  'A+': 4.0,
  'A': 4.0,
  'A-': 3.7,
  'B+': 3.3,
  'B': 3.0,
  'B-': 2.7,
  'C+': 2.3,
  'C': 2.0,
  'C-': 1.7,
  'D+': 1.3,
  'D': 1.0,
  'D-': 0.7,
  'F': 0.0,
};

/**
 * Convert numeric grade (0-100) to letter grade
 */
export function numericToLetterGrade(numericGrade: number): string {
  if (numericGrade >= 97) return 'A+';
  if (numericGrade >= 93) return 'A';
  if (numericGrade >= 90) return 'A-';
  if (numericGrade >= 87) return 'B+';
  if (numericGrade >= 83) return 'B';
  if (numericGrade >= 80) return 'B-';
  if (numericGrade >= 77) return 'C+';
  if (numericGrade >= 73) return 'C';
  if (numericGrade >= 70) return 'C-';
  if (numericGrade >= 67) return 'D+';
  if (numericGrade >= 63) return 'D';
  if (numericGrade >= 60) return 'D-';
  return 'F';
}

/**
 * Convert letter grade to GPA points (stored as integer * 100)
 */
export function letterGradeToPoints(letterGrade: string): number {
  return (GRADE_POINTS[letterGrade] || 0) * 100; // Store as 400, 370, etc.
}

/**
 * Calculate GPA from completed enrollments
 * Returns GPA * 100 (e.g., 3.5 GPA = 350)
 */
export function calculateGPA(enrollments: Enrollment[]): number {
  const completedCourses = enrollments.filter(e => e.status === 'completed' && e.gradePoints !== null);
  
  if (completedCourses.length === 0) return 0;
  
  const totalPoints = completedCourses.reduce((sum, enrollment) => sum + (enrollment.gradePoints || 0), 0);
  const averagePoints = totalPoints / completedCourses.length;
  
  return Math.round(averagePoints);
}

/**
 * Calculate semester GPA from enrollments in current semester
 */
export function calculateSemesterGPA(enrollments: Enrollment[], semester: string): number {
  const semesterEnrollments = enrollments.filter(e => 
    e.semester === semester && 
    e.status === 'completed' && 
    e.gradePoints !== null
  );
  
  return calculateGPA(semesterEnrollments);
}

/**
 * Determine academic standing based on GPA
 */
export function getAcademicStanding(gpa: number): 'honors' | 'good' | 'probation' | 'warning' {
  if (gpa >= 350) return 'honors'; // 3.5+
  if (gpa >= 200) return 'good';   // 2.0+
  if (gpa >= 150) return 'probation'; // 1.5+
  return 'warning'; // Below 1.5
}

/**
 * Grade an assignment based on type and submission
 */
export function gradeAssignment(
  assignment: Assignment,
  submission: {
    type: 'multiple-choice' | 'essay' | 'short-answer';
    answers?: Record<string, string>; // For multiple choice
    text?: string; // For essays
    score?: number; // Manual score for essays
  }
): { grade: number; feedback: string } {
  if (assignment.type === 'exam' || submission.type === 'multiple-choice') {
    // Auto-grade multiple choice
    return gradeMultipleChoice(assignment, submission.answers || {});
  } else if (assignment.type === 'essay' || assignment.type === 'project') {
    // For essays, use provided score or simulate grading
    const score = submission.score || simulateEssayGrading(submission.text || '');
    return {
      grade: score,
      feedback: generateEssayFeedback(score),
    };
  } else if (assignment.type === 'participation') {
    // Participation is graded based on attendance and engagement
    return {
      grade: 85, // Default participation score
      feedback: 'Good class participation. Keep engaging in discussions!',
    };
  }
  
  return { grade: 0, feedback: 'Invalid assignment type' };
}

/**
 * Auto-grade multiple choice questions
 */
function gradeMultipleChoice(
  assignment: Assignment,
  answers: Record<string, string>
): { grade: number; feedback: string } {
  const questions = (assignment.content as any).questions || [];
  if (questions.length === 0) {
    return { grade: 0, feedback: 'No questions found' };
  }
  
  let correctCount = 0;
  questions.forEach((q: any) => {
    if (answers[q.question] === q.correctAnswer) {
      correctCount++;
    }
  });
  
  const grade = Math.round((correctCount / questions.length) * 100);
  return {
    grade,
    feedback: `You got ${correctCount} out of ${questions.length} questions correct (${grade}%).`,
  };
}

/**
 * Simulate essay grading based on length and keywords
 */
function simulateEssayGrading(text: string): number {
  const wordCount = text.trim().split(/\s+/).length;
  const hasThesis = text.toLowerCase().includes('because') || text.toLowerCase().includes('therefore');
  const hasCitation = text.includes('according to') || text.includes('states that');
  const paragraphs = text.split(/\n\n+/).length;
  
  let score = 60; // Base score
  
  // Word count scoring
  if (wordCount >= 500) score += 15;
  else if (wordCount >= 300) score += 10;
  else if (wordCount >= 150) score += 5;
  
  // Structure scoring
  if (hasThesis) score += 10;
  if (paragraphs >= 3) score += 5;
  
  // Evidence scoring
  if (hasCitation) score += 10;
  
  return Math.min(100, score);
}

/**
 * Generate feedback for essay grades
 */
function generateEssayFeedback(grade: number): string {
  if (grade >= 90) {
    return 'Excellent work! Your essay demonstrates strong understanding and clear writing.';
  } else if (grade >= 80) {
    return 'Good effort. Your essay shows solid understanding. Consider adding more supporting evidence.';
  } else if (grade >= 70) {
    return 'Satisfactory work. Your essay needs stronger thesis development and more detailed examples.';
  } else if (grade >= 60) {
    return 'Your essay meets basic requirements but needs significant improvement in organization and depth.';
  } else {
    return 'This essay needs major revision. Please review the assignment requirements and seek additional help.';
  }
}

/**
 * Calculate total credits earned
 */
export function calculateTotalCredits(enrollments: Enrollment[], courses: Map<string, any>): number {
  return enrollments
    .filter(e => e.status === 'completed' && (e.gradePoints || 0) >= 150) // Passing grade (1.5+ GPA)
    .reduce((total, enrollment) => {
      const course = courses.get(enrollment.courseId);
      return total + (course?.credits || 0);
    }, 0);
}

/**
 * Check if student meets graduation requirements
 */
export function checkGraduationRequirements(
  pathway: any,
  enrollments: Enrollment[],
  academicProgress: AcademicProgress,
  courses: Map<string, any>
): {
  eligible: boolean;
  missing: {
    credits?: number;
    gpa?: number;
    courses?: string[];
  };
} {
  const missing: any = {};
  let eligible = true;
  
  // Check GPA requirement
  const currentGPA = academicProgress.cumulativeGPA || 0;
  if (currentGPA < pathway.minGPA) {
    eligible = false;
    missing.gpa = (pathway.minGPA - currentGPA) / 100;
  }
  
  // Check total credits
  const totalCredits = calculateTotalCredits(enrollments, courses);
  if (totalCredits < pathway.requiredCredits) {
    eligible = false;
    missing.credits = pathway.requiredCredits - totalCredits;
  }
  
  // Check required courses
  const completedCourseIds = enrollments
    .filter(e => e.status === 'completed' && (e.gradePoints || 0) >= 150)
    .map(e => e.courseId);
  
  const missingCourses = pathway.requiredCourses.filter(
    (courseId: string) => !completedCourseIds.includes(courseId)
  );
  
  if (missingCourses.length > 0) {
    eligible = false;
    missing.courses = missingCourses;
  }
  
  return { eligible, missing };
}
