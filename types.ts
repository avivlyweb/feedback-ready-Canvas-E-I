export enum ContentType {
  URL = 'URL',
  IMAGE = 'IMAGE',
}

export enum CommentStatus {
  OPEN = 'OPEN',
  RESOLVED = 'RESOLVED',
}

export interface Comment {
  id: string;
  author: string;
  text: string;
  timestamp: Date;
  attachment?: {
    data: string; // base64 data URL
    name: string;
    type: string;
  };
}

export interface Pin {
  id:string;
  number: number;
  x: number; // percentage from left
  y: number; // percentage from top
  status: CommentStatus;
  comments: Comment[];
  // V2 fields
  viewport?: string;
  suggestedFix?: string;
  rubricCategory?: string;
  severity?: string;
  linkedChecklistId?: string;
  findingStatus?: 'open' | 'student_fixed' | 'verified';
}

export interface Project {
  id: string;
  name: string;
  type: ContentType;
  content: string; // URL for URL type, base64 data URL for IMAGE type
  pins: Pin[];
  createdAt: Date;
  isLocked?: boolean;
  studentEmail?: string;
  studentName?: string;
  notes?: string;
  screenshots?: string[];
  // V2 fields
  isV2?: boolean;
  submissionStatus?: 'submitted' | 'in_review' | 'published';
  readinessStatus?: 'not_assessed' | 'changes_required' | 'submit_ready';
  preflight?: string; // stringified JSON
  checklist?: string; // stringified JSON
  selfCheck?: string; // stringified JSON
  reusableComments?: string[];
  aiSummary?: string;
}
