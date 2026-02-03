package com.sj.Workly.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.ColumnTransformer;

import java.time.Instant;

@Entity
@Table(name = "notifications", indexes = @Index(name = "idx_notification_user", columnList = "user_id"))
public class Notification {

    public enum Type {
        ISSUE_ASSIGNED,
        ISSUE_COMMENTED,
        ISSUE_STATUS_CHANGED,
        INVITE_RECEIVED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // MANY notifications belong to ONE user
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Type type;

    @Column(nullable = false)
    private String message;

    @Column(name = "action_event", length = 100)
    private String actionEvent;

    @Column(name = "action_payload", columnDefinition = "jsonb")
    @ColumnTransformer(write = "?::jsonb")
    private String actionPayload;

    // Optional references
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "issue_id")
    private Issue issue;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "comment_id")
    private Comment comment;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    private Instant readAt; // null = unread

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
    }

    public Notification() {}

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Type getType() {
        return type;
    }

    public void setType(Type type) {
        this.type = type;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getActionEvent() {
        return actionEvent;
    }

    public void setActionEvent(String actionEvent) {
        this.actionEvent = actionEvent;
    }

    public String getActionPayload() {
        return actionPayload;
    }

    public void setActionPayload(String actionPayload) {
        this.actionPayload = actionPayload;
    }

    public Issue getIssue() {
        return issue;
    }

    public void setIssue(Issue issue) {
        this.issue = issue;
    }

    public Comment getComment() {
        return comment;
    }

    public void setComment(Comment comment) {
        this.comment = comment;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getReadAt() {
        return readAt;
    }

    public void setReadAt(Instant readAt) {
        this.readAt = readAt;
    }
}
