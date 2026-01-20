package com.sj.Workly.service;

import com.sj.Workly.dto.organization.*;
import com.sj.Workly.entity.OrgMember;
import com.sj.Workly.entity.Organization;
import com.sj.Workly.entity.User;
import com.sj.Workly.entity.enums.Role;
import com.sj.Workly.exception.ConflictException;
import com.sj.Workly.exception.NotFoundException;
import com.sj.Workly.exception.UnauthorizedException;
import com.sj.Workly.repository.OrgMemberRepository;
import com.sj.Workly.repository.OrganizationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;

@Service
public class OrganizationService {

    private final OrganizationRepository orgRepo;
    private final OrgMemberRepository memberRepo;

    public OrganizationService(OrganizationRepository orgRepo, OrgMemberRepository memberRepo) {
        this.orgRepo = orgRepo;
        this.memberRepo = memberRepo;
    }

    @Transactional
    public OrganizationResponse create(User actor, CreateOrganizationRequest req) {
        Organization org = new Organization();
        org.setName(req.getName().trim());
        org.setSlug(generateUniqueSlug(req.getName().trim()));
        org = orgRepo.save(org);

        OrgMember owner = new OrgMember();
        owner.setOrg(org);
        owner.setUser(actor);
        owner.setRole(Role.OWNER);
        memberRepo.save(owner);

        return toOrgResponse(org);
    }

    @Transactional(readOnly = true)
    public OrganizationResponse get(User actor, Long orgId) {
        requireMember(actor.getId(), orgId);
        Organization org = orgRepo.findById(orgId)
                .orElseThrow(() -> new NotFoundException("Organization not found"));
        return toOrgResponse(org);
    }

    @Transactional(readOnly = true)
    public List<OrganizationResponse> listMyOrgs(User actor) {
        // membership table is the truth
        return memberRepo.findByUserId(actor.getId()).stream()
                .map(OrgMember::getOrg)
                .map(this::toOrgResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<OrgMemberResponse> listMembers(User actor, Long orgId) {
        requireMember(actor.getId(), orgId);

        return memberRepo.findByOrgId(orgId).stream()
                .map(m -> {
                    OrgMemberResponse r = new OrgMemberResponse();
                    r.setId(m.getId());
                    r.setUserId(m.getUser().getId());
                    r.setUserName(m.getUser().getName());
                    r.setUserEmail(m.getUser().getEmail());
                    r.setRole(m.getRole());
                    r.setCreatedAt(m.getCreatedAt());
                    return r;
                }).toList();
    }

    @Transactional
    public OrganizationResponse update(User actor, Long orgId, UpdateOrganizationRequest req) {
        requireAdminOrOwner(actor.getId(), orgId);

        Organization org = orgRepo.findById(orgId)
                .orElseThrow(() -> new NotFoundException("Organization not found"));

        if (req.getName() != null && !req.getName().trim().isEmpty()) {
            org.setName(req.getName().trim());
        }

        org = orgRepo.save(org);
        return toOrgResponse(org);
    }

    @Transactional
    public void delete(User actor, Long orgId) {
        // MVP: only OWNER can delete
        requireOwner(actor.getId(), orgId);

        // prevent deleting org if multiple owners? optional
        // long owners = memberRepo.countByOrgIdAndRole(orgId, OrgMember.Role.OWNER);

        // delete memberships first to avoid FK issues
        memberRepo.deleteAll(memberRepo.findByOrgId(orgId));
        orgRepo.deleteById(orgId);
    }

    // ---- access checks ----

    private OrgMember requireMember(Long userId, Long orgId) {
        return memberRepo.findByOrgIdAndUserId(orgId, userId)
                .orElseThrow(() -> new UnauthorizedException("Not a member of this organization"));
    }

    private void requireOwner(Long userId, Long orgId) {
        OrgMember m = requireMember(userId, orgId);
        if (m.getRole() != Role.OWNER) {
            throw new UnauthorizedException("Only OWNER can perform this action");
        }
    }

    private void requireAdminOrOwner(Long userId, Long orgId) {
        OrgMember m = requireMember(userId, orgId);
        if (m.getRole() != Role.OWNER && m.getRole() != Role.ADMIN) {
            throw new UnauthorizedException("Only ADMIN/OWNER can perform this action");
        }
    }

    // ---- mapping ----

    private OrganizationResponse toOrgResponse(Organization org) {
        OrganizationResponse r = new OrganizationResponse();
        r.setId(org.getId());
        r.setName(org.getName());
        r.setSlug(org.getSlug());
        r.setCreatedAt(org.getCreatedAt());
        return r;
    }

    // ---- slug helpers ----

    private String generateUniqueSlug(String name) {
        String base = slugify(name);
        String slug = base;
        int i = 2;
        while (orgRepo.existsBySlug(slug)) {
            slug = base + "-" + i;
            i++;
        }
        return slug;
    }

    private String slugify(String input) {
        String s = Normalizer.normalize(input, Normalizer.Form.NFKD);
        s = s.replaceAll("[^\\p{Alnum}]+", "-");
        s = s.replaceAll("(^-+|-+$)", "");
        s = s.toLowerCase(Locale.ROOT);
        return s.isBlank() ? "org" : s;
    }
}
