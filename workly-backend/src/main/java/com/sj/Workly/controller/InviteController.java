package com.sj.Workly.controller;

import com.sj.Workly.dto.invite.CreateInviteRequest;
import com.sj.Workly.dto.invite.InviteResponse;
import com.sj.Workly.dto.invite.MyInviteResponse;
import com.sj.Workly.entity.User;
import com.sj.Workly.service.InviteService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class InviteController {

    private final InviteService inviteService;

    public InviteController(InviteService inviteService) {
        this.inviteService = inviteService;
    }

    // Create invite (ADMIN/OWNER)
    @PostMapping("/orgs/{orgId}/invites")
    public InviteResponse createInvite(@AuthenticationPrincipal User user,
                                       @PathVariable Long orgId,
                                       @Valid @RequestBody CreateInviteRequest req) {
        return inviteService.createInvite(user, orgId, req);
    }

    // List invites (ADMIN/OWNER)
    @GetMapping("/orgs/{orgId}/invites")
    public List<InviteResponse> listInvites(@AuthenticationPrincipal User user,
                                            @PathVariable Long orgId) {
        return inviteService.listOrgInvites(user, orgId);
    }

    /** List invites sent to the current user. No request body. Use token/acceptUrl to open invite page. */
    @GetMapping("/me/invites")
    public List<MyInviteResponse> myInvites(@AuthenticationPrincipal User user) {
        return inviteService.listInvitesForMe(user);
    }

    // Revoke invite (ADMIN/OWNER)
    @PostMapping("/invites/{inviteId}/revoke")
    public void revoke(@AuthenticationPrincipal User user,
                       @PathVariable Long inviteId) {
        inviteService.revokeInvite(user, inviteId);
    }

    // Accept invite (logged-in user)
    @PostMapping("/invites/{token}/accept")
    public void accept(@AuthenticationPrincipal User user,
                       @PathVariable String token) {
        inviteService.accept(user, token);
    }

    // Decline invite (logged-in user)
    @PostMapping("/invites/{token}/decline")
    public void decline(@AuthenticationPrincipal User user,
                        @PathVariable String token) {
        inviteService.decline(user, token);
    }
}
