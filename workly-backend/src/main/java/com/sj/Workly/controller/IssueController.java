package com.sj.Workly.controller;

import com.sj.Workly.dto.issue.*;
import com.sj.Workly.entity.User;
import com.sj.Workly.entity.enums.IssueStatus;
import com.sj.Workly.service.IssueService;
import com.sj.Workly.dto.issue.MoveIssueRequest;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/orgs/{orgId}/projects/{projectId}/issues")
public class IssueController {

    private final IssueService issueService;

    public IssueController(IssueService issueService) {
        this.issueService = issueService;
    }

    @PostMapping
    public IssueResponse create(@AuthenticationPrincipal User user,
                                @PathVariable Long orgId,
                                @PathVariable Long projectId,
                                @Valid @RequestBody CreateIssueRequest req) {
        return issueService.create(user, orgId, projectId, req);
    }

    @GetMapping
    public List<IssueResponse> list(@AuthenticationPrincipal User user,
                                    @PathVariable Long orgId,
                                    @PathVariable Long projectId,
                                    @RequestParam(required = false) Long columnId,
                                    @RequestParam(required = false) IssueStatus status) {
        return issueService.list(user, projectId, columnId, status);
    }

    @GetMapping("/{issueId}")
    public IssueResponse get(@AuthenticationPrincipal User user,
                             @PathVariable Long orgId,
                             @PathVariable Long projectId,
                             @PathVariable Long issueId) {
        return issueService.get(user, projectId, issueId);
    }

    @PutMapping("/{issueId}")
    public IssueResponse update(@AuthenticationPrincipal User user,
                                @PathVariable Long orgId,
                                @PathVariable Long projectId,
                                @PathVariable Long issueId,
                                @Valid @RequestBody UpdateIssueRequest req) {
        return issueService.update(user, projectId, issueId, req);
    }

    @PatchMapping("/{issueId}/move")
    public IssueResponse move(@AuthenticationPrincipal User user,
                              @PathVariable Long orgId,
                              @PathVariable Long projectId,
                              @PathVariable Long issueId,
                              @RequestBody MoveIssueRequest req) {
        return issueService.move(user, projectId, issueId, req);
    }
}
