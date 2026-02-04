package com.sj.Workly.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sj.Workly.dto.comment.CommentResponse;
import com.sj.Workly.dto.comment.CreateCommentRequest;
import com.sj.Workly.entity.Comment;
import com.sj.Workly.entity.Issue;
import com.sj.Workly.entity.User;
import com.sj.Workly.entity.enums.AggregateType;
import com.sj.Workly.entity.enums.OrgEventType;
import com.sj.Workly.exception.NotFoundException;
import com.sj.Workly.exception.UnauthorizedException;
import com.sj.Workly.repository.CommentRepository;
import com.sj.Workly.repository.IssueRepository;
import com.sj.Workly.repository.ProjectMemberRepository;
import com.sj.Workly.service.outbox.OutboxWriter;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class CommentService {

    private final CommentRepository commentRepo;
    private final IssueRepository issueRepo;
    private final ProjectMemberRepository projectMemberRepo;
    private final OutboxWriter outboxWriter;
    private final ObjectMapper objectMapper;

    public CommentService(CommentRepository commentRepo,
                          IssueRepository issueRepo,
                          ProjectMemberRepository projectMemberRepo,
                          OutboxWriter outboxWriter,
                          ObjectMapper objectMapper) {
        this.commentRepo = commentRepo;
        this.issueRepo = issueRepo;
        this.projectMemberRepo = projectMemberRepo;
        this.outboxWriter = outboxWriter;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public List<CommentResponse> listByIssue(User actor, Long orgId, Long projectId, Long issueId) {
        requireProjectMember(actor.getId(), projectId);

        Issue issue = issueRepo.findByIdAndProjectId(issueId, projectId)
                .orElseThrow(() -> new NotFoundException("Issue not found"));

        return commentRepo.findByIssueIdOrderByCreatedAtAsc(issue.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public CommentResponse get(User actor, Long orgId, Long projectId, Long issueId, Long commentId) {
        requireProjectMember(actor.getId(), projectId);

        Issue issue = issueRepo.findByIdAndProjectId(issueId, projectId)
                .orElseThrow(() -> new NotFoundException("Issue not found"));

        Comment comment = commentRepo.findById(commentId)
                .orElseThrow(() -> new NotFoundException("Comment not found"));
        if (!comment.getIssue().getId().equals(issue.getId())) {
            throw new NotFoundException("Comment not found in this issue");
        }
        return toResponse(comment);
    }

    @Transactional
    public CommentResponse add(User actor, Long orgId, Long projectId, Long issueId, CreateCommentRequest req) {
        requireProjectMember(actor.getId(), projectId);

        Issue issue = issueRepo.findByIdAndProjectId(issueId, projectId)
                .orElseThrow(() -> new NotFoundException("Issue not found"));

        Comment comment = new Comment();
        comment.setIssue(issue);
        comment.setAuthor(actor);
        comment.setBody(req.getBody().trim());

        comment = commentRepo.save(comment);

        publishCommentAddedEvent(comment, issue);

        return toResponse(comment);
    }

    @Transactional
    public void delete(User actor, Long orgId, Long projectId, Long issueId, Long commentId) {
        requireProjectMember(actor.getId(), projectId);

        Comment comment = commentRepo.findById(commentId)
                .orElseThrow(() -> new NotFoundException("Comment not found"));
        Issue issue = issueRepo.findByIdAndProjectId(issueId, projectId)
                .orElseThrow(() -> new NotFoundException("Issue not found"));
        if (!comment.getIssue().getId().equals(issue.getId())) {
            throw new NotFoundException("Comment not found in this issue");
        }
        if (!comment.getAuthor().getId().equals(actor.getId())) {
            throw new UnauthorizedException("Only the comment author can delete this comment");
        }
        commentRepo.delete(comment);
    }

    private void publishCommentAddedEvent(Comment comment, Issue issue) {
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("comment_id", comment.getId());
            payload.put("issue_id", issue.getId());
            payload.put("project_id", issue.getProject().getId());
            payload.put("author_id", comment.getAuthor().getId());
            payload.put("author_name", comment.getAuthor().getName());
            payload.put("author_email", comment.getAuthor().getEmail());
            payload.put("body", comment.getBody());
            payload.put("created_at", comment.getCreatedAt().toString());
            payload.put("issue_title", issue.getTitle());
            if (issue.getAssignee() != null) {
                payload.put("assignee_id", issue.getAssignee().getId());
                payload.put("assignee_email", issue.getAssignee().getEmail());
            }
            if (issue.getReporter() != null) {
                payload.put("reporter_id", issue.getReporter().getId());
                payload.put("reporter_email", issue.getReporter().getEmail());
            }

            String payloadJson = objectMapper.writeValueAsString(payload);

            var orgIdUuid = OutboxWriter.longToUuid(issue.getProject().getOrg().getId());
            var commentIdUuid = OutboxWriter.longToUuid(comment.getId());
            String partitionKey = String.valueOf(issue.getId());

            outboxWriter.enqueueOrgEvent(
                    OrgEventType.ISSUE_COMMENTED,
                    orgIdUuid,
                    AggregateType.COMMENT,
                    commentIdUuid,
                    partitionKey,
                    payloadJson
            );
        } catch (Exception e) {
            System.err.println("Failed to enqueue outbox event for comment: " + e.getMessage());
        }
    }

    private void requireProjectMember(Long userId, Long projectId) {
        if (!projectMemberRepo.existsByProjectIdAndUserId(projectId, userId)) {
            throw new UnauthorizedException("Not a project member");
        }
    }

    private CommentResponse toResponse(Comment c) {
        CommentResponse r = new CommentResponse();
        r.setId(c.getId());
        r.setIssueId(c.getIssue().getId());
        r.setAuthorId(c.getAuthor().getId());
        r.setAuthorName(c.getAuthor().getName() != null ? c.getAuthor().getName() : c.getAuthor().getEmail());
        r.setBody(c.getBody());
        r.setCreatedAt(c.getCreatedAt());
        return r;
    }
}
