package com.sj.Workly.service;

import com.sj.Workly.dto.invite.CreateInviteRequest;
import com.sj.Workly.dto.invite.InviteResponse;
import com.sj.Workly.entity.Invite;
import com.sj.Workly.entity.OrgMember;
import com.sj.Workly.entity.Organization;
import com.sj.Workly.entity.User;
import com.sj.Workly.entity.enums.InviteStatus;
import com.sj.Workly.entity.enums.Role;
import com.sj.Workly.exception.ConflictException;
import com.sj.Workly.exception.NotFoundException;
import com.sj.Workly.exception.UnauthorizedException;
import com.sj.Workly.repository.InviteRepository;
import com.sj.Workly.repository.OrgMemberRepository;
import com.sj.Workly.repository.OrganizationRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
public class InviteService {

    private final OrganizationRepository orgRepo;
    private final OrgMemberRepository memberRepo;
    private final InviteRepository inviteRepo;

    private final int inviteDays;

    public InviteService(
            OrganizationRepository orgRepo,
            OrgMemberRepository memberRepo,
            InviteRepository inviteRepo,
            @Value("${app.invite.days:7}") int inviteDays
    ) {
        this.orgRepo = orgRepo;
        this.memberRepo = memberRepo;
        this.inviteRepo = inviteRepo;
        this.inviteDays = inviteDays;
    }

    @Transactional
    public InviteResponse createInvite(User actor, Long orgId, CreateInviteRequest req) {
        requireAdminOrOwner(actor.getId(), orgId);

        Organization org = orgRepo.findById(orgId)
                .orElseThrow(() -> new NotFoundException("Organization not found"));

        String email = req.getEmail().trim().toLowerCase(Locale.ROOT);

        // already member?
        if (memberRepo.existsByOrgIdAndUserEmail(orgId, email)) {
            // If you don't have this query, see note below.
            throw new ConflictException("User is already a member");
        }

        // already invited and pending?
        if (inviteRepo.existsByOrgIdAndInvitedEmailAndStatus(orgId, email, InviteStatus.PENDING)) {
            throw new ConflictException("Invite already sent");
        }

        Invite invite = new Invite();
        invite.setOrg(org);
        invite.setInvitedBy(actor);
        invite.setInvitedEmail(email);
        invite.setToken(generateToken());
        invite.setStatus(InviteStatus.PENDING);
        invite.setInvitedRole(req.getRole() == null ? Role.MEMBER : req.getRole());
        invite.setExpiresAt(Instant.now().plusSeconds(inviteDays * 24L * 60L * 60L));

        invite = inviteRepo.save(invite);
        return toResponse(invite, true); // token included for now
    }

    @Transactional(readOnly = true)
    public List<InviteResponse> listOrgInvites(User actor, Long orgId) {
        requireAdminOrOwner(actor.getId(), orgId);
        return inviteRepo.findByOrgIdOrderByCreatedAtDesc(orgId)
                .stream()
                .map(i -> toResponse(i, false))
                .toList();
    }

    @Transactional
    public void revokeInvite(User actor, Long inviteId) {
        Invite invite = inviteRepo.findById(inviteId)
                .orElseThrow(() -> new NotFoundException("Invite not found"));

        requireAdminOrOwner(actor.getId(), invite.getOrg().getId());

        if (invite.getStatus() != InviteStatus.PENDING) return; // idempotent

        invite.setStatus(InviteStatus.REVOKED);
        inviteRepo.save(invite);
    }

    @Transactional
    public void accept(User actor, String token) {
        Invite invite = inviteRepo.findByToken(token)
                .orElseThrow(() -> new NotFoundException("Invite not found"));

        validateInviteForActor(invite, actor);

        Long orgId = invite.getOrg().getId();

        if (memberRepo.existsByOrgIdAndUserId(orgId, actor.getId())) {
            // already member -> treat as accept OK
            invite.setStatus(InviteStatus.ACCEPTED);
            inviteRepo.save(invite);
            return;
        }

        OrgMember m = new OrgMember();
        m.setOrg(invite.getOrg());
        m.setUser(actor);
        m.setRole(invite.getInvitedRole() == null ? Role.MEMBER : invite.getInvitedRole());
        memberRepo.save(m);

        invite.setStatus(InviteStatus.ACCEPTED);
        inviteRepo.save(invite);
    }

    @Transactional
    public void decline(User actor, String token) {
        Invite invite = inviteRepo.findByToken(token)
                .orElseThrow(() -> new NotFoundException("Invite not found"));

        validateInviteForActor(invite, actor);

        invite.setStatus(InviteStatus.DECLINED);
        inviteRepo.save(invite);
    }

    // ---- helpers ----

    private void validateInviteForActor(Invite invite, User actor) {
        if (invite.getStatus() != InviteStatus.PENDING) {
            throw new ConflictException("Invite is not pending");
        }
        if (invite.getExpiresAt().isBefore(Instant.now())) {
            invite.setStatus(InviteStatus.EXPIRED);
            inviteRepo.save(invite);
            throw new UnauthorizedException("Invite expired");
        }
        if (!invite.getInvitedEmail().equalsIgnoreCase(actor.getEmail())) {
            throw new UnauthorizedException("Invite does not belong to this user");
        }
    }

    private void requireAdminOrOwner(Long userId, Long orgId) {
        OrgMember m = memberRepo.findByOrgIdAndUserId(orgId, userId)
                .orElseThrow(() -> new UnauthorizedException("Not a member of this organization"));

        if (m.getRole() != Role.OWNER && m.getRole() != Role.ADMIN) {
            throw new UnauthorizedException("Only ADMIN/OWNER can perform this action");
        }
    }

    private String generateToken() {
        return UUID.randomUUID().toString().replace("-", "")
                + UUID.randomUUID().toString().replace("-", "");
    }

    private InviteResponse toResponse(Invite i, boolean includeToken) {
        InviteResponse r = new InviteResponse();
        r.setId(i.getId());
        r.setOrgId(i.getOrg().getId());
        r.setInvitedEmail(i.getInvitedEmail());
        r.setInvitedRole(i.getInvitedRole());
        r.setStatus(i.getStatus());
        r.setExpiresAt(i.getExpiresAt());
        r.setCreatedAt(i.getCreatedAt());
        if (includeToken) r.setToken(i.getToken());
        return r;
    }
}
