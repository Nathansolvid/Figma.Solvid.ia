import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Textarea } from "@/app/components/ui/textarea";
import { Badge } from "@/app/components/ui/badge";
import { 
  MessageSquare,
  Send,
  User,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { useState } from "react";

interface Comment {
  id: number;
  author: string;
  role: "client" | "consultant" | "auditeur";
  timestamp: string;
  content: string;
  status?: "resolved" | "pending";
}

interface CommentThreadProps {
  dataPointId: string;
  dataPointName: string;
  comments: Comment[];
}

const roleColors = {
  client: "bg-blue-100 text-blue-800",
  consultant: "bg-purple-100 text-purple-800",
  auditeur: "bg-orange-100 text-orange-800",
};

const roleLabels = {
  client: "Client",
  consultant: "Consultant",
  auditeur: "Auditeur",
};

export function CommentThread({ dataPointId, dataPointName, comments }: CommentThreadProps) {
  const [newComment, setNewComment] = useState("");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageSquare className="h-5 w-5" />
          Commentaires — {dataPointName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing comments */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {comments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucun commentaire pour l'instant
            </p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="border border-border rounded-lg p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#E8F3F0] flex items-center justify-center">
                      <User className="h-4 w-4 text-[#0F4C3A]" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{comment.author}</p>
                      <Badge className={`text-xs ${roleColors[comment.role]}`}>
                        {roleLabels[comment.role]}
                      </Badge>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{comment.timestamp}</span>
                </div>
                <p className="text-sm text-foreground pl-10">{comment.content}</p>
                {comment.status && (
                  <div className="pl-10">
                    <Badge 
                      variant={comment.status === 'resolved' ? 'default' : 'secondary'}
                      className={comment.status === 'resolved' ? 'bg-[#059669] text-white' : ''}
                    >
                      {comment.status === 'resolved' ? (
                        <>
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Résolu
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-3 w-3 mr-1" />
                          En attente
                        </>
                      )}
                    </Badge>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* New comment form */}
        <div className="space-y-2 pt-4 border-t border-border">
          <Textarea
            placeholder="Ajouter un commentaire..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
          />
          <div className="flex justify-end">
            <Button 
              size="sm" 
              className="bg-[#0F4C3A] hover:bg-[#0A3B2E]"
              disabled={!newComment.trim()}
            >
              <Send className="h-4 w-4 mr-2" />
              Envoyer
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
