import { GuestStorage } from "./storageService";
import { DashboardApi } from "../apis/dashboard.api";
import { ReaderApi } from "../apis/readeer.service";
import { showToast } from "../utils/toast";

export const SyncService = {
  async syncGuestData() {
    const isGuest = localStorage.getItem("isGuest") === "true";
    if (!isGuest) return;

    try {
      const recentFiles = await GuestStorage.getRecentFiles();
      const notes = await GuestStorage.getNotes();
      const folders = await GuestStorage.getFolders();

      if (recentFiles.length === 0 && notes.length === 0 && folders.length === 0) {
        localStorage.removeItem("isGuest");
        return;
      }

      showToast("Syncing your guest data...", "info");

      // 1. Sync Folders and create a mapping of old ID to new ID
      const folderMapping: Record<string, string> = {};
      for (const folder of folders) {
        const r = await DashboardApi.getInstance().createFolder({ name: folder.name });
        if (r.statusCode === 201) {
          folderMapping[folder._id] = r.data._id;
        }
      }

      // 2. Sync Files and create a mapping
      const fileMapping: Record<string, string> = {};
      for (const file of recentFiles) {
        const r = await DashboardApi.getInstance().handleOpenNewFile({
          name: file.name,
          size: file.size,
          isUrl: file.isUrl,
          fileId: file.fileId,
          file_path: file.file_path,
        });
        if (r.statusCode === 201) {
          fileMapping[file._id] = r.data._id;
          
          // Update last read page if exists
          if (file.lastPage) {
             // We could call an update API here if available
          }
        }
      }

      // 3. Sync Notes
      for (const note of notes) {
        const newFileId = fileMapping[note.fileId];
        const newFolderId = note.folderId ? folderMapping[note.folderId] : undefined;

        if (newFileId) {
          await ReaderApi.getInstance().saveNote({
            text: note.text,
            explanation: note.explanation,
            pageNumber: note.pageNumber,
            folderId: newFolderId,
            highlight: note.highlight,
            fileId: newFileId,
          });
        }
      }

      // Clear guest data after successful sync
      localStorage.removeItem("isGuest");
      // Optional: Clear IndexedDB guest collections if desired
      
      showToast("Guest data synced successfully!", "success");
    } catch (error) {
      console.error("Sync failed", error);
      showToast("Failed to sync some guest data", "error");
    }
  }
};
