package com.sj.Workly.dto.invite;

import com.sj.Workly.entity.Invite;
import com.sj.Workly.entity.OrgMember;
import com.sj.Workly.entity.enums.InviteStatus;
import com.sj.Workly.entity.enums.Role;

import java.time.Instant;

public class InviteResponse {
    private Long id;
    private Long orgId;
    private String invitedEmail;
    private Role invitedRole;
    private InviteStatus status;
    private Instant expiresAt;
    private Instant createdAt;

    // Useful for dev/testing; in prod you may NOT return token
    private String token;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getOrgId() {
        return orgId;
    }

    public void setOrgId(Long orgId) {
        this.orgId = orgId;
    }

    public String getInvitedEmail() {
        return invitedEmail;
    }

    public void setInvitedEmail(String invitedEmail) {
        this.invitedEmail = invitedEmail;
    }

    public Role getInvitedRole() {
        return invitedRole;
    }

    public void setInvitedRole(Role invitedRole) {
        this.invitedRole = invitedRole;
    }

    public InviteStatus getStatus() {
        return status;
    }

    public void setStatus(InviteStatus status) {
        this.status = status;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(Instant expiresAt) {
        this.expiresAt = expiresAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }
}
