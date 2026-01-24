package com.sj.Workly.service;

import com.sj.Workly.dto.issue.*;
import com.sj.Workly.entity.BoardColumn;
import com.sj.Workly.entity.Issue;
import com.sj.Workly.entity.Project;
import com.sj.Workly.entity.User;
import com.sj.Workly.entity.enums.IssueStatus;
import com.sj.Workly.exception.NotFoundException;
import com.sj.Workly.exception.UnauthorizedException;
import com.sj.Workly.repository.ColumnRepository;
import com.sj.Workly.repository.IssueRepository;
import com.sj.Workly.repository.ProjectMemberRepository;
import com.sj.Workly.repository.ProjectRepository;
import com.sj.Workly.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class IssueService {

    private final IssueRepository issueRepo;
    private final ProjectRepository projectRepo;
    private final ProjectMemberRepository projectMemberRepo;
    private final ColumnRepository columnRepo;
    private final UserRepository userRepo;

    public IssueService(IssueRepository issueRepo,
                        ProjectRepository projectRepo,
                        ProjectMemberRepository projectMemberRepo,
                        ColumnRepository columnRepo,
                        UserRepository userRepo) {
        this.issueRepo = issueRepo;
        this.projectRepo = projectRepo;
        this.projectMemberRepo = projectMemberRepo;
        this.columnRepo = columnRepo;
        this.userRepo = userRepo;
    }

    @Transactional
    public IssueResponse create(User actor, Long orgId, Long projectId, CreateIssueRequest req) {
        requireProjectMember(actor.getId(), projectId);

        Project project = projectRepo.findByIdAndOrgId(projectId, orgId)
                .orElseThrow(() -> new NotFoundException("Project not found"));

        // Get column and verify it belongs to this project's board
        BoardColumn column = columnRepo.findById(req.getColumnId())
                .orElseThrow(() -> new NotFoundException("Column not found"));
        
        if (!column.getBoard().getProject().getId().equals(projectId)) {
            throw new NotFoundException("Column does not belong to this project");
        }

        // Get max orderIndex in the column and add 1
        Integer maxOrder = issueRepo.findMaxOrderIndex(column.getId());
        if (maxOrder == null) maxOrder = 0;

        Issue issue = new Issue();
        issue.setProject(project);
        issue.setColumn(column);
        issue.setTitle(req.getTitle().trim());
        issue.setDescription(req.getDescription());
        issue.setPriority(req.getPriority());
        issue.setStatus(req.getStatus());
        issue.setReporter(actor);
        issue.setOrderIndex(maxOrder + 1);

        if (req.getAssigneeId() != null) {
            requireProjectMember(req.getAssigneeId(), projectId);

            User assignee = userRepo.findById(req.getAssigneeId())
                    .orElseThrow(() -> new NotFoundException("Assignee not found"));
            issue.setAssignee(assignee);
        }

        issue = issueRepo.save(issue);
        return toResponse(issue);
    }

    @Transactional(readOnly = true)
    public List<IssueResponse> list(User actor, Long projectId, Long columnId, IssueStatus status) {
        requireProjectMember(actor.getId(), projectId);

        if (columnId != null) {
            // Verify column belongs to this project
            BoardColumn column = columnRepo.findById(columnId)
                    .orElseThrow(() -> new NotFoundException("Column not found"));
            if (!column.getBoard().getProject().getId().equals(projectId)) {
                throw new NotFoundException("Column does not belong to this project");
            }
            return issueRepo.findByColumnIdOrderByOrderIndexAsc(columnId)
                    .stream().map(this::toResponse).toList();
        }

        if (status != null) {
            return issueRepo.findByProjectIdAndStatusOrderByCreatedAtDesc(projectId, status)
                    .stream().map(this::toResponse).toList();
        }

        return issueRepo.findByProjectIdOrderByCreatedAtDesc(projectId)
                .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public IssueResponse get(User actor, Long projectId, Long issueId) {
        requireProjectMember(actor.getId(), projectId);

        Issue issue = issueRepo.findByIdAndProjectId(issueId, projectId)
                .orElseThrow(() -> new NotFoundException("Issue not found"));

        return toResponse(issue);
    }

    @Transactional
    public IssueResponse update(User actor, Long projectId, Long issueId, UpdateIssueRequest req) {
        requireProjectMember(actor.getId(), projectId);

        Issue issue = issueRepo.findByIdAndProjectId(issueId, projectId)
                .orElseThrow(() -> new NotFoundException("Issue not found"));

        if (req.getTitle() != null && !req.getTitle().trim().isEmpty()) {
            issue.setTitle(req.getTitle().trim());
        }

        if (req.getDescription() != null) {
            issue.setDescription(req.getDescription());
        }

        if (req.getPriority() != null) {
            issue.setPriority(req.getPriority());
        }

        if (req.getStatus() != null) {
            issue.setStatus(req.getStatus());
        }

        if (req.getColumnId() != null) {
            BoardColumn column = columnRepo.findById(req.getColumnId())
                    .orElseThrow(() -> new NotFoundException("Column not found"));
            if (!column.getBoard().getProject().getId().equals(projectId)) {
                throw new NotFoundException("Column does not belong to this project");
            }
            issue.setColumn(column);
        }

        if (req.getAssigneeId() != null) {
            requireProjectMember(req.getAssigneeId(), projectId);

            User assignee = userRepo.findById(req.getAssigneeId())
                    .orElseThrow(() -> new NotFoundException("Assignee not found"));
            issue.setAssignee(assignee);
        }

        issue = issueRepo.save(issue);
        return toResponse(issue);
    }

    @Transactional
    public IssueResponse move(User actor, Long projectId, Long issueId, MoveIssueRequest req) {
        requireProjectMember(actor.getId(), projectId);

        Issue issue = issueRepo.findByIdAndProjectId(issueId, projectId)
                .orElseThrow(() -> new NotFoundException("Issue not found"));

        // Get target column and verify it belongs to this project
        BoardColumn targetColumn = columnRepo.findById(req.getColumnId())
                .orElseThrow(() -> new NotFoundException("Column not found"));
        if (!targetColumn.getBoard().getProject().getId().equals(projectId)) {
            throw new NotFoundException("Column does not belong to this project");
        }

        // 1) status
        if (req.getStatus() != null) {
            issue.setStatus(req.getStatus());
        }

        // 2) column
        issue.setColumn(targetColumn);

        // 3) ordering (orderIndex)
        Integer newOrderIndex = computeNewOrderIndex(req.getColumnId(), req.getBeforeIssueId(), req.getAfterIssueId());
        issue.setOrderIndex(newOrderIndex);

        issue = issueRepo.save(issue);
        return toResponse(issue);
    }

    // Computes an orderIndex value so sorting by orderIndex ASC gives correct ordering.
    private Integer computeNewOrderIndex(Long columnId, Long beforeId, Long afterId) {

        Issue before = null;
        Issue after = null;

        if (beforeId != null) {
            before = issueRepo.findById(beforeId)
                    .orElseThrow(() -> new NotFoundException("beforeIssueId not found"));
            // must be in same target column
            if (!before.getColumn().getId().equals(columnId)) {
                throw new NotFoundException("beforeIssueId not in target column");
            }
        }

        if (afterId != null) {
            after = issueRepo.findById(afterId)
                    .orElseThrow(() -> new NotFoundException("afterIssueId not found"));
            if (!after.getColumn().getId().equals(columnId)) {
                throw new NotFoundException("afterIssueId not in target column");
            }
        }

        // Place between before and after
        if (before != null && after != null) {
            int a = before.getOrderIndex();
            int b = after.getOrderIndex();
            // If they're consecutive, we need to reorder all issues in between
            // For simplicity, use average (may need adjustment later)
            return (a + b) / 2;
        }

        // Place after "before" (towards bottom)
        if (before != null) {
            return before.getOrderIndex() + 1;
        }

        // Place before "after" (towards top)
        if (after != null) {
            return Math.max(0, after.getOrderIndex() - 1);
        }

        // No neighbors given -> put at bottom of target column
        Integer max = issueRepo.findMaxOrderIndex(columnId);
        if (max == null) max = 0;
        return max + 1;
    }

    private void requireProjectMember(Long userId, Long projectId) {
        if (!projectMemberRepo.existsByProjectIdAndUserId(projectId, userId)) {
            throw new UnauthorizedException("Not a project member");
        }
    }

    private IssueResponse toResponse(Issue i) {
        IssueResponse r = new IssueResponse();
        r.setId(i.getId());
        r.setProjectId(i.getProject().getId());
        r.setColumnId(i.getColumn().getId());

        r.setTitle(i.getTitle());
        r.setDescription(i.getDescription());
        r.setPriority(i.getPriority());
        r.setStatus(i.getStatus());

        r.setReporterId(i.getReporter().getId());
        r.setAssigneeId(i.getAssignee() == null ? null : i.getAssignee().getId());

        r.setCreatedAt(i.getCreatedAt());
        r.setUpdatedAt(i.getUpdatedAt());
        return r;
    }
}
