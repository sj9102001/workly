package com.sj.Workly.dto.activity;

import com.sj.Workly.entity.enums.ActivityType;

import java.time.Instant;

public class ActivityResponse {

    private Long id;
    private Long projectId;
    private ActivityType type;

    private Long actorId;
    private String actorName;

    private Long issueId;
    private String targetTitle;
    private String meta;

    private Instant createdAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getProjectId() { return projectId; }
    public void setProjectId(Long projectId) { this.projectId = projectId; }

    public ActivityType getType() { return type; }
    public void setType(ActivityType type) { this.type = type; }

    public Long getActorId() { return actorId; }
    public void setActorId(Long actorId) { this.actorId = actorId; }

    public String getActorName() { return actorName; }
    public void setActorName(String actorName) { this.actorName = actorName; }

    public Long getIssueId() { return issueId; }
    public void setIssueId(Long issueId) { this.issueId = issueId; }

    public String getTargetTitle() { return targetTitle; }
    public void setTargetTitle(String targetTitle) { this.targetTitle = targetTitle; }

    public String getMeta() { return meta; }
    public void setMeta(String meta) { this.meta = meta; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
