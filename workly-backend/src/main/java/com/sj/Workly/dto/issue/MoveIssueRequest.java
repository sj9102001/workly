package com.sj.Workly.dto.issue;

import com.sj.Workly.entity.enums.IssueStatus;

public class MoveIssueRequest {

    private Long boardId;        // nullable => remove from board
    private IssueStatus status;  // nullable => keep same

    // For ordering in the target board:
    // place the moved issue between these two issues (both optional)
    private Long beforeIssueId;  // the issue that will be ABOVE the moved issue
    private Long afterIssueId;   // the issue that will be BELOW the moved issue

    public Long getBoardId() { return boardId; }
    public void setBoardId(Long boardId) { this.boardId = boardId; }

    public IssueStatus getStatus() { return status; }
    public void setStatus(IssueStatus status) { this.status = status; }

    public Long getBeforeIssueId() { return beforeIssueId; }
    public void setBeforeIssueId(Long beforeIssueId) { this.beforeIssueId = beforeIssueId; }

    public Long getAfterIssueId() { return afterIssueId; }
    public void setAfterIssueId(Long afterIssueId) { this.afterIssueId = afterIssueId; }
}
