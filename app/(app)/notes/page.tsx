"use client";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Save, FileText } from "lucide-react";

export default function NotesPage() {
  const qc = useQueryClient();
  const [content, setContent] = useState("");

  const { data: noteData, isLoading } = useQuery<{ content: string }>({
    queryKey: ["notes"],
    queryFn: () => fetch("/api/notes").then(r => r.json()),
  });

  useEffect(() => {
    if (noteData) setContent(noteData.content);
  }, [noteData]);

  const saveMut = useMutation({
    mutationFn: (content: string) => fetch("/api/notes", { method: "PUT", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ content }) }).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["notes"] }); toast.success("Notes saved!"); },
    onError: () => toast.error("Failed to save notes."),
  });

  const handleSave = () => saveMut.mutate(content);

  if (isLoading) return <div className="text-white">Loading...</div>;

  return (
    <div>
      <div className="font-display text-4xl tracking-[4px] text-white mb-1">NOTES <span className="text-[#e74c3c]">PAD</span></div>
      <p className="text-[#888] text-sm mb-6">Your personal notepad</p>

      <div className="bg-[rgba(15,15,15,0.92)] border border-white/[0.07] rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText size={20} className="text-[#888]" />
          <span className="text-white font-semibold">My Notes</span>
          <button onClick={handleSave} disabled={saveMut.isPending} className="ml-auto flex items-center gap-2 bg-[#c0392b] hover:bg-[#e74c3c] text-white px-4 py-2 rounded text-sm font-semibold tracking-wide transition-all disabled:opacity-50">
            <Save size={14} /> {saveMut.isPending ? "Saving…" : "Save"}
          </button>
        </div>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Start writing your notes here..."
          className="w-full h-[500px] bg-white/[0.04] border border-white/[0.07] rounded px-4 py-3 text-sm text-white placeholder-[#555] focus:outline-none focus:border-red-700 resize-none"
          style={{ fontFamily: "monospace" }}
        />
      </div>
    </div>
  );
}