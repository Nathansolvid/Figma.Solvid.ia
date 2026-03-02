// ============================================================================
// COLLABORATION ROUTES - Phase 8
// ============================================================================
// Routes pour système de commentaires, @mentions et collaboration temps réel

import { Context } from "npm:hono";
import * as kv from "./kv_store.tsx";

// ============================================================================
// TYPES
// ============================================================================

interface Comment {
  id: string;
  entityType: "indicator" | "pack" | "dossier" | "evidence" | "checklist-item";
  entityId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  mentions: string[]; // User IDs mentioned
  parentId?: string; // For threaded replies
  createdAt: string;
  updatedAt?: string;
  isEdited: boolean;
  isDeleted: boolean;
}

interface CommentThread {
  comment: Comment;
  replies: Comment[];
  replyCount: number;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Extract @mentions from comment content
function extractMentions(content: string): string[] {
  const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
  const mentions: string[] = [];
  let match;
  
  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push(match[2]); // User ID is in parentheses
  }
  
  return mentions;
}

// Generate comment ID
function generateCommentId(): string {
  return `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Get all comments for an entity
async function getCommentsForEntity(
  entityType: string,
  entityId: string
): Promise<Comment[]> {
  const prefix = `comment:${entityType}:${entityId}:`;
  const results = await kv.getByPrefix(prefix);
  
  return results
    .map((item) => item.value as Comment)
    .filter((c) => !c.isDeleted)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

// Build comment threads (group replies with parent comments)
function buildThreads(comments: Comment[]): CommentThread[] {
  const topLevelComments = comments.filter((c) => !c.parentId);
  const repliesMap = new Map<string, Comment[]>();
  
  // Group replies by parent ID
  comments
    .filter((c) => c.parentId)
    .forEach((reply) => {
      if (!repliesMap.has(reply.parentId!)) {
        repliesMap.set(reply.parentId!, []);
      }
      repliesMap.get(reply.parentId!)!.push(reply);
    });
  
  // Build threads
  return topLevelComments.map((comment) => ({
    comment,
    replies: repliesMap.get(comment.id) || [],
    replyCount: (repliesMap.get(comment.id) || []).length,
  }));
}

// ============================================================================
// EXPORTED ROUTE HANDLERS
// ============================================================================

// Create comment
export async function createComment(c: Context) {
  try {
    const {
      entityType,
      entityId,
      authorId,
      authorName,
      authorAvatar,
      content,
      parentId,
    } = await c.req.json();

    console.log(`📝 POST /comments - Creating comment for ${entityType}:${entityId}`);

    if (!entityType || !entityId || !authorId || !authorName || !content) {
      return c.json(
        { error: "Missing required fields: entityType, entityId, authorId, authorName, content" },
        400
      );
    }

    const commentId = generateCommentId();
    const mentions = extractMentions(content);
    
    const comment: Comment = {
      id: commentId,
      entityType,
      entityId,
      authorId,
      authorName,
      authorAvatar,
      content,
      mentions,
      parentId,
      createdAt: new Date().toISOString(),
      isEdited: false,
      isDeleted: false,
    };

    const key = `comment:${entityType}:${entityId}:${commentId}`;
    await kv.set(key, comment);

    console.log(`✅ Comment created: ${commentId} on ${entityType}:${entityId}`);

    // Create notifications for mentioned users
    if (mentions.length > 0) {
      console.log(`📬 Creating notifications for ${mentions.length} mentioned users`);
      
      for (const mentionedUserId of mentions) {
        const notificationId = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const notification = {
          id: notificationId,
          userId: mentionedUserId,
          type: "mention",
          title: `${authorName} vous a mentionné`,
          message: content.substring(0, 100) + (content.length > 100 ? "..." : ""),
          entityType,
          entityId,
          commentId,
          read: false,
          createdAt: new Date().toISOString(),
          actorId: authorId,
          actorName: authorName,
        };

        await kv.set(`notification:${mentionedUserId}:${notificationId}`, notification);
        console.log(`📬 Notification created for user ${mentionedUserId}`);
      }
    }

    return c.json({ success: true, comment });
  } catch (error: any) {
    console.error("Error creating comment:", error);
    return c.json({ error: `Failed to create comment: ${error.message}` }, 500);
  }
}

// Get comments for entity
export async function getComments(c: Context) {
  try {
    const entityType = c.req.param("entityType");
    const entityId = c.req.param("entityId");
    const includeThreads = c.req.query("threads") === "true";

    console.log(`📥 GET /comments/${entityType}/${entityId}?threads=${includeThreads}`);

    const comments = await getCommentsForEntity(entityType, entityId);
    console.log(`📥 Found ${comments.length} comments for ${entityType}:${entityId}`);

    if (includeThreads) {
      const threads = buildThreads(comments);
      console.log(`📥 Built ${threads.length} threads from ${comments.length} comments`);
      return c.json({ success: true, threads, totalComments: comments.length });
    }

    return c.json({ success: true, comments, totalComments: comments.length });
  } catch (error: any) {
    console.error("Error fetching comments:", error);
    return c.json({ error: `Failed to fetch comments: ${error.message}` }, 500);
  }
}

// Update comment
export async function updateComment(c: Context) {
  try {
    const commentId = c.req.param("commentId");
    const { content, authorId } = await c.req.json();

    if (!content) {
      return c.json({ error: "Content is required" }, 400);
    }

    // Find the comment (we need to search across all entity types)
    const allComments = await kv.getByPrefix("comment:");
    const commentItem = allComments.find((item) => (item.value as Comment).id === commentId);

    if (!commentItem) {
      return c.json({ error: "Comment not found" }, 404);
    }

    const comment = commentItem.value as Comment;

    // Verify author
    if (comment.authorId !== authorId) {
      return c.json({ error: "Unauthorized: You can only edit your own comments" }, 403);
    }

    // Update comment
    const mentions = extractMentions(content);
    const updatedComment: Comment = {
      ...comment,
      content,
      mentions,
      updatedAt: new Date().toISOString(),
      isEdited: true,
    };

    await kv.set(commentItem.key, updatedComment);

    console.log(`✅ Comment updated: ${commentId}`);

    return c.json({ success: true, comment: updatedComment });
  } catch (error: any) {
    console.error("Error updating comment:", error);
    return c.json({ error: `Failed to update comment: ${error.message}` }, 500);
  }
}

// Delete comment (soft delete)
export async function deleteComment(c: Context) {
  try {
    const commentId = c.req.param("commentId");
    const authorId = c.req.query("authorId");

    if (!authorId) {
      return c.json({ error: "authorId query parameter is required" }, 400);
    }

    // Find the comment
    const allComments = await kv.getByPrefix("comment:");
    const commentItem = allComments.find((item) => (item.value as Comment).id === commentId);

    if (!commentItem) {
      return c.json({ error: "Comment not found" }, 404);
    }

    const comment = commentItem.value as Comment;

    // Verify author
    if (comment.authorId !== authorId) {
      return c.json({ error: "Unauthorized: You can only delete your own comments" }, 403);
    }

    // Soft delete
    const deletedComment: Comment = {
      ...comment,
      isDeleted: true,
      content: "[Commentaire supprimé]",
      updatedAt: new Date().toISOString(),
    };

    await kv.set(commentItem.key, deletedComment);

    console.log(`✅ Comment deleted: ${commentId}`);

    return c.json({ success: true, message: "Comment deleted" });
  } catch (error: any) {
    console.error("Error deleting comment:", error);
    return c.json({ error: `Failed to delete comment: ${error.message}` }, 500);
  }
}

// Get comment count for entity
export async function getCommentCount(c: Context) {
  try {
    const entityType = c.req.param("entityType");
    const entityId = c.req.param("entityId");

    const comments = await getCommentsForEntity(entityType, entityId);

    return c.json({ success: true, count: comments.length });
  } catch (error: any) {
    console.error("Error counting comments:", error);
    return c.json({ error: `Failed to count comments: ${error.message}` }, 500);
  }
}

// Search users for mentions (returns list of users that can be mentioned)
export async function searchUsers(c: Context) {
  try {
    const query = c.req.query("q")?.toLowerCase() || "";
    
    console.log(`🔍 Searching users with query: "${query}"`);
    
    // Get all users from kv store
    const userResults = await kv.getByPrefix("user:");
    
    console.log(`🔍 Found ${userResults.length} total users in database`);
    
    const users = userResults
      .map((item) => item.value)
      .filter((user: any) => {
        // Ensure user object exists and has required properties
        if (!user || typeof user !== 'object') return false;
        const name = user.name?.toLowerCase() || "";
        const email = user.email?.toLowerCase() || "";
        return name.includes(query) || email.includes(query);
      })
      .slice(0, 10) // Limit to 10 results
      .map((user: any) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
      }));

    console.log(`🔍 Returning ${users.length} filtered users`);

    return c.json({ success: true, users });
  } catch (error: any) {
    console.error("Error searching users:", error);
    return c.json({ error: `Failed to search users: ${error.message}` }, 500);
  }
}