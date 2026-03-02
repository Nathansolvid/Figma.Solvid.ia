// ============================================================================
// COMMENT INPUT - Phase 8
// ============================================================================
// Éditeur de commentaire avec autocomplete @mentions
// Textarea avec ref support v2

import { useState, useRef, useEffect } from "react";
import { Button } from "@/app/components/ui/button";
import { Textarea } from "@/app/components/ui/textarea";
import { Send, AtSign } from "lucide-react";
import { projectId, publicAnonKey } from "/utils/supabase/info";

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
}

interface CommentInputProps {
  currentUserId: string;
  currentUserName: string;
  onSubmit: (content: string) => void;
  placeholder?: string;
  initialValue?: string;
  autoFocus?: boolean;
}

export function CommentInput({
  currentUserId,
  currentUserName,
  onSubmit,
  placeholder = "Ajouter un commentaire...",
  initialValue = "",
  autoFocus = false,
}: CommentInputProps) {
  const [content, setContent] = useState(initialValue);
  const [showMentionPicker, setShowMentionPicker] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const [mentionPosition, setMentionPosition] = useState(0);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserIndex, setSelectedUserIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (initialValue) {
      setContent(initialValue);
    }
  }, [initialValue]);

  // Search users when mention picker is shown
  useEffect(() => {
    if (showMentionPicker && mentionSearch) {
      searchUsers(mentionSearch);
    }
  }, [mentionSearch, showMentionPicker]);

  const searchUsers = async (query: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-aa780fc8/users/search?q=${encodeURIComponent(query)}`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error("Error searching users:", err);
    }
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);

    // Detect @ mentions
    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = newContent.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");

    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      
      // Check if we're in a mention context (no spaces after @)
      if (!textAfterAt.includes(" ") && textAfterAt.length <= 20) {
        setMentionSearch(textAfterAt);
        setMentionPosition(lastAtIndex);
        setShowMentionPicker(true);
        setSelectedUserIndex(0);
      } else {
        setShowMentionPicker(false);
      }
    } else {
      setShowMentionPicker(false);
    }
  };

  const insertMention = (user: User) => {
    const beforeMention = content.substring(0, mentionPosition);
    const afterMention = content.substring(
      mentionPosition + mentionSearch.length + 1
    );

    // Format: @[Name](userId)
    const mention = `@[${user.name}](${user.id})`;
    const newContent = beforeMention + mention + " " + afterMention;

    setContent(newContent);
    setShowMentionPicker(false);
    setMentionSearch("");

    // Focus back on textarea
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newCursorPosition =
          beforeMention.length + mention.length + 1;
        textareaRef.current.setSelectionRange(
          newCursorPosition,
          newCursorPosition
        );
      }
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showMentionPicker && users.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedUserIndex((prev) => (prev + 1) % users.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedUserIndex((prev) =>
          prev === 0 ? users.length - 1 : prev - 1
        );
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        insertMention(users[selectedUserIndex]);
      } else if (e.key === "Escape") {
        setShowMentionPicker(false);
      }
    } else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    const trimmedContent = content.trim();
    if (trimmedContent) {
      onSubmit(trimmedContent);
      setContent("");
      setShowMentionPicker(false);
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={handleContentChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="min-h-[80px] pr-12 resize-none"
          autoFocus={autoFocus}
        />
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={!content.trim()}
          className="absolute bottom-2 right-2 h-8 w-8 p-0 bg-[#059669] hover:bg-[#047857]"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

      {/* Mention Picker Dropdown */}
      {showMentionPicker && users.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {users.map((user, index) => (
            <button
              key={user.id}
              onClick={() => insertMention(user)}
              className={`w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 ${
                index === selectedUserIndex ? "bg-blue-50" : ""
              }`}
            >
              <div className="w-8 h-8 bg-[#059669] rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                {user.avatar || user.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.name}
                </p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
              <AtSign className="h-4 w-4 text-gray-400 flex-shrink-0" />
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
        <span>
          <AtSign className="h-3 w-3 inline mr-1" />
          Utilisez @ pour mentionner quelqu'un
        </span>
        <span>Cmd/Ctrl + Enter pour envoyer</span>
      </div>
    </div>
  );
}