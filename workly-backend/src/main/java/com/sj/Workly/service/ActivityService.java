package com.sj.Workly.service;

import com.sj.Workly.dto.activity.ActivityResponse;
import com.sj.Workly.entity.Activity;
import com.sj.Workly.entity.Issue;
import com.sj.Workly.entity.Project;
import com.sj.Workly.entity.User;
import com.sj.Workly.entity.enums.ActivityType;
import com.sj.Workly.exception.UnauthorizedException;
import com.sj.Workly.repository.ActivityRepository;
import com.sj.Workly.repository.ProjectMemberRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Records and reads the project activity feed. Write helpers ({@link #record})
 * are called from other services (issue/comment) within their own transaction,
 * so a feed entry is persisted atomically with the action it describes.
 */
@Service
public class ActivityService {

    private final ActivityRepository activityRepo;
    private final ProjectMemberRepository projectMemberRepo;

    public ActivityService(ActivityRepository activityRepo,
                           ProjectMemberRepository projectMemberRepo) {
        this.activityRepo = activityRepo;
        this.projectMemberRepo = projectMemberRepo;
    }

    /** Persist a feed entry. Intended to be called inside an existing transaction. */
    public void record(Project project, User actor, ActivityType type, Issue issue, String meta) {
        Activity a = new Activity();
        a.setProject(project);
        a.setActor(actor);
        a.setType(type);
        a.setIssue(issue);
        a.setTargetTitle(issue != null ? issue.getTitle() : null);
        a.setMeta(meta);
        activityRepo.save(a);
    }

    @Transactional(readOnly = true)
    public List<ActivityResponse> list(User actor, Long projectId, int limit) {
        requireProjectMember(actor.getId(), projectId);
        int capped = Math.min(Math.max(limit, 1), 100);
        return activityRepo
                .findByProjectIdOrderByCreatedAtDesc(projectId, PageRequest.of(0, capped))
                .stream().map(this::toResponse).toList();
    }

    private void requireProjectMember(Long userId, Long projectId) {
        if (!projectMemberRepo.existsByProjectIdAndUserId(projectId, userId)) {
            throw new UnauthorizedException("Not a project member");
        }
    }

    private ActivityResponse toResponse(Activity a) {
        ActivityResponse r = new ActivityResponse();
        r.setId(a.getId());
        r.setProjectId(a.getProject().getId());
        r.setType(a.getType());
        r.setActorId(a.getActor().getId());
        r.setActorName(a.getActor().getName());
        r.setIssueId(a.getIssue() == null ? null : a.getIssue().getId());
        r.setTargetTitle(a.getTargetTitle());
        r.setMeta(a.getMeta());
        r.setCreatedAt(a.getCreatedAt());
        return r;
    }
}
