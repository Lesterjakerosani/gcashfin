"use client";
import { useState, useEffect, useCallback } from "react";
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

export default function NotesPage() {
  const qc = useQueryClient();
  const [content, setContent] = useState("");
  const [noteId, setNoteId] = useState<string | null>(null);

  const { data: noteData, isLoading, error: fetchError } = useQuery<NoteResponse>({
    queryKey: ["notes"],
    queryFn: async () => {
      try {
        console.log("[Notes Page] Fetching notes...");
        const res = await fetch("/api/notes", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) {
          const errorData = await res.json();
          console.error("[Notes Page] Fetch failed:", errorData);
          const errorMessage = errorData.details ? `${errorData.error}: ${errorData.details}` : (errorData.error || `HTTP ${res.status}`);
          throw new Error(errorMessage);
        }

        const data = await res.json();
        console.log("[Notes Page] Fetch successful", data);
        return data;
      } catch (err) {
        console.error("[Notes Page] Fetch error:", err);
        throw err;
      }
    },
    retry: 2,
    retryDelay: 500,
  });

  useEffect(() => {
    if (noteData?.success) {
      setContent(noteData.content || "");
      setNoteId(noteData.id || null);
    }
  }, [noteData]);

  const saveMut = useMutation({
    mutationFn: async (contentToSave: string) => {
      try {
        console.log("[Notes Page] Saving notes...");
        const res = await fetch("/api/notes", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: contentToSave }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          console.error("[Notes Page] Save failed:", errorData);
          throw new Error(errorData.details || errorData.error || `HTTP ${res.status}`);
        }

        const data: NoteResponse = await res.json();
        console.log("[Notes Page] Save successful");
        return data;
      } catch (err) {
        console.error("[Notes Page] Save error:", err);
        throw err;
      }
    },
    onSuccess: (data) => {
      if (data.note?.id) setNoteId(data.note.id);
      qc.invalidateQueries({ queryKey: ["notes"] });
      toast.success("Notes saved!");
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Failed to save notes";
      console.error("[Notes Page] Mutation error:", message);
      toast.error(message);
    },
  });

  const deleteMut = useMutation({
    mutationFn: async () => {
      try {
        console.log("[Notes Page] Deleting notes...");
        const res = await fetch("/api/notes", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) {
          const errorData = await res.json();
          console.error("[Notes Page] Delete failed:", errorData);
          throw new Error(errorData.error || `HTTP ${res.status}`);
        }

        console.log("[Notes Page] Delete successful");
        return await res.json();
      } catch (err) {
        console.error("[Notes Page] Delete error:", err);
        throw err;
      }
    },
    onSuccess: () => {
      setContent("");
      setNoteId(null);
      qc.invalidateQueries({ queryKey: ["notes"] });
      toast.success("Notes deleted!");
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Failed to delete notes";
      console.error("[Notes Page] Delete error:", message);
      toast.error(message);
    },
  });

  const handleSave = useCallback(() => {
    if (!content.trim()) {
      toast.error("Cannot save empty notes");
      return;
    }
    saveMut.mutate(content);
  }, [content, saveMut]);

  const handleDelete = useCallback(() => {
    if (confirm("Are you sure you want to delete all notes?")) {
      deleteMut.mutate();
    }
  }, [deleteMut]);

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
              <Save size={14} /> {saveMut.isPending ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Start writing your notes here..."
          className="w-full h-[500px] bg-white/[0.04] border border-white/[0.07] rounded px-4 py-3 text-sm text-white placeholder-[#555] focus:outline-none focus:border-[#e74c3c]/50 resize-none transition-colors"
          style={{ fontFamily: "monospace" }}
        />
      </div>
      <p className="text-[#555] text-xs mt-4 text-right">Auto-saves on demand • Last saved ID: {noteId || "pending"}</p>
    </div>
  );
}