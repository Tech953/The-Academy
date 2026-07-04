/**
 * Phase 3: Teacher Identity, Signatures, Approvals & Annotations
 * Establishes verifiable educator authority without hierarchy creep.
 */

export interface Teacher {
  id: string;
  name: string;
  credentials: string[];
  specializations: string[];
  createdAt: string;
  active: boolean;
}

export interface TeacherSignature {
  teacherId: string;
  curriculumHash: string;
  signedAt: string;
  signatureToken: string;
}

export interface Approval {
  curriculumHash: string;
  teacherId: string;
  signature: TeacherSignature;
  notes: string;
  approvedAt: string;
  status: 'approved' | 'pending_review' | 'needs_revision';
}

export interface Annotation {
  id: string;
  teacherId: string;
  targetType: 'skill' | 'assessment' | 'exam' | 'template';
  targetId: string;
  content: string;
  createdAt: string;
  visibility: 'private' | 'shared' | 'public';
  tags: string[];
}

const STORAGE_KEY_TEACHERS = 'academy_teachers';
const STORAGE_KEY_APPROVALS = 'academy_approvals';
const STORAGE_KEY_ANNOTATIONS = 'academy_annotations';

export class TeacherIdentity {
  private teacher: Teacher;

  constructor(id: string, name: string, credentials: string[] = []) {
    this.teacher = {
      id,
      name,
      credentials,
      specializations: [],
      createdAt: new Date().toISOString(),
      active: true
    };
  }

  sign(curriculumHash: string): TeacherSignature {
    const signatureToken = `SIGNED::${this.teacher.id}::${curriculumHash}::${Date.now()}`;
    return {
      teacherId: this.teacher.id,
      curriculumHash,
      signedAt: new Date().toISOString(),
      signatureToken
    };
  }

  addCredential(credential: string): void {
    if (!this.teacher.credentials.includes(credential)) {
      this.teacher.credentials.push(credential);
    }
  }

  addSpecialization(specialization: string): void {
    if (!this.teacher.specializations.includes(specialization)) {
      this.teacher.specializations.push(specialization);
    }
  }

  getProfile(): Teacher {
    return { ...this.teacher };
  }

  getId(): string {
    return this.teacher.id;
  }

  getName(): string {
    return this.teacher.name;
  }
}

export class ApprovalLayer {
  private approvals: Map<string, Approval[]> = new Map();

  constructor() {
    this.load();
  }

  private load(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_APPROVALS);
      if (stored) {
        const data = JSON.parse(stored);
        this.approvals = new Map(Object.entries(data));
      }
    } catch (e) {
      console.warn('Failed to load approvals:', e);
    }
  }

  private save(): void {
    try {
      const data: Record<string, Approval[]> = {};
      this.approvals.forEach((approvalList, hash) => {
        data[hash] = approvalList;
      });
      localStorage.setItem(STORAGE_KEY_APPROVALS, JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save approvals:', e);
    }
  }

  approve(curriculumHash: string, teacher: TeacherIdentity, notes: string = ''): Approval {
    const signature = teacher.sign(curriculumHash);
    
    const approval: Approval = {
      curriculumHash,
      teacherId: teacher.getId(),
      signature,
      notes,
      approvedAt: new Date().toISOString(),
      status: 'approved'
    };
    
    const existing = this.approvals.get(curriculumHash) || [];
    existing.push(approval);
    this.approvals.set(curriculumHash, existing);
    this.save();
    
    return approval;
  }

  requestReview(curriculumHash: string, teacher: TeacherIdentity, notes: string): Approval {
    const signature = teacher.sign(curriculumHash);
    
    const approval: Approval = {
      curriculumHash,
      teacherId: teacher.getId(),
      signature,
      notes,
      approvedAt: new Date().toISOString(),
      status: 'pending_review'
    };
    
    const existing = this.approvals.get(curriculumHash) || [];
    existing.push(approval);
    this.approvals.set(curriculumHash, existing);
    this.save();
    
    return approval;
  }

  isApproved(curriculumHash: string): boolean {
    const approvals = this.approvals.get(curriculumHash);
    return approvals ? approvals.some(a => a.status === 'approved') : false;
  }

  getApprovals(curriculumHash: string): Approval[] {
    return this.approvals.get(curriculumHash) || [];
  }

  getApprovalCount(curriculumHash: string): number {
    return this.getApprovals(curriculumHash).filter(a => a.status === 'approved').length;
  }

  getAllApprovedHashes(): string[] {
    const approved: string[] = [];
    this.approvals.forEach((approvalList, hash) => {
      if (approvalList.some(a => a.status === 'approved')) {
        approved.push(hash);
      }
    });
    return approved;
  }
}

export class AnnotationEngine {
  private annotations: Annotation[] = [];

  constructor() {
    this.load();
  }

  private load(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_ANNOTATIONS);
      if (stored) {
        this.annotations = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load annotations:', e);
    }
  }

  private save(): void {
    try {
      localStorage.setItem(STORAGE_KEY_ANNOTATIONS, JSON.stringify(this.annotations));
    } catch (e) {
      console.warn('Failed to save annotations:', e);
    }
  }

  private generateId(): string {
    return `ann-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  addAnnotation(
    teacher: TeacherIdentity,
    targetType: Annotation['targetType'],
    targetId: string,
    content: string,
    visibility: Annotation['visibility'] = 'shared',
    tags: string[] = []
  ): Annotation {
    const annotation: Annotation = {
      id: this.generateId(),
      teacherId: teacher.getId(),
      targetType,
      targetId,
      content,
      createdAt: new Date().toISOString(),
      visibility,
      tags
    };
    
    this.annotations.push(annotation);
    this.save();
    
    return annotation;
  }

  getAnnotationsFor(targetType: Annotation['targetType'], targetId: string): Annotation[] {
    return this.annotations.filter(a => 
      a.targetType === targetType && 
      a.targetId === targetId &&
      a.visibility !== 'private'
    );
  }

  getAnnotationsByTeacher(teacherId: string): Annotation[] {
    return this.annotations.filter(a => a.teacherId === teacherId);
  }

  searchAnnotations(query: string): Annotation[] {
    const lowerQuery = query.toLowerCase();
    return this.annotations.filter(a =>
      a.content.toLowerCase().includes(lowerQuery) ||
      a.tags.some(t => t.toLowerCase().includes(lowerQuery))
    );
  }

  removeAnnotation(annotationId: string, teacherId: string): boolean {
    const index = this.annotations.findIndex(a => 
      a.id === annotationId && a.teacherId === teacherId
    );
    
    if (index >= 0) {
      this.annotations.splice(index, 1);
      this.save();
      return true;
    }
    return false;
  }
}

export const approvalLayer = new ApprovalLayer();
export const annotationEngine = new AnnotationEngine();
