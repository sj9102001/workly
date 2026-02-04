package com.sj.Workly.controller;

import com.sj.Workly.dto.comment.CommentResponse;
import com.sj.Workly.dto.comment.CreateCommentRequest;
import com.sj.Workly.entity.User;
import com.sj.Workly.service.CommentService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/orgs/{orgId}/projects/{projectId}/issues/{issueId}/comments")
public class CommentController {

    private final CommentService commentService;

    public CommentController(CommentService commentService) {
        this.commentService = commentService;
    }

    /** List all comments for an issue, ordered by created date ascending. */
    @GetMapping
    public List<CommentResponse> list(@AuthenticationPrincipal User user,
                                      @PathVariable Long orgId,
                                      @PathVariable Long projectId,
                                      @PathVariable Long issueId) {
        return commentService.listByIssue(user, orgId, projectId, issueId);
    }

    /** Get a single comment by id. */
    @GetMapping("/{commentId}")
    public CommentResponse get(@AuthenticationPrincipal User user,
                               @PathVariable Long orgId,
                               @PathVariable Long projectId,
                               @PathVariable Long issueId,
                               @PathVariable Long commentId) {
        return commentService.get(user, orgId, projectId, issueId, commentId);
    }

    /** Add a comment to an issue. Publishes ISSUE_COMMENTED to outbox (Kafka). */
    @PostMapping
    public CommentResponse add(@AuthenticationPrincipal User user,
                               @PathVariable Long orgId,
                               @PathVariable Long projectId,
                               @PathVariable Long issueId,
                               @Valid @RequestBody CreateCommentRequest req) {
        return commentService.add(user, orgId, projectId, issueId, req);
    }

    /** Delete a comment. Only the comment author can delete. */
    @DeleteMapping("/{commentId}")
    public void delete(@AuthenticationPrincipal User user,
                      @PathVariable Long orgId,
                      @PathVariable Long projectId,
                      @PathVariable Long issueId,
                      @PathVariable Long commentId) {
        commentService.delete(user, orgId, projectId, issueId, commentId);
    }
}
