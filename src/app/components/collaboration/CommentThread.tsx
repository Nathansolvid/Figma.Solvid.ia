// ============================================================================
// COMMENT THREAD - Phase 8
// ============================================================================
// Affichage d'un fil de commentaires avec réponses threadées

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { MessageSquare, Send, Edit2, Trash2, Reply, MoreVertical } from "lucide-react";
import { CommentInput } from "@/app/components/collaboration/CommentInput";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { projectId, publicAnonKey } from "/utils/supabase/info";

interface Comment {
  id: string;
  entityType: string;
  entityId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  mentions: string[];
  parentId?: string;
  createdAt: string;
  updatedAt?: string;
  isEdited: boolean;
  isDeleted: boolean;
}

interface CommentThreadData {
  comment: Comment;
  replies: Comment[];
  replyCount: number;
}

interface CommentThreadProps {
  entityType: "indicator" | "pack" | "dossier" | "evidence" | "checklist-item";
  entityId: string;
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar?: string;
  onCommentAdded?: () => void;
}

export function CommentThread({
  entityType,
  entityId,
  currentUserId,
  currentUserName,
  currentUserAvatar,
  onCommentAdded,
}: CommentThreadProps) {
  const [threads, setThreads] = useState<CommentThreadData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<string | null>(null);

  const loadComments = async () => {
    try {
      setLoading(true);
      const url = `https://${projectId}.supabase.co/functions/v1/make-server-aa780fc8/comments/${entityType}/${entityId}?threads=true`;
      
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${publicAnonKey}`,
        },
      });

      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Response error body:`, errorText);
        throw new Error(`Échec du chargement des commentaires: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      setThreads(data.threads || []);
      setError(null);
    } catch (err: any) {
      console.error("Error loading comments:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, [entityType, entityId]);

  const handleCommentSubmit = async (content: string, parentId?: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-aa780fc8/comments`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            entityType,
            entityId,
            authorId: currentUserId,
            authorName: currentUserName,
            authorAvatar: currentUserAvatar,
            content,
            parentId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Échec de l'envoi du commentaire");
      }

      // Reload comments
      await loadComments();
      setReplyingTo(null);
      onCommentAdded?.();
    } catch (err: any) {
      console.error("Error submitting comment:", err);
      alert(`Erreur : ${err.message}`);
    }
  };

  const handleCommentUpdate = async (commentId: string, newContent: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-aa780fc8/comments/${commentId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: newContent,
            authorId: currentUserId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Échec de la modification du commentaire");
      }

      await loadComments();
      setEditingComment(null);
    } catch (err: any) {
      console.error("Error updating comment:", err);
      alert(`Erreur : ${err.message}`);
    }
  };

  const handleCommentDelete = async (commentId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce commentaire ?")) {
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-aa780fc8/comments/${commentId}?authorId=${currentUserId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Échec de la suppression du commentaire");
      }

      await loadComments();
    } catch (err: any) {
      console.error("Error deleting comment:", err);
      alert(`Erreur : ${err.message}`);
    }
  };

  const renderComment = (comment: Comment, isReply: boolean = false) => {
    const isAuthor = comment.authorId === currentUserId;
    const isEditing = editingComment === comment.id;
    const isReplying = replyingTo === comment.id;

    return (
      <div key={comment.id} className={`${isReply ? "ml-12 mt-3" : ""}`}>
        <div className="flex gap-3">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-[#059669] rounded-full flex items-center justify-center text-white text-sm font-semibold">
              {comment.authorAvatar || comment.authorName[0]}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="bg-gray-50 rounded-lg p-3">
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-[#0A3B2E]">
                    {comment.authorName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.createdAt), {
                      addSuffix: true,
                      locale: fr,
                    })}
                  </span>
                  {comment.isEdited && (
                    <Badge variant="outline" className="text-xs">
                      Modifié
                    </Badge>
                  )}
                </div>

                {/* Actions (only for author) */}
                {isAuthor && !isEditing && (
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => setEditingComment(comment.id)}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                      onClick={() => handleCommentDelete(comment.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Content or Edit Form */}
              {isEditing ? (
                <div className="space-y-2">
                  <CommentInput
                    currentUserId={currentUserId}
                    currentUserName={currentUserName}
                    onSubmit={(content) => handleCommentUpdate(comment.id, content)}
                    placeholder="Modifier votre commentaire..."
                    initialValue={comment.content}
                    autoFocus
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingComment(null)}
                  >
                    Annuler
                  </Button>
                </div>
              ) : (
                <div className="text-sm text-gray-700 whitespace-pre-wrap">
                  {renderContentWithMentions(comment.content)}
                </div>
              )}
            </div>

            {/* Reply Button */}
            {!isReply && !isEditing && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-1 h-7 text-xs"
                onClick={() => setReplyingTo(comment.id)}
              >
                <Reply className="h-3 w-3 mr-1" />
                Répondre
              </Button>
            )}

            {/* Reply Form */}
            {isReplying && (
              <div className="mt-3">
                <CommentInput
                  currentUserId={currentUserId}
                  currentUserName={currentUserName}
                  onSubmit={(content) => handleCommentSubmit(content, comment.id)}
                  placeholder={`Répondre à ${comment.authorName}...`}
                  autoFocus
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                  onClick={() => setReplyingTo(null)}
                >
                  Annuler
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderContentWithMentions = (content: string) => {
    // Parse @[Name](userId) mentions and render them with highlighting
    const parts = content.split(/(@\[([^\]]+)\]\(([^)]+)\))/g);
    
    return parts.map((part, index) => {
      if (part.startsWith("@[")) {
        const match = part.match(/@\[([^\]]+)\]\(([^)]+)\)/);
        if (match) {
          const [, name] = match;
          return (
            <span
              key={index}
              className="bg-blue-100 text-blue-700 px-1 rounded font-semibold"
            >
              @{name}
            </span>
          );
        }
      }
      return <span key={index}>{part}</span>;
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#059669]"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="p-6">
          <p className="text-sm text-red-600">Erreur : {error}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={loadComments}
          >
            Réessayer
          </Button>
        </CardContent>
      </Card>
    );
  }

  const totalComments = threads.reduce(
    (sum, thread) => sum + 1 + thread.replyCount,
    0
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-[#059669]" />
          Commentaires
          {totalComments > 0 && (
            <Badge variant="secondary">{totalComments}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* New Comment Form */}
        <CommentInput
          currentUserId={currentUserId}
          currentUserName={currentUserName}
          onSubmit={(content) => handleCommentSubmit(content)}
          placeholder="Ajouter un commentaire... (utilisez @ pour mentionner quelqu'un)"
        />

        {/* Comments List */}
        {threads.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Aucun commentaire pour le moment</p>
            <p className="text-xs mt-1">Soyez le premier à commenter !</p>
          </div>
        ) : (
          <div className="space-y-4">
            {threads.map((thread) => (
              <div key={thread.comment.id}>
                {renderComment(thread.comment)}
                {thread.replies.map((reply) => renderComment(reply, true))}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}