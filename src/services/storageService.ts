import { get, set } from "idb-keyval";

export interface GuestRecentFile {
  _id: string;
  name: string;
  size: number;
  createdAt: Date;
  isUrl: boolean;
  fileId: string;
  file_path: string;
  lastPage?: number;
}

export interface GuestNote {
  id: string;
  text: string;
  explanation?: string;
  pageNumber: number;
  folderId?: string;
  highlight?: string;
  timestamp: number;
  fileId: string;
}

export interface GuestFolder {
  _id: string;
  name: string;
}

const RECENT_FILES_KEY = "guest_recent_files";
const NOTES_KEY = "guest_notes";
const FOLDERS_KEY = "guest_folders";

export const GuestStorage = {
  async getRecentFiles(): Promise<GuestRecentFile[]> {
    return (await get(RECENT_FILES_KEY)) || [];
  },

  async saveRecentFile(file: Omit<GuestRecentFile, "_id" | "createdAt">): Promise<GuestRecentFile> {
    const files = await this.getRecentFiles();
    const newFile: GuestRecentFile = {
      ...file,
      _id: Math.random().toString(36).substring(7),
      createdAt: new Date(),
    };
    files.unshift(newFile);
    await set(RECENT_FILES_KEY, files);
    return newFile;
  },

  async updateRecentFile(id: string, updates: Partial<GuestRecentFile>) {
    const files = await this.getRecentFiles();
    const idx = files.findIndex(f => f._id === id);
    if (idx !== -1) {
      files[idx] = { ...files[idx], ...updates };
      await set(RECENT_FILES_KEY, files);
    }
  },

  async deleteRecentFile(id: string) {
    const files = await this.getRecentFiles();
    const filtered = files.filter(f => f._id !== id);
    await set(RECENT_FILES_KEY, filtered);
  },

  async getNotes(): Promise<GuestNote[]> {
    return (await get(NOTES_KEY)) || [];
  },

  async saveNote(note: Omit<GuestNote, "id" | "timestamp">): Promise<GuestNote> {
    const notes = await this.getNotes();
    const newNote: GuestNote = {
      ...note,
      id: Math.random().toString(36).substring(7),
      timestamp: Date.now(),
    };
    notes.push(newNote);
    await set(NOTES_KEY, notes);
    return newNote;
  },

  async deleteNote(id: string) {
    const notes = await this.getNotes();
    const filtered = notes.filter(n => n.id !== id);
    await set(NOTES_KEY, filtered);
  },

  async getFolders(): Promise<GuestFolder[]> {
    return (await get(FOLDERS_KEY)) || [];
  },

  async saveFolder(name: string): Promise<GuestFolder> {
    const folders = await this.getFolders();
    const newFolder: GuestFolder = {
      _id: Math.random().toString(36).substring(7),
      name,
    };
    folders.push(newFolder);
    await set(FOLDERS_KEY, folders);
    return newFolder;
  },

  async deleteFolder(id: string) {
    const folders = await this.getFolders();
    const filtered = folders.filter(f => f._id !== id);
    await set(FOLDERS_KEY, filtered);
  }
};
