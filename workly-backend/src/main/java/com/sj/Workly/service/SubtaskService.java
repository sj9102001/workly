package com.sj.Workly.service;

import com.sj.Workly.dto.subtask.CreateSubtaskRequest;
import com.sj.Workly.dto.subtask.SubtaskResponse;
import com.sj.Workly.dto.subtask.UpdateSubtaskRequest;
import com.sj.Workly.entity.Issue;
import com.sj.Workly.entity.Subtask;
import com.sj.Workly.entity.User;
import com.sj.Workly.exception.NotFoundException;
import com.sj.Workly.exception.UnauthorizedException;
import com.sj.Workly.repository.IssueRepository;
import com.sj.Workly.repository.ProjectMemberRepository;
import com.sj.Workly.repository.SubtaskRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class SubtaskService {

    private final SubtaskRepository subtaskRepo;
    private final IssueRepository issueRepo;
    private final ProjectMemberRepository projectMemberRepo;

    public SubtaskService(SubtaskRepository subtaskRepo,
                          IssueRepository issueRepo,
                          ProjectMemberRepository projectMemberRepo) {
        this.subtaskRepo = subtaskRepo;
        this.issueRepo = issueRepo;
        this.projectMemberRepo = projectMemberRepo;
    }

    @Transactional(readOnly = true)
    public List<SubtaskResponse> listByIssue(User actor, Long projectId, Long issueId) {
        requireProjectMember(actor.getId(), projectId);
        Issue issue = requireIssue(projectId, issueId);
        return subtaskRepo.findByIssueIdOrderByOrderIndexAsc(issue.getId())
                .stream().map(this::toResponse).toList();
    }

    @Transactional
    public SubtaskResponse add(User actor, Long projectId, Long issueId, CreateSubtaskRequest req) {
        requireProjectMember(actor.getId(), projectId);
        Issue issue = requireIssue(projectId, issueId);

        Integer maxOrder = subtaskRepo.findMaxOrderIndex(issue.getId());
        if (maxOrder == null) maxOrder = 0;

        Subtask subtask = new Subtask();
        subtask.setIssue(issue);
        subtask.setTitle(req.getTitle().trim());
        subtask.setDone(false);
        subtask.setOrderIndex(maxOrder + 1);

        subtask = subtaskRepo.save(subtask);
        return toResponse(subtask);
    }

    @Transactional
    public SubtaskResponse update(User actor, Long projectId, Long issueId, Long subtaskId, UpdateSubtaskRequest req) {
        requireProjectMember(actor.getId(), projectId);
        Issue issue = requireIssue(projectId, issueId);

        Subtask subtask = subtaskRepo.findByIdAndIssueId(subtaskId, issue.getId())
                .orElseThrow(() -> new NotFoundException("Subtask not found"));

        if (req.getTitle() != null && !req.getTitle().trim().isEmpty()) {
            subtask.setTitle(req.getTitle().trim());
        }
        if (req.getDone() != null) {
            subtask.setDone(req.getDone());
        }

        subtask = subtaskRepo.save(subtask);
        return toResponse(subtask);
    }

    @Transactional
    public void delete(User actor, Long projectId, Long issueId, Long subtaskId) {
        requireProjectMember(actor.getId(), projectId);
        Issue issue = requireIssue(projectId, issueId);

        Subtask subtask = subtaskRepo.findByIdAndIssueId(subtaskId, issue.getId())
                .orElseThrow(() -> new NotFoundException("Subtask not found"));

        subtaskRepo.delete(subtask);
    }

    private Issue requireIssue(Long projectId, Long issueId) {
        return issueRepo.findByIdAndProjectId(issueId, projectId)
                .orElseThrow(() -> new NotFoundException("Issue not found"));
    }

    private void requireProjectMember(Long userId, Long projectId) {
        if (!projectMemberRepo.existsByProjectIdAndUserId(projectId, userId)) {
            throw new UnauthorizedException("Not a project member");
        }
    }

    private SubtaskResponse toResponse(Subtask s) {
        SubtaskResponse r = new SubtaskResponse();
        r.setId(s.getId());
        r.setIssueId(s.getIssue().getId());
        r.setTitle(s.getTitle());
        r.setDone(s.isDone());
        r.setOrderIndex(s.getOrderIndex());
        r.setCreatedAt(s.getCreatedAt());
        r.setUpdatedAt(s.getUpdatedAt());
        return r;
    }
}
