"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Save, FileText, Trash2 } from "lucide-react";

interface NoteResponse {
  success: boolean;
  content?: string;
  id?: string;
  note?: { id: string; content: string; createdAt?: string; updatedAt?: string };
  error?: string;
  details?: string;
}

type SavePayload = {
  content: string;
  quiet?: boolean;
};

export default function NotesPage() {
  const qc = useQueryClient();
  const [content, setContent] = useState("");
  const [noteId, setNoteId] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: noteData, isLoading, error: fetchError } = useQuery<NoteResponse>({
    queryKey: ["notes"],
    queryFn: async () => {
      const res = await fetch("/api/notes", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const errorData = await res.json();
        const errorMessage = errorData.details ? `${errorData.error}: ${errorData.details}` : (errorData.error || `HTTP ${res.status}`);
        throw new Error(errorMessage);
      }

      return res.json();
    },
    retry: 2,
    retryDelay: 500,
  });

  const saveMut = useMutation<NoteResponse, Error, SavePayload>({
    mutationFn: async ({ content: contentToSave }) => {
      const res = await fetch("/api/notes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: contentToSave }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.details || errorData.error || `HTTP ${res.status}`);
      }

      return res.json();
    },
    onSuccess: (data, variables) => {
      if (data.note?.id) setNoteId(data.note.id);
      setHasUnsavedChanges(false);

      if (!variables?.quiet) {
        // Only update query cache and show toast on manual save
        qc.invalidateQueries({ queryKey: ["notes"] });
        toast.success("Notes saved!");
      }
    },
    onError: (error, variables) => {
      const message = error instanceof Error ? error.message : "Failed to save notes";
      if (!variables?.quiet) {
        toast.error(message);
      }
    },
  });

  const deleteMut = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/notes", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `HTTP ${res.status}`);
      }

      return res.json();
    },
    onSuccess: () => {
      setContent("");
      setNoteId(null);
      qc.invalidateQueries({ queryKey: ["notes"] });
      toast.success("Notes deleted!");
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Failed to delete notes";
      toast.error(message);
    },
  });

  const handleSave = useCallback(() => {
    if (!content.trim() && !noteId) {
      toast.error("Cannot save empty notes");
      return;
    }

    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }

    saveMut.mutate({ content, quiet: false });
    setHasUnsavedChanges(false);
  }, [content, noteId, saveMut]);

  const handleDelete = useCallback(() => {
    if (confirm("Are you sure you want to delete all notes?")) {
      deleteMut.mutate();
    }
  }, [deleteMut]);

  // Load initial note data into state
  useEffect(() => {
    if (noteData?.success) {
      setContent(noteData.content || "");
      setNoteId(noteData.id || null);
      setHasUnsavedChanges(false);
    }
  }, [noteData]);

  // Silent auto-save 100ms after user stops typing — no status changes, no refetch
  useEffect(() => {
    if (!hasUnsavedChanges || saveMut.isPending) return;
    if (!content.trim() && !noteId) return;

    saveTimer.current = setTimeout(() => {
      saveMut.mutate({ content, quiet: true });
    }, 1300);

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [content, hasUnsavedChanges, noteId, saveMut]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        event.preventDefault();
        event.returnValue = "You have unsaved changes.";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isSaveShortcut = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s";
      if (!isSaveShortcut) return;

      event.preventDefault();
      if (saveMut.isPending) return;
      if (!content.trim() && !noteId) {
        toast.error("Cannot save empty notes");
        return;
      }

      handleSave();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [content, handleSave, noteId, saveMut.isPending]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#e74c3c] mx-auto mb-4"></div>
          <p>Loading notes...</p>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center bg-[rgba(15,15,15,0.92)] border border-red-700/30 rounded-lg p-6 max-w-md">
          <p className="text-red-500 mb-2">Error loading notes:</p>
          <p className="text-[#888] text-sm">{fetchError instanceof Error ? fetchError.message : "Unknown error"}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="font-display text-4xl tracking-[4px] text-white mb-1">NOTES <span className="text-[#e74c3c]">PAD</span></div>
      <p className="text-[#888] text-sm mb-6">Your personal notepad</p>

      <div className="bg-[rgba(15,15,15,0.92)] border border-white/[0.07] rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <FileText size={20} className="text-[#888]" />
          <span className="text-white font-semibold">My Notes</span>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={handleDelete}
              disabled={deleteMut.isPending || !noteId}
              className="flex items-center gap-2 bg-red-900/30 hover:bg-red-900/50 text-red-500 border border-red-700/30 px-3 py-1.5 rounded text-xs font-semibold transition-all disabled:opacity-50"
            >
              <Trash2 size={12} /> {deleteMut.isPending ? "Deleting…" : "Delete"}
            </button>
            <button
              onClick={handleSave}
              disabled={saveMut.isPending}
              className="flex items-center gap-2 bg-[#c0392b] hover:bg-[#e74c3c] text-white px-4 py-1.5 rounded text-sm font-semibold tracking-wide transition-all disabled:opacity-50"
            >
              <Save size={14} /> Save
            </button>
          </div>
        </div>
        <textarea
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            setHasUnsavedChanges(true);
          }}
          placeholder="Start writing your notes here..."
          className="w-full h-[500px] bg-white/[0.04] border border-white/[0.07] rounded px-4 py-3 text-sm text-white placeholder-[#555] focus:outline-none focus:border-[#e74c3c]/50 resize-none transition-colors"
          style={{ fontFamily: "monospace" }}
        />
      </div>
    </div>
  );
}
