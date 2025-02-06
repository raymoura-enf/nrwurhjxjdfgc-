import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import type { Note } from "@shared/schema";
import NoteInput from "@/components/NoteInput";
import NoteMessage from "@/components/NoteMessage";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

export default function Feed() {
  const [content, setContent] = useState("");
  
  const { data: notes = [], isLoading } = useQuery<Note[]>({
    queryKey: ["/api/notes"],
  });

  const createNote = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest("POST", "/api/notes", { content });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      setContent("");
    },
  });

  const handleSubmit = (content: string) => {
    createNote.mutate(content);
  };

  if (isLoading) {
    return <div className="flex justify-center mt-8">Loading...</div>;
  }

  return (
    <div className="relative h-[calc(100vh-8rem)]">
      <ScrollArea className="h-[calc(100vh-12rem)]">
        <div className="space-y-4 p-4">
          {notes.map((note) => (
            <NoteMessage key={note.id} note={note} />
          ))}
        </div>
      </ScrollArea>
      <NoteInput
        value={content}
        onChange={setContent}
        onSubmit={handleSubmit}
        isLoading={createNote.isPending}
      />
    </div>
  );
}
