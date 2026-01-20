package com.sj.Workly.controller;

import com.sj.Workly.dto.project.*;
import com.sj.Workly.entity.User;
import com.sj.Workly.service.ProjectService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/orgs/{orgId}/projects")
public class ProjectController {

    private final ProjectService projectService;

    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    @PostMapping
    public ProjectResponse create(@AuthenticationPrincipal User user,
                                  @PathVariable Long orgId,
                                  @Valid @RequestBody CreateProjectRequest req) {
        return projectService.create(user, orgId, req);
    }

    @GetMapping
    public List<ProjectResponse> listMy(@AuthenticationPrincipal User user,
                                        @PathVariable Long orgId) {
        return projectService.listMyProjects(user, orgId);
    }

    @GetMapping("/{projectId}")
    public ProjectResponse get(@AuthenticationPrincipal User user,
                               @PathVariable Long orgId,
                               @PathVariable Long projectId) {
        return projectService.get(user, orgId, projectId);
    }

    @PutMapping("/{projectId}")
    public ProjectResponse update(@AuthenticationPrincipal User user,
                                  @PathVariable Long orgId,
                                  @PathVariable Long projectId,
                                  @Valid @RequestBody UpdateProjectRequest req) {
        return projectService.update(user, orgId, projectId, req);
    }

    @DeleteMapping("/{projectId}")
    public void delete(@AuthenticationPrincipal User user,
                       @PathVariable Long orgId,
                       @PathVariable Long projectId) {
        projectService.delete(user, orgId, projectId);
    }

    // ---- members ----

    @GetMapping("/{projectId}/members")
    public List<ProjectMemberResponse> listMembers(@AuthenticationPrincipal User user,
                                                   @PathVariable Long orgId,
                                                   @PathVariable Long projectId) {
        return projectService.listProjectMembers(user, orgId, projectId);
    }

    @PostMapping("/{projectId}/members")
    public void addMember(@AuthenticationPrincipal User user,
                          @PathVariable Long orgId,
                          @PathVariable Long projectId,
                          @Valid @RequestBody AddProjectMemberRequest req) {
        projectService.addMember(user, orgId, projectId, req);
    }

    @DeleteMapping("/{projectId}/members/{userId}")
    public void removeMember(@AuthenticationPrincipal User user,
                             @PathVariable Long orgId,
                             @PathVariable Long projectId,
                             @PathVariable Long userId) {
        projectService.removeMember(user, orgId, projectId, userId);
    }
}
