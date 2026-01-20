package com.sj.Workly.service;

import com.sj.Workly.dto.issue.*;
import com.sj.Workly.entity.Board;
import com.sj.Workly.entity.Issue;
import com.sj.Workly.entity.Project;
import com.sj.Workly.entity.User;
import com.sj.Workly.entity.enums.IssueStatus;
import com.sj.Workly.exception.NotFoundException;
import com.sj.Workly.exception.UnauthorizedException;
import com.sj.Workly.repository.BoardRepository;
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
    private final BoardRepository boardRepo;
    private final UserRepository userRepo;

    public IssueService(IssueRepository issueRepo,
                        ProjectRepository projectRepo,
                        ProjectMemberRepository projectMemberRepo,
                        BoardRepository boardRepo,
                        UserRepository userRepo) {
        this.issueRepo = issueRepo;
        this.projectRepo = projectRepo;
        this.projectMemberRepo = projectMemberRepo;
        this.boardRepo = boardRepo;
        this.userRepo = userRepo;
    }

    @Transactional
    public IssueResponse create(User actor, Long orgId, Long projectId, CreateIssueRequest req) {
        requireProjectMember(actor.getId(), projectId);

        Project project = projectRepo.findByIdAndOrgId(projectId, orgId)
                .orElseThrow(() -> new NotFoundException("Project not found"));

        Issue issue = new Issue();
        issue.setProject(project);
        issue.setTitle(req.getTitle().trim());
        issue.setDescription(req.getDescription());
        issue.setPriority(req.getPriority());
        issue.setStatus(req.getStatus());
        issue.setReporter(actor);

        if (req.getBoardId() != null) {
            Board board = boardRepo.findByIdAndProjectId(req.getBoardId(), projectId)
                    .orElseThrow(() -> new NotFoundException("Board not found"));
            issue.setBoard(board);
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

    @Transactional(readOnly = true)
    public List<IssueResponse> list(User actor, Long projectId, Long boardId, IssueStatus status) {
        requireProjectMember(actor.getId(), projectId);

        if (boardId != null) {
            return issueRepo.findByProjectIdAndBoardIdOrderByPositionAsc(projectId, boardId)
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

        if (req.getBoardId() != null) {
            Board board = boardRepo.findByIdAndProjectId(req.getBoardId(), projectId)
                    .orElseThrow(() -> new NotFoundException("Board not found"));
            issue.setBoard(board);
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

        // 1) status
        if (req.getStatus() != null) {
            issue.setStatus(req.getStatus());
        }

        // 2) board (can be null)
        Long targetBoardId = req.getBoardId();
        if (targetBoardId == null) {
            issue.setBoard(null);
        } else {
            Board board = boardRepo.findByIdAndProjectId(targetBoardId, projectId)
                    .orElseThrow(() -> new NotFoundException("Board not found"));
            issue.setBoard(board);
        }

        // 3) ordering (position)
        // Only compute if before/after given (or even if not, we’ll set it to bottom in target board)
        Double newPosition = computeNewPosition(projectId, targetBoardId, req.getBeforeIssueId(), req.getAfterIssueId());
        issue.setPosition(newPosition);

        issue = issueRepo.save(issue);
        return toResponse(issue);
    }

    // Computes a position value so sorting by position ASC gives correct ordering.
    private Double computeNewPosition(Long projectId, Long boardId, Long beforeId, Long afterId) {

        Issue before = null;
        Issue after = null;

        if (beforeId != null) {
            before = issueRepo.findByIdAndProjectId(beforeId, projectId)
                    .orElseThrow(() -> new NotFoundException("beforeIssueId not found"));
            // must be in same target board
            if (!sameBoard(before, boardId)) throw new NotFoundException("beforeIssueId not in target board");
        }

        if (afterId != null) {
            after = issueRepo.findByIdAndProjectId(afterId, projectId)
                    .orElseThrow(() -> new NotFoundException("afterIssueId not found"));
            if (!sameBoard(after, boardId)) throw new NotFoundException("afterIssueId not in target board");
        }

        // Place between before and after
        if (before != null && after != null) {
            double a = before.getPosition();
            double b = after.getPosition();
            // basic safety: if weird order, still average
            return (a + b) / 2.0;
        }

        // Place after "before" (towards bottom)
        if (before != null) {
            return before.getPosition() + 1000.0;
        }

        // Place before "after" (towards top)
        if (after != null) {
            return after.getPosition() - 1000.0;
        }

        // No neighbors given -> put at bottom of target board
        // We'll scan max position in that board (simple MVP method).
        // If boardId == null, treat it as "unboarded list" ordering too.
        Double max = issueRepo.findMaxPosition(projectId, boardId);
        if (max == null) max = 0.0;
        return max + 1000.0;
    }

    private boolean sameBoard(Issue issue, Long boardId) {
        if (boardId == null) return issue.getBoard() == null;
        return issue.getBoard() != null && issue.getBoard().getId().equals(boardId);
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
        r.setBoardId(i.getBoard() == null ? null : i.getBoard().getId());

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
