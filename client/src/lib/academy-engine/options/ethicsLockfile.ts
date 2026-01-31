/**
 * Options: Ethics Lockfile
 * Enforces hard system-level ethical constraints.
 * Prevents forbidden inferences and protects student privacy.
 */

export interface EthicsViolation {
  field: string;
  context: string;
  timestamp: string;
  blocked: boolean;
}

export interface EthicsReport {
  compliant: boolean;
  violations: EthicsViolation[];
  checkedAt: string;
}

const FORBIDDEN_FIELDS = new Set([
  'race',
  'ethnicity',
  'religion',
  'political_affiliation',
  'medical_status',
  'psychological_profile',
  'biometric_data',
  'behavioral_prediction',
  'emotional_state',
  'family_income',
  'parental_education',
  'disability_status',
  'sexual_orientation',
  'gender_identity',
  'immigration_status',
  'criminal_history'
]);

const FORBIDDEN_INFERENCES = new Set([
  'future_success_prediction',
  'dropout_risk',
  'career_aptitude',
  'personality_assessment',
  'intelligence_quotient',
  'employability_score',
  'social_credit',
  'parenting_quality',
  'addiction_risk',
  'mental_health_diagnosis'
]);

const FORBIDDEN_OPERATIONS = new Set([
  'cross_student_comparison',
  'percentile_ranking',
  'competitive_scoring',
  'behavioral_scoring',
  'attention_tracking',
  'keystroke_analysis',
  'facial_recognition',
  'voice_emotion_analysis',
  'predictive_discipline'
]);

export class EthicsLockfile {
  private violations: EthicsViolation[] = [];

  validate(dataKeys: string[]): boolean {
    const forbidden = dataKeys.filter(key => FORBIDDEN_FIELDS.has(key));
    
    for (const field of forbidden) {
      this.logViolation(field, 'forbidden_field');
    }
    
    return forbidden.length === 0;
  }

  validateInference(inferenceType: string): boolean {
    if (FORBIDDEN_INFERENCES.has(inferenceType)) {
      this.logViolation(inferenceType, 'forbidden_inference');
      return false;
    }
    return true;
  }

  validateOperation(operationType: string): boolean {
    if (FORBIDDEN_OPERATIONS.has(operationType)) {
      this.logViolation(operationType, 'forbidden_operation');
      return false;
    }
    return true;
  }

  enforce(studentRecord: Record<string, unknown>): boolean {
    return this.validate(Object.keys(studentRecord));
  }

  private logViolation(field: string, context: string): void {
    this.violations.push({
      field,
      context,
      timestamp: new Date().toISOString(),
      blocked: true
    });
  }

  getViolations(): EthicsViolation[] {
    return [...this.violations];
  }

  clearViolations(): void {
    this.violations = [];
  }

  generateReport(): EthicsReport {
    return {
      compliant: this.violations.length === 0,
      violations: this.getViolations(),
      checkedAt: new Date().toISOString()
    };
  }

  static getForbiddenFields(): string[] {
    return Array.from(FORBIDDEN_FIELDS);
  }

  static getForbiddenInferences(): string[] {
    return Array.from(FORBIDDEN_INFERENCES);
  }

  static getForbiddenOperations(): string[] {
    return Array.from(FORBIDDEN_OPERATIONS);
  }

  static getEthicsManifest(): string {
    return `
ACADEMY ETHICS LOCKFILE
=======================

This system explicitly forbids:

FORBIDDEN DATA COLLECTION:
${Array.from(FORBIDDEN_FIELDS).map(f => `  - ${f}`).join('\n')}

FORBIDDEN INFERENCES:
${Array.from(FORBIDDEN_INFERENCES).map(f => `  - ${f}`).join('\n')}

FORBIDDEN OPERATIONS:
${Array.from(FORBIDDEN_OPERATIONS).map(f => `  - ${f}`).join('\n')}

PRINCIPLES:
- Student data belongs to the student
- Learning is never punitive
- No cross-student comparison
- No predictive profiling
- Transparency in all operations
- Human dignity above metrics

This lockfile is enforced at the code level.
Violations are blocked and logged.
    `.trim();
  }
}

export const ethicsLockfile = new EthicsLockfile();
