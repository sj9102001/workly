package com.sj.Workly.dto.issue;

import com.sj.Workly.entity.enums.IssuePriority;
import com.sj.Workly.entity.enums.IssueStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class CreateIssueRequest {

    @NotBlank
    @Size(min = 2, max = 200)
    private String title;

    private String description;

    private IssuePriority priority = IssuePriority.MEDIUM;
    private IssueStatus status = IssueStatus.TO_DO;

    private Long boardId;     // optional
    private Long assigneeId;  // optional

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public IssuePriority getPriority() { return priority; }
    public void setPriority(IssuePriority priority) { this.priority = priority; }

    public IssueStatus getStatus() { return status; }
    public void setStatus(IssueStatus status) { this.status = status; }

    public Long getBoardId() { return boardId; }
    public void setBoardId(Long boardId) { this.boardId = boardId; }

    public Long getAssigneeId() { return assigneeId; }
    public void setAssigneeId(Long assigneeId) { this.assigneeId = assigneeId; }
}
