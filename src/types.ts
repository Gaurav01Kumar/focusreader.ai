export interface Note {
  _id: string;
  text: string;
  explanation?: string;
  timestamp: number;
  pageNumber?: number;
  folderId?: string;
  color?: string;
  highlight?: string;
}

export interface Folder {
  _id: string;
  name: string;
  timestamp: number;
}

export interface RecentFile {
  id: string;
  name: string;
  size: number;
  timestamp: number;
  isUrl?: boolean;
}

export interface AppState {
  view: 'landing' | 'auth' | 'dashboard' | 'reader';
  user: { name: string; email: string } | null;
  currentPdf: File | string | null;
  notes: Note[];
  folders: Folder[];
  recentFiles: RecentFile[];
}
