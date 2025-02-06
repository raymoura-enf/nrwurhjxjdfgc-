import { format } from "date-fns";
import type { Note } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";

interface NoteMessageProps {
  note: Note;
}

export default function NoteMessage({ note }: NoteMessageProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">
            {format(new Date(note.createdAt), "PPp")}
          </p>
          <p className="text-sm">{note.content}</p>
        </div>
      </CardContent>
    </Card>
  );
}
