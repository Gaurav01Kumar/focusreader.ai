import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, X, Search, ChevronRight, ChevronLeft, Trash2 
} from 'lucide-react';
import { Note } from '../types' ;


interface ReaderSidebarProps {
  isFocusMode: boolean;
  isSidebarOpen: boolean;
  sidebarWidth: number;
  onBack: () => void;
  fileName: string;
  setIsSidebarOpen: (open: boolean) => void;
  handlePdfSearch: (e: React.FormEvent) => void;
  pdfSearchQuery: string;
  setPdfSearchQuery: (query: string) => void;
  isSearching: boolean;
  searchResults: { page: number; text: string }[];
  setSearchResults: (results: any[]) => void;
  scrollToPage: (page: number) => void;
  pageNumber: number;
  numPages: number | null;
  pdfOutline: any[];
  handleOutlineClick: (dest: any) => void;
  notes: Note[];
  onDeleteNote: (id: string) => void;
  setIsResizingSidebar: (resizing: boolean) => void;
  OutlineItem: React.ComponentType<any>;
}

const ReaderSidebar = ({
  isFocusMode,
  isSidebarOpen,
  sidebarWidth,
  onBack,
  fileName,
  setIsSidebarOpen,
  handlePdfSearch,
  pdfSearchQuery,
  setPdfSearchQuery,
  isSearching,
  searchResults,
  setSearchResults,
  scrollToPage,
  pageNumber,
  numPages,
  pdfOutline,
  handleOutlineClick,
  notes,
  onDeleteNote,
  setIsResizingSidebar,
  OutlineItem
}: ReaderSidebarProps) => {
  return (
       <AnimatePresence>
        {!isFocusMode && isSidebarOpen && (
          <>
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              style={{ width: window.innerWidth < 768 ? '100%' : sidebarWidth }}
            //   className={cn(
            //     "fixed md:relative inset-y-0 left-0 bg-white border-r border-neutral-200 flex flex-col z-50 md:z-30",
            //     "shadow-2xl md:shadow-none"
            //   )}
            >
              <div className="p-4 sm:p-6 border-b border-neutral-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={onBack}
                    className="p-2 hover:bg-neutral-50 rounded-full transition-colors text-neutral-500"
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <h2 className="font-semibold text-neutral-800 truncate max-w-[140px]">{fileName}</h2>
                </div>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-2 hover:bg-neutral-50 rounded-full transition-colors text-neutral-400 md:hidden"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Search PDF</div>
                <form onSubmit={handlePdfSearch} className="relative mb-4">
                  <input
                    type="text"
                    value={pdfSearchQuery}
                    onChange={(e) => setPdfSearchQuery(e.target.value)}
                    placeholder="Find in document..."
                    className="w-full pl-3 pr-10 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/5 focus:border-neutral-900 transition-all"
                  />
                  <button
                    type="submit"
                    disabled={isSearching}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-neutral-400 hover:text-neutral-900 transition-colors"
                  >
                    {isSearching ? (
                      <div className="w-4 h-4 border-2 border-neutral-200 border-t-neutral-900 rounded-full animate-spin" />
                    ) : (
                      <Search size={16} />
                    )}
                  </button>
                </form>

                {searchResults.length > 0 && (
                  <div className="space-y-2 mb-6">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Results</span>
                      <button
                        onClick={() => {
                          setSearchResults([]);
                          setPdfSearchQuery('');
                        }}
                        className="text-[10px] text-neutral-400 hover:text-neutral-900"
                      >
                        Clear
                      </button>
                    </div>
                    <div className="space-y-2">
                      {searchResults.map((res, idx) => (
                        <button
                          key={idx}
                          onClick={() => scrollToPage(res.page)}
                          className="w-full text-left p-3 bg-neutral-50 rounded-xl border border-neutral-100 hover:border-neutral-300 transition-all group"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-bold text-neutral-900">Page {res.page}</span>
                            <ChevronRight size={12} className="text-neutral-300 group-hover:translate-x-0.5 transition-transform" />
                          </div>
                          <p className="text-[11px] text-neutral-500 line-clamp-2 leading-relaxed">
                            {res.text}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Navigation</div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => scrollToPage(Math.max(1, pageNumber - 1))}
                    className="flex items-center justify-center p-3 bg-neutral-50 rounded-xl hover:bg-neutral-100 transition-colors"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={() => scrollToPage(Math.min(numPages || 1, pageNumber + 1))}
                    className="flex items-center justify-center p-3 bg-neutral-50 rounded-xl hover:bg-neutral-100 transition-colors"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>

                {pdfOutline.length > 0 && (
                  <div className="pt-4">
                    <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Outline</div>
                    <div className="space-y-1 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                      {pdfOutline.map((item, idx) => (
                        <OutlineItem key={idx} item={item} onItemClick={handleOutlineClick} />
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-4">
                  <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Saved Notes</div>
                  {notes.length === 0 ? (
                    <div className="text-sm text-neutral-400 italic p-4 text-center bg-neutral-50 rounded-xl">
                      No notes yet. Select text to save.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {notes.map(note => (
                        <div key={note.id} className="p-3 bg-neutral-50 rounded-xl border border-neutral-100 text-sm relative group/note">
                          <button
                            onClick={() => onDeleteNote(note.id)}
                            className="absolute right-2 top-2 p-1 text-neutral-300 hover:text-red-500 opacity-0 group-hover/note:opacity-100 transition-all"
                          >
                            <Trash2 size={12} />
                          </button>
                          <p className="line-clamp-2 text-neutral-600 italic mb-1" style={{ borderLeft: note.highlight ? `4px solid ${note.highlight}` : 'none', paddingLeft: note.highlight ? '8px' : '0' }}>"{note.text}"</p>
                          <div className="flex items-center justify-between text-[10px] text-neutral-400">
                            <span>Page {note.pageNumber}</span>
                            <span>{new Date(note.timestamp).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
            {/* Resize Handle Left */}
            <div
              onMouseDown={() => setIsResizingSidebar(true)}
              className="hidden md:block w-1 hover:w-1.5 bg-transparent hover:bg-neutral-300 cursor-col-resize transition-all z-40 relative"
            />
          </>
        )}
      </AnimatePresence>
  )
}

export default ReaderSidebar