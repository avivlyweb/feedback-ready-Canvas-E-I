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
}

export interface Project {
  id: string;
  name: string;
  type: ContentType;
  content: string; // URL for URL type, base64 data URL for IMAGE type
  pins: Pin[];
  createdAt: Date;
  isLocked?: boolean;
}
