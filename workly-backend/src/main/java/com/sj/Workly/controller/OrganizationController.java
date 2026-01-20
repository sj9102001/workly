package com.sj.Workly.controller;

import com.sj.Workly.dto.organization.*;
import com.sj.Workly.entity.User;
import com.sj.Workly.service.OrganizationService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/orgs")
public class OrganizationController {

    private final OrganizationService orgService;

    public OrganizationController(OrganizationService orgService) {
        this.orgService = orgService;
    }

    @PostMapping
    public OrganizationResponse create(@AuthenticationPrincipal User user,
                                       @Valid @RequestBody CreateOrganizationRequest req) {
        return orgService.create(user, req);
    }

    @GetMapping("/{orgId}")
    public OrganizationResponse get(@AuthenticationPrincipal User user,
                                    @PathVariable Long orgId) {
        return orgService.get(user, orgId);
    }

    @GetMapping
    public List<OrganizationResponse> myOrgs(@AuthenticationPrincipal User user) {
        return orgService.listMyOrgs(user);
    }

    @GetMapping("/{orgId}/members")
    public List<OrgMemberResponse> members(@AuthenticationPrincipal User user,
                                           @PathVariable Long orgId) {
        return orgService.listMembers(user, orgId);
    }

    @PutMapping("/{orgId}")
    public OrganizationResponse update(@AuthenticationPrincipal User user,
                                       @PathVariable Long orgId,
                                       @Valid @RequestBody UpdateOrganizationRequest req) {
        return orgService.update(user, orgId, req);
    }

    @DeleteMapping("/{orgId}")
    public void delete(@AuthenticationPrincipal User user,
                       @PathVariable Long orgId) {
        orgService.delete(user, orgId);
    }
}
