package com.sj.Workly.dto.invite;

import com.sj.Workly.entity.enums.InviteStatus;
import com.sj.Workly.entity.enums.Role;

import java.time.Instant;

/**
 * Invite as returned to the invited user ("invites sent to me").
 * Includes token and acceptUrl so the frontend can open the invite page.
 */
public class MyInviteResponse {

    private Long id;
    private Long orgId;
    private String orgName;
    private Role invitedRole;
    private InviteStatus status;
    private Instant expiresAt;
    private Instant createdAt;
    /** Token for accept/decline and for building the invite page URL. */
    private String token;
    /** Frontend path to open this invite (e.g. /invite/{token}). */
    private String acceptUrl;

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

    public String getOrgName() {
        return orgName;
    }

    public void setOrgName(String orgName) {
        this.orgName = orgName;
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

    public String getAcceptUrl() {
        return acceptUrl;
    }

    public void setAcceptUrl(String acceptUrl) {
        this.acceptUrl = acceptUrl;
    }
}
