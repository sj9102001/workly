package com.sj.Workly.dto.issue;

import com.sj.Workly.entity.enums.IssueStatus;
import jakarta.validation.constraints.NotNull;

public class MoveIssueRequest {

    @NotNull
    private Long columnId;        // required - target column
    private IssueStatus status;  // nullable => keep same

    // For ordering in the target column:
    // place the moved issue between these two issues (both optional)
    private Long beforeIssueId;  // the issue that will be ABOVE the moved issue
    private Long afterIssueId;   // the issue that will be BELOW the moved issue

    public Long getColumnId() { return columnId; }
    public void setColumnId(Long columnId) { this.columnId = columnId; }

    public IssueStatus getStatus() { return status; }
    public void setStatus(IssueStatus status) { this.status = status; }

    public Long getBeforeIssueId() { return beforeIssueId; }
    public void setBeforeIssueId(Long beforeIssueId) { this.beforeIssueId = beforeIssueId; }

    public Long getAfterIssueId() { return afterIssueId; }
    public void setAfterIssueId(Long afterIssueId) { this.afterIssueId = afterIssueId; }
}
