"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { FileText, Trash2, Cloud, CloudOff } from "lucide-react";

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

type SaveStatus = "saved" | "saving" | "unsaved" | "error";

export default function NotesPage() {
  const qc = useQueryClient();
  const [content, setContent] = useState("");
  const [noteId, setNoteId] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [statusVisible, setStatusVisible] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showStatus = (status: SaveStatus, autohide = false) => {
    setSaveStatus(status);
    setStatusVisible(true);
    if (fadeTimer.current) clearTimeout(fadeTimer.current);
    if (autohide) {
      fadeTimer.current = setTimeout(() => setStatusVisible(false), 2500);
    }
  };

  const { data: noteData, isLoading, error: fetchError } = useQuery<NoteResponse>({
    queryKey: ["notes"],
    queryFn: async () => {
      const res = await fetch("/api/notes", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const errorData = await res.json();
        const errorMessage = errorData.details
          ? `${errorData.error}: ${errorData.details}`
          : errorData.error || `HTTP ${res.status}`;
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
      if (variables?.quiet) {
        showStatus("saved", true);
      } else {
        qc.invalidateQueries({ queryKey: ["notes"] });
        showStatus("saved", true);
      }
    },
    onError: (_error, variables) => {
      showStatus("error", false);
      if (!variables?.quiet) {
        toast.error("Failed to save notes");
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
      setHasUnsavedChanges(false);
      setSaveStatus("saved");
      setStatusVisible(false);
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
    showStatus("saving");
    saveMut.mutate({ content, quiet: false });
    setHasUnsavedChanges(false);
  }, [content, noteId, saveMut]);

  const handleDelete = useCallback(() => {
    if (confirm("Are you sure you want to delete all notes?")) {
      deleteMut.mutate();
    }
  }, [deleteMut]);

  useEffect(() => {
    if (noteData?.success) {
      setContent(noteData.content || "");
      setNoteId(noteData.id || null);
      setHasUnsavedChanges(false);
    }
  }, [noteData]);

  useEffect(() => {
    if (!hasUnsavedChanges || saveMut.isPending) return;
    if (!content.trim() && !noteId) return;

    saveTimer.current = setTimeout(() => {
      showStatus("saving");
      saveMut.mutate({ content, quiet: true });
    }, 1000);

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

  const statusLabel = {
    saving: "Saving...",
    saved: "All changes saved",
    unsaved: "Unsaved changes",
    error: "Save failed",
  }[saveStatus];

  const statusColor = {
    saving: "text-gray-400 dark:text-[#B0B3B8]",
    saved: "text-emerald-600 dark:text-emerald-400",
    unsaved: "text-gray-400 dark:text-[#B0B3B8]",
    error: "text-red-500",
  }[saveStatus];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-200 dark:border-[#3E4042] border-t-gray-900 dark:border-t-white rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500 dark:text-[#B0B3B8]">Loading notes...</p>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="card p-6 max-w-md text-center">
          <p className="text-red-500 font-medium mb-2">Error loading notes</p>
          <p className="text-sm text-gray-500 dark:text-[#B0B3B8]">
            {fetchError instanceof Error ? fetchError.message : "Unknown error"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Notes</h1>
        <p className="page-subtitle">Your personal notepad — changes save automatically</p>
      </div>

      <div className="card p-6">
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <FileText size={18} className="text-gray-400 dark:text-[#B0B3B8]" />
          <span className="section-title">My Notes</span>

          <div className={`flex items-center gap-1.5 ml-2 transition-opacity duration-500 ${statusVisible ? "opacity-100" : "opacity-0"}`}>
            {saveStatus === "error" ? (
              <CloudOff size={13} className="text-red-500" />
            ) : (
              <Cloud size={13} className={saveStatus === "saving" ? "text-gray-400 dark:text-[#B0B3B8] animate-pulse" : "text-emerald-500 dark:text-emerald-400"} />
            )}
            <span className={`text-xs ${statusColor}`}>{statusLabel}</span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={handleDelete}
              disabled={deleteMut.isPending || !noteId}
              className="btn-danger text-xs px-3 py-1.5 disabled:opacity-40"
            >
              <Trash2 size={13} /> {deleteMut.isPending ? "Deleting…" : "Clear Notes"}
            </button>
          </div>
        </div>

        <textarea
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            setHasUnsavedChanges(true);
            showStatus("unsaved");
          }}
          placeholder="Start writing your notes here..."
          className="w-full h-[520px] bg-gray-50 dark:bg-[#3A3B3C]/30 border border-gray-200 dark:border-[#3E4042] rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-[#E4E6EB] placeholder-gray-400 dark:placeholder-[#B0B3B8] focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-white/10 focus:border-gray-300 dark:focus:border-slate-500 resize-none transition-all leading-relaxed font-mono"
        />
      </div>
      <p className="text-xs text-gray-400 dark:text-[#B0B3B8] text-right">Ctrl+S to save manually</p>
    </div>
  );
}
