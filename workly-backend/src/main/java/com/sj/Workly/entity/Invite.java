package com.sj.Workly.entity;

import com.sj.Workly.entity.enums.InviteStatus;
import com.sj.Workly.entity.enums.Role;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "invites", indexes = @Index(name = "idx_invite_org", columnList = "org_id"))
public class Invite {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // MANY invites belong to ONE org
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "org_id", nullable = false)
    private Organization org;

    // Who sent the invite
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "invited_by_user_id", nullable = false)
    private User invitedBy;

    @Column(nullable = false)
    private String invitedEmail;

    @Column(nullable = false, unique = true)
    private String token; // random string for accept link

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private InviteStatus status = InviteStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role invitedRole = Role.MEMBER;

    public Role getInvitedRole() {
        return invitedRole;
    }

    public void setInvitedRole(Role invitedRole) {
        this.invitedRole = invitedRole;
    }

    @Column(nullable = false)
    private Instant expiresAt;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
    }

    public Invite() {}

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Organization getOrg() {
        return org;
    }

    public void setOrg(Organization org) {
        this.org = org;
    }

    public User getInvitedBy() {
        return invitedBy;
    }

    public void setInvitedBy(User invitedBy) {
        this.invitedBy = invitedBy;
    }

    public String getInvitedEmail() {
        return invitedEmail;
    }

    public void setInvitedEmail(String invitedEmail) {
        this.invitedEmail = invitedEmail;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
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
}
