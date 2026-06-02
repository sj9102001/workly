package com.sj.Workly.service;

import com.sj.Workly.dto.sprint.CreateSprintRequest;
import com.sj.Workly.dto.sprint.SprintResponse;
import com.sj.Workly.dto.sprint.UpdateSprintRequest;
import com.sj.Workly.entity.Issue;
import com.sj.Workly.entity.Project;
import com.sj.Workly.entity.Sprint;
import com.sj.Workly.entity.User;
import com.sj.Workly.entity.enums.IssueStatus;
import com.sj.Workly.entity.enums.SprintStatus;
import com.sj.Workly.exception.NotFoundException;
import com.sj.Workly.exception.UnauthorizedException;
import com.sj.Workly.repository.IssueRepository;
import com.sj.Workly.repository.ProjectMemberRepository;
import com.sj.Workly.repository.ProjectRepository;
import com.sj.Workly.repository.SprintRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class SprintService {

    private final SprintRepository sprintRepo;
    private final IssueRepository issueRepo;
    private final ProjectRepository projectRepo;
    private final ProjectMemberRepository projectMemberRepo;

    public SprintService(SprintRepository sprintRepo,
                         IssueRepository issueRepo,
                         ProjectRepository projectRepo,
                         ProjectMemberRepository projectMemberRepo) {
        this.sprintRepo = sprintRepo;
        this.issueRepo = issueRepo;
        this.projectRepo = projectRepo;
        this.projectMemberRepo = projectMemberRepo;
    }

    @Transactional
    public SprintResponse create(User actor, Long orgId, Long projectId, CreateSprintRequest req) {
        requireProjectMember(actor.getId(), projectId);

        Project project = projectRepo.findByIdAndOrgId(projectId, orgId)
                .orElseThrow(() -> new NotFoundException("Project not found"));

        Sprint sprint = new Sprint();
        sprint.setProject(project);
        sprint.setName(req.getName().trim());
        sprint.setGoal(req.getGoal());
        sprint.setStartDate(req.getStartDate());
        sprint.setEndDate(req.getEndDate());
        sprint.setStatus(SprintStatus.PLANNED);

        sprint = sprintRepo.save(sprint);
        return toResponse(sprint);
    }

    @Transactional(readOnly = true)
    public List<SprintResponse> list(User actor, Long projectId) {
        requireProjectMember(actor.getId(), projectId);
        return sprintRepo.findByProjectIdOrderByCreatedAtDesc(projectId)
                .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public SprintResponse get(User actor, Long projectId, Long sprintId) {
        requireProjectMember(actor.getId(), projectId);
        Sprint sprint = sprintRepo.findByIdAndProjectId(sprintId, projectId)
                .orElseThrow(() -> new NotFoundException("Sprint not found"));
        return toResponse(sprint);
    }

    /** The currently active sprint for a project, or null if none is active. */
    @Transactional(readOnly = true)
    public SprintResponse getActive(User actor, Long projectId) {
        requireProjectMember(actor.getId(), projectId);
        return sprintRepo.findFirstByProjectIdAndStatus(projectId, SprintStatus.ACTIVE)
                .map(this::toResponse).orElse(null);
    }

    @Transactional
    public SprintResponse update(User actor, Long projectId, Long sprintId, UpdateSprintRequest req) {
        requireProjectMember(actor.getId(), projectId);

        Sprint sprint = sprintRepo.findByIdAndProjectId(sprintId, projectId)
                .orElseThrow(() -> new NotFoundException("Sprint not found"));

        if (req.getName() != null && !req.getName().trim().isEmpty()) {
            sprint.setName(req.getName().trim());
        }
        if (req.getGoal() != null) {
            sprint.setGoal(req.getGoal());
        }
        if (req.getStartDate() != null) {
            sprint.setStartDate(req.getStartDate());
        }
        if (req.getEndDate() != null) {
            sprint.setEndDate(req.getEndDate());
        }
        if (req.getStatus() != null) {
            // Only one ACTIVE sprint per project: demote any other active one.
            if (req.getStatus() == SprintStatus.ACTIVE) {
                Long currentId = sprint.getId();
                sprintRepo.findByProjectIdAndStatus(projectId, SprintStatus.ACTIVE).stream()
                        .filter(s -> !s.getId().equals(currentId))
                        .forEach(s -> { s.setStatus(SprintStatus.COMPLETED); sprintRepo.save(s); });
            }
            sprint.setStatus(req.getStatus());
        }

        sprint = sprintRepo.save(sprint);
        return toResponse(sprint);
    }

    @Transactional
    public void delete(User actor, Long projectId, Long sprintId) {
        requireProjectMember(actor.getId(), projectId);

        Sprint sprint = sprintRepo.findByIdAndProjectId(sprintId, projectId)
                .orElseThrow(() -> new NotFoundException("Sprint not found"));

        // Detach issues from this sprint before deleting it.
        List<Issue> issues = issueRepo.findBySprintId(sprintId);
        for (Issue i : issues) {
            i.setSprint(null);
            issueRepo.save(i);
        }
        sprintRepo.delete(sprint);
    }

    private void requireProjectMember(Long userId, Long projectId) {
        if (!projectMemberRepo.existsByProjectIdAndUserId(projectId, userId)) {
            throw new UnauthorizedException("Not a project member");
        }
    }

    private SprintResponse toResponse(Sprint s) {
        SprintResponse r = new SprintResponse();
        r.setId(s.getId());
        r.setProjectId(s.getProject().getId());
        r.setName(s.getName());
        r.setGoal(s.getGoal());
        r.setStatus(s.getStatus());
        r.setStartDate(s.getStartDate());
        r.setEndDate(s.getEndDate());

        List<Issue> issues = issueRepo.findBySprintId(s.getId());
        int total = 0, done = 0;
        for (Issue i : issues) {
            int pts = i.getStoryPoints() == null ? 0 : i.getStoryPoints();
            total += pts;
            if (i.getStatus() == IssueStatus.DONE) {
                done += pts;
            }
        }
        r.setIssueCount(issues.size());
        r.setPointsTotal(total);
        r.setPointsDone(done);

        r.setCreatedAt(s.getCreatedAt());
        r.setUpdatedAt(s.getUpdatedAt());
        return r;
    }
}
