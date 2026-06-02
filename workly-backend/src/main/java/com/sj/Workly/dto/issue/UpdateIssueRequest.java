package com.sj.Workly.dto.issue;

import com.sj.Workly.entity.enums.IssuePriority;
import com.sj.Workly.entity.enums.IssueStatus;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.List;

public class UpdateIssueRequest {

    @Size(min = 2, max = 200)
    private String title;

    private String description;

    private IssuePriority priority;
    private IssueStatus status;

    private Long columnId;     // move to column
    private Long assigneeId;  // assign

    // null = leave unchanged. To explicitly clear, use the matching clear* flag.
    @PositiveOrZero
    private Integer storyPoints;
    private boolean clearStoryPoints;

    private LocalDate dueDate;
    private boolean clearDueDate;

    private Long sprintId;
    private boolean clearSprint;

    // null = leave unchanged; non-null = replace the whole label set (empty list clears).
    private List<Long> labelIds;

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public IssuePriority getPriority() { return priority; }
    public void setPriority(IssuePriority priority) { this.priority = priority; }

    public IssueStatus getStatus() { return status; }
    public void setStatus(IssueStatus status) { this.status = status; }

    public Long getColumnId() { return columnId; }
    public void setColumnId(Long columnId) { this.columnId = columnId; }

    public Long getAssigneeId() { return assigneeId; }
    public void setAssigneeId(Long assigneeId) { this.assigneeId = assigneeId; }

    public Integer getStoryPoints() { return storyPoints; }
    public void setStoryPoints(Integer storyPoints) { this.storyPoints = storyPoints; }

    public boolean isClearStoryPoints() { return clearStoryPoints; }
    public void setClearStoryPoints(boolean clearStoryPoints) { this.clearStoryPoints = clearStoryPoints; }

    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }

    public boolean isClearDueDate() { return clearDueDate; }
    public void setClearDueDate(boolean clearDueDate) { this.clearDueDate = clearDueDate; }

    public Long getSprintId() { return sprintId; }
    public void setSprintId(Long sprintId) { this.sprintId = sprintId; }

    public boolean isClearSprint() { return clearSprint; }
    public void setClearSprint(boolean clearSprint) { this.clearSprint = clearSprint; }

    public List<Long> getLabelIds() { return labelIds; }
    public void setLabelIds(List<Long> labelIds) { this.labelIds = labelIds; }
}
