package com.sj.Workly.controller;

import com.sj.Workly.dto.sprint.CreateSprintRequest;
import com.sj.Workly.dto.sprint.SprintResponse;
import com.sj.Workly.dto.sprint.UpdateSprintRequest;
import com.sj.Workly.entity.User;
import com.sj.Workly.service.SprintService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/orgs/{orgId}/projects/{projectId}/sprints")
public class SprintController {

    private final SprintService sprintService;

    public SprintController(SprintService sprintService) {
        this.sprintService = sprintService;
    }

    @GetMapping
    public List<SprintResponse> list(@AuthenticationPrincipal User user,
                                     @PathVariable Long orgId,
                                     @PathVariable Long projectId) {
        return sprintService.list(user, projectId);
    }

    @GetMapping("/active")
    public SprintResponse active(@AuthenticationPrincipal User user,
                                 @PathVariable Long orgId,
                                 @PathVariable Long projectId) {
        return sprintService.getActive(user, projectId);
    }

    @GetMapping("/{sprintId}")
    public SprintResponse get(@AuthenticationPrincipal User user,
                              @PathVariable Long orgId,
                              @PathVariable Long projectId,
                              @PathVariable Long sprintId) {
        return sprintService.get(user, projectId, sprintId);
    }

    @PostMapping
    public SprintResponse create(@AuthenticationPrincipal User user,
                                 @PathVariable Long orgId,
                                 @PathVariable Long projectId,
                                 @Valid @RequestBody CreateSprintRequest req) {
        return sprintService.create(user, orgId, projectId, req);
    }

    @PutMapping("/{sprintId}")
    public SprintResponse update(@AuthenticationPrincipal User user,
                                 @PathVariable Long orgId,
                                 @PathVariable Long projectId,
                                 @PathVariable Long sprintId,
                                 @Valid @RequestBody UpdateSprintRequest req) {
        return sprintService.update(user, projectId, sprintId, req);
    }

    @DeleteMapping("/{sprintId}")
    public void delete(@AuthenticationPrincipal User user,
                       @PathVariable Long orgId,
                       @PathVariable Long projectId,
                       @PathVariable Long sprintId) {
        sprintService.delete(user, projectId, sprintId);
    }
}
