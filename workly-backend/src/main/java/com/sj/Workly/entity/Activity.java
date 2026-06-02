package com.sj.Workly.entity;

import com.sj.Workly.entity.enums.ActivityType;
import jakarta.persistence.*;
import java.time.Instant;

/**
 * A project-scoped activity-feed entry. Recorded synchronously when issues are
 * created, moved, assigned, commented on, etc., so the dashboard can render a
 * "recent activity" timeline without scanning the outbox.
 *
 * <p>{@link #targetTitle} is denormalised (snapshot of the issue title at the
 * time of the event) so the feed reads correctly even if the issue is later
 * renamed or deleted. {@link #meta} carries a short human-readable detail such
 * as "To Do → In Progress".
 */
@Entity
@Table(
        name = "activities",
        indexes = {
                @Index(name = "idx_activity_project", columnList = "project_id"),
                @Index(name = "idx_activity_issue", columnList = "issue_id"),
                @Index(name = "idx_activity_created", columnList = "created_at")
        }
)
public class Activity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    // The user who performed the action.
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "actor_user_id", nullable = false)
    private User actor;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private ActivityType type;

    // Issue the activity relates to (nullable so we keep history if the issue is deleted).
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "issue_id")
    private Issue issue;

    @Column(name = "target_title", length = 300)
    private String targetTitle;

    @Column(length = 300)
    private String meta;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
    }

    public Activity() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Project getProject() { return project; }
    public void setProject(Project project) { this.project = project; }

    public User getActor() { return actor; }
    public void setActor(User actor) { this.actor = actor; }

    public ActivityType getType() { return type; }
    public void setType(ActivityType type) { this.type = type; }

    public Issue getIssue() { return issue; }
    public void setIssue(Issue issue) { this.issue = issue; }

    public String getTargetTitle() { return targetTitle; }
    public void setTargetTitle(String targetTitle) { this.targetTitle = targetTitle; }

    public String getMeta() { return meta; }
    public void setMeta(String meta) { this.meta = meta; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
