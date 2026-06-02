package com.sj.Workly.service;

import com.sj.Workly.dto.label.CreateLabelRequest;
import com.sj.Workly.dto.label.LabelResponse;
import com.sj.Workly.dto.label.UpdateLabelRequest;
import com.sj.Workly.entity.Label;
import com.sj.Workly.entity.Project;
import com.sj.Workly.entity.User;
import com.sj.Workly.exception.ConflictException;
import com.sj.Workly.exception.NotFoundException;
import com.sj.Workly.exception.UnauthorizedException;
import com.sj.Workly.repository.LabelRepository;
import com.sj.Workly.repository.ProjectMemberRepository;
import com.sj.Workly.repository.ProjectRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class LabelService {

    private final LabelRepository labelRepo;
    private final ProjectRepository projectRepo;
    private final ProjectMemberRepository projectMemberRepo;

    public LabelService(LabelRepository labelRepo,
                        ProjectRepository projectRepo,
                        ProjectMemberRepository projectMemberRepo) {
        this.labelRepo = labelRepo;
        this.projectRepo = projectRepo;
        this.projectMemberRepo = projectMemberRepo;
    }

    @Transactional
    public LabelResponse create(User actor, Long orgId, Long projectId, CreateLabelRequest req) {
        requireProjectMember(actor.getId(), projectId);

        Project project = projectRepo.findByIdAndOrgId(projectId, orgId)
                .orElseThrow(() -> new NotFoundException("Project not found"));

        String name = req.getName().trim();
        if (labelRepo.existsByProjectIdAndNameIgnoreCase(projectId, name)) {
            throw new ConflictException("A label with this name already exists");
        }

        Label label = new Label();
        label.setProject(project);
        label.setName(name);
        label.setColor(req.getColor());

        label = labelRepo.save(label);
        return toResponse(label);
    }

    @Transactional(readOnly = true)
    public List<LabelResponse> list(User actor, Long projectId) {
        requireProjectMember(actor.getId(), projectId);
        return labelRepo.findByProjectIdOrderByNameAsc(projectId)
                .stream().map(this::toResponse).toList();
    }

    @Transactional
    public LabelResponse update(User actor, Long projectId, Long labelId, UpdateLabelRequest req) {
        requireProjectMember(actor.getId(), projectId);

        Label label = labelRepo.findByIdAndProjectId(labelId, projectId)
                .orElseThrow(() -> new NotFoundException("Label not found"));

        if (req.getName() != null && !req.getName().trim().isEmpty()) {
            String name = req.getName().trim();
            if (!name.equalsIgnoreCase(label.getName())
                    && labelRepo.existsByProjectIdAndNameIgnoreCase(projectId, name)) {
                throw new ConflictException("A label with this name already exists");
            }
            label.setName(name);
        }
        if (req.getColor() != null) {
            label.setColor(req.getColor());
        }

        label = labelRepo.save(label);
        return toResponse(label);
    }

    @Transactional
    public void delete(User actor, Long projectId, Long labelId) {
        requireProjectMember(actor.getId(), projectId);

        Label label = labelRepo.findByIdAndProjectId(labelId, projectId)
                .orElseThrow(() -> new NotFoundException("Label not found"));

        labelRepo.delete(label);
    }

    private void requireProjectMember(Long userId, Long projectId) {
        if (!projectMemberRepo.existsByProjectIdAndUserId(projectId, userId)) {
            throw new UnauthorizedException("Not a project member");
        }
    }

    private LabelResponse toResponse(Label l) {
        LabelResponse r = new LabelResponse();
        r.setId(l.getId());
        r.setProjectId(l.getProject().getId());
        r.setName(l.getName());
        r.setColor(l.getColor());
        r.setCreatedAt(l.getCreatedAt());
        return r;
    }
}
