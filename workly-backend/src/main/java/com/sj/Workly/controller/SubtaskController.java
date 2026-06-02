package com.sj.Workly.controller;

import com.sj.Workly.dto.subtask.CreateSubtaskRequest;
import com.sj.Workly.dto.subtask.SubtaskResponse;
import com.sj.Workly.dto.subtask.UpdateSubtaskRequest;
import com.sj.Workly.entity.User;
import com.sj.Workly.service.SubtaskService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/orgs/{orgId}/projects/{projectId}/issues/{issueId}/subtasks")
public class SubtaskController {

    private final SubtaskService subtaskService;

    public SubtaskController(SubtaskService subtaskService) {
        this.subtaskService = subtaskService;
    }

    @GetMapping
    public List<SubtaskResponse> list(@AuthenticationPrincipal User user,
                                      @PathVariable Long orgId,
                                      @PathVariable Long projectId,
                                      @PathVariable Long issueId) {
        return subtaskService.listByIssue(user, projectId, issueId);
    }

    @PostMapping
    public SubtaskResponse add(@AuthenticationPrincipal User user,
                               @PathVariable Long orgId,
                               @PathVariable Long projectId,
                               @PathVariable Long issueId,
                               @Valid @RequestBody CreateSubtaskRequest req) {
        return subtaskService.add(user, projectId, issueId, req);
    }

    @PutMapping("/{subtaskId}")
    public SubtaskResponse update(@AuthenticationPrincipal User user,
                                  @PathVariable Long orgId,
                                  @PathVariable Long projectId,
                                  @PathVariable Long issueId,
                                  @PathVariable Long subtaskId,
                                  @Valid @RequestBody UpdateSubtaskRequest req) {
        return subtaskService.update(user, projectId, issueId, subtaskId, req);
    }

    @DeleteMapping("/{subtaskId}")
    public void delete(@AuthenticationPrincipal User user,
                       @PathVariable Long orgId,
                       @PathVariable Long projectId,
                       @PathVariable Long issueId,
                       @PathVariable Long subtaskId) {
        subtaskService.delete(user, projectId, issueId, subtaskId);
    }
}
