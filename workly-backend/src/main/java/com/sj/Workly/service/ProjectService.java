package com.sj.Workly.service;

import com.sj.Workly.dto.project.*;
import com.sj.Workly.entity.*;
import com.sj.Workly.entity.enums.Role;
import com.sj.Workly.exception.ConflictException;
import com.sj.Workly.exception.NotFoundException;
import com.sj.Workly.exception.UnauthorizedException;
import com.sj.Workly.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;

@Service
public class ProjectService {

    private final OrganizationRepository orgRepo;
    private final OrgMemberRepository orgMemberRepo;
    private final UserRepository userRepo;
    private final ProjectRepository projectRepo;
    private final ProjectMemberRepository projectMemberRepo;

    public ProjectService(
            OrganizationRepository orgRepo,
            OrgMemberRepository orgMemberRepo,
            UserRepository userRepo,
            ProjectRepository projectRepo,
            ProjectMemberRepository projectMemberRepo
    ) {
        this.orgRepo = orgRepo;
        this.orgMemberRepo = orgMemberRepo;
        this.userRepo = userRepo;
        this.projectRepo = projectRepo;
        this.projectMemberRepo = projectMemberRepo;
    }

    @Transactional
    public ProjectResponse create(User actor, Long orgId, CreateProjectRequest req) {
        requireOrgAdminOrOwner(actor.getId(), orgId);

        Organization org = orgRepo.findById(orgId)
                .orElseThrow(() -> new NotFoundException("Organization not found"));

        Project project = new Project();
        project.setOrg(org);
        project.setName(req.getName().trim());
        project.setSlug(generateUniqueProjectSlug(orgId, req.getName().trim()));
        project.setCreatedBy(actor);
        project = projectRepo.save(project);


        // add creator as project ADMIN
        ProjectMember pm = new ProjectMember();
        pm.setProject(project);
        pm.setUser(actor);
        pm.setRole(ProjectMember.Role.ADMIN);
        projectMemberRepo.save(pm);

        return toProjectResponse(project);
    }

    @Transactional(readOnly = true)
    public List<ProjectResponse> listMyProjects(User actor, Long orgId) {
        // any org member can list only projects they are in
        requireOrgMember(actor.getId(), orgId);

        return projectMemberRepo.findByUserId(actor.getId()).stream()
                .map(ProjectMember::getProject)
                .filter(p -> p.getOrg().getId().equals(orgId))
                .map(this::toProjectResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ProjectResponse get(User actor, Long orgId, Long projectId) {
        requireOrgMember(actor.getId(), orgId);

        if (!projectMemberRepo.existsByProjectIdAndUserId(projectId, actor.getId())) {
            throw new UnauthorizedException("Not a member of this project");
        }

        Project project = projectRepo.findByIdAndOrgId(projectId, orgId)
                .orElseThrow(() -> new NotFoundException("Project not found"));

        return toProjectResponse(project);
    }

    @Transactional
    public ProjectResponse update(User actor, Long orgId, Long projectId, UpdateProjectRequest req) {
        requireOrgAdminOrOwner(actor.getId(), orgId);

        Project project = projectRepo.findByIdAndOrgId(projectId, orgId)
                .orElseThrow(() -> new NotFoundException("Project not found"));

        if (req.getName() != null && !req.getName().trim().isEmpty()) {
            project.setName(req.getName().trim());
        }

        project = projectRepo.save(project);
        return toProjectResponse(project);
    }

    @Transactional
    public void delete(User actor, Long orgId, Long projectId) {
        requireOrgAdminOrOwner(actor.getId(), orgId);

        Project project = projectRepo.findByIdAndOrgId(projectId, orgId)
                .orElseThrow(() -> new NotFoundException("Project not found"));

        projectMemberRepo.deleteAll(projectMemberRepo.findByProjectId(projectId));
        projectRepo.delete(project);
    }

    // ---- Project member management ----

    @Transactional
    public void addMember(User actor, Long orgId, Long projectId, AddProjectMemberRequest req) {
        requireOrgAdminOrOwner(actor.getId(), orgId);

        Project project = projectRepo.findByIdAndOrgId(projectId, orgId)
                .orElseThrow(() -> new NotFoundException("Project not found"));

        Long newUserId = req.getUserId();

        // ensure user exists
        User target = userRepo.findById(newUserId)
                .orElseThrow(() -> new NotFoundException("User not found"));

        // ensure target is org member
        orgMemberRepo.findByOrgIdAndUserId(orgId, newUserId)
                .orElseThrow(() -> new ConflictException("User is not a member of the organization"));

        // avoid duplicates
        if (projectMemberRepo.existsByProjectIdAndUserId(projectId, newUserId)) {
            throw new ConflictException("User is already in the project");
        }

        ProjectMember pm = new ProjectMember();
        pm.setProject(project);
        pm.setUser(target);
        pm.setRole(req.getRole() == null ? ProjectMember.Role.MEMBER : req.getRole());
        projectMemberRepo.save(pm);
    }

    @Transactional
    public void removeMember(User actor, Long orgId, Long projectId, Long userIdToRemove) {
        requireOrgAdminOrOwner(actor.getId(), orgId);

        Project project = projectRepo.findByIdAndOrgId(projectId, orgId)
                .orElseThrow(() -> new NotFoundException("Project not found"));

        ProjectMember pm = projectMemberRepo.findByProjectIdAndUserId(projectId, userIdToRemove)
                .orElseThrow(() -> new NotFoundException("User is not a member of this project"));

        // optional safety: don't remove last project admin
        if (pm.getRole() == ProjectMember.Role.ADMIN) {
            long admins = projectMemberRepo.countByProjectIdAndRole(projectId, ProjectMember.Role.ADMIN);
            if (admins <= 1) {
                throw new ConflictException("Cannot remove the last project admin");
            }
        }

        projectMemberRepo.delete(pm);
    }

    @Transactional(readOnly = true)
    public List<ProjectMemberResponse> listProjectMembers(User actor, Long orgId, Long projectId) {
        requireOrgMember(actor.getId(), orgId);

        if (!projectMemberRepo.existsByProjectIdAndUserId(projectId, actor.getId())) {
            throw new UnauthorizedException("Not a member of this project");
        }

        return projectMemberRepo.findByProjectId(projectId).stream()
                .map(pm -> {
                    ProjectMemberResponse r = new ProjectMemberResponse();
                    r.setId(pm.getId());
                    r.setUserId(pm.getUser().getId());
                    r.setUserName(pm.getUser().getName());
                    r.setUserEmail(pm.getUser().getEmail());
                    r.setRole(pm.getRole());
                    r.setCreatedAt(pm.getCreatedAt());
                    return r;
                }).toList();
    }

    // ---- helpers ----

    private void requireOrgMember(Long userId, Long orgId) {
        orgMemberRepo.findByOrgIdAndUserId(orgId, userId)
                .orElseThrow(() -> new UnauthorizedException("Not a member of this organization"));
    }

    private void requireOrgAdminOrOwner(Long userId, Long orgId) {
        OrgMember m = orgMemberRepo.findByOrgIdAndUserId(orgId, userId)
                .orElseThrow(() -> new UnauthorizedException("Not a member of this organization"));

        if (m.getRole() != Role.OWNER && m.getRole() != Role.ADMIN) {
            throw new UnauthorizedException("Only ADMIN/OWNER can perform this action");
        }
    }

    private ProjectResponse toProjectResponse(Project p) {
        ProjectResponse r = new ProjectResponse();
        r.setId(p.getId());
        r.setOrgId(p.getOrg().getId());
        r.setName(p.getName());
        r.setSlug(p.getSlug());
        r.setCreatedAt(p.getCreatedAt());
        r.setUpdatedAt(p.getUpdatedAt());
        return r;
    }

    private String generateUniqueProjectSlug(Long orgId, String name) {
        String base = slugify(name);
        String slug = base;
        int i = 2;
        while (projectRepo.existsByOrgIdAndSlug(orgId, slug)) {
            slug = base + "-" + i;
            i++;
        }
        return slug;
    }

    private String slugify(String input) {
        String s = Normalizer.normalize(input, Normalizer.Form.NFKD);
        s = s.replaceAll("[^\\p{Alnum}]+", "-");
        s = s.replaceAll("(^-+|-+$)", "");
        s = s.toLowerCase(Locale.ROOT);
        return s.isBlank() ? "project" : s;
    }
}
