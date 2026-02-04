"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Trash2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  useIssueComments,
  useAddIssueComment,
  useDeleteIssueComment,
} from "@/hooks/use-queries";

const COMMENT_BODY_MAX = 10000;

interface IssueCommentsProps {
  orgId: number;
  projectId: number;
  issueId: number;
  currentUserId: number | null;
  compact?: boolean;
}

export function IssueComments({
  orgId,
  projectId,
  issueId,
  currentUserId,
  compact = false,
}: IssueCommentsProps) {
  const [newBody, setNewBody] = useState("");
  const [deleteCommentId, setDeleteCommentId] = useState<number | null>(null);

  const { data: comments = [], isLoading } = useIssueComments(orgId, projectId, issueId);
  const addComment = useAddIssueComment();
  const deleteComment = useDeleteIssueComment();

  const handleSubmit = async () => {
    const body = newBody.trim();
    if (!body || body.length > COMMENT_BODY_MAX) return;
    await addComment.mutateAsync({ orgId, projectId, issueId, body });
    setNewBody("");
  };

  const handleDelete = async () => {
    if (deleteCommentId === null) return;
    await deleteComment.mutateAsync({ orgId, projectId, issueId, commentId: deleteCommentId });
    setDeleteCommentId(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <Avatar className={compact ? "h-8 w-8" : "h-9 w-9"}>
          <AvatarFallback className="text-xs">
            {currentUserId != null ? String(currentUserId).slice(-2) : "?"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2">
          <Textarea
            placeholder="Add a comment..."
            value={newBody}
            onChange={(e) => setNewBody(e.target.value)}
            className="min-h-[80px] resize-none"
            maxLength={COMMENT_BODY_MAX + 1}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {newBody.length > COMMENT_BODY_MAX
                ? `${newBody.length - COMMENT_BODY_MAX} over limit`
                : `${newBody.length}/${COMMENT_BODY_MAX} characters`}
            </span>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!newBody.trim() || newBody.length > COMMENT_BODY_MAX || addComment.isPending}
            >
              {addComment.isPending ? "Sending..." : "Comment"}
            </Button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading comments...</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No comments yet.</p>
      ) : (
        <ul className="space-y-4">
          {comments.map((c) => (
            <li key={c.id} className="flex gap-3">
              <Avatar className={compact ? "h-8 w-8" : "h-9 w-9"}>
                <AvatarFallback className="text-xs">
                  {c.authorName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">{c.authorName}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                  </span>
                  {currentUserId === c.authorId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-destructive hover:text-destructive"
                      onClick={() => setDeleteCommentId(c.id)}
                      disabled={deleteComment.isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
                <p className="text-sm mt-0.5 whitespace-pre-wrap break-words">{c.body}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <AlertDialog open={deleteCommentId !== null} onOpenChange={() => setDeleteCommentId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete comment?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteComment.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
