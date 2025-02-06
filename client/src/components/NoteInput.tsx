import { SendIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface NoteInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (content: string) => void;
  isLoading?: boolean;
}

export default function NoteInput({ 
  value, 
  onChange, 
  onSubmit,
  isLoading 
}: NoteInputProps) {
  return (
    <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t">
      <div className="flex gap-2">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type your note here..."
          className="resize-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (value.trim()) {
                onSubmit(value);
              }
            }
          }}
        />
        <Button 
          size="icon"
          disabled={!value.trim() || isLoading}
          onClick={() => onSubmit(value)}
        >
          <SendIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
