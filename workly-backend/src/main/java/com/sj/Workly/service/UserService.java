package com.sj.Workly.service;

import com.sj.Workly.dto.user.*;
import com.sj.Workly.entity.*;
import com.sj.Workly.entity.enums.Role;
import com.sj.Workly.exception.ConflictException;
import com.sj.Workly.exception.NotFoundException;
import com.sj.Workly.repository.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.Locale;

@Service
public class UserService {

    private final UserRepository userRepo;
    private final OrganizationRepository orgRepo;
    private final OrgMemberRepository orgMemberRepo;
    private final PasswordEncoder passwordEncoder;

    public UserService(
            UserRepository userRepo,
            OrganizationRepository orgRepo,
            OrgMemberRepository orgMemberRepo,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepo = userRepo;
        this.orgRepo = orgRepo;
        this.orgMemberRepo = orgMemberRepo;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public CreateUserResponse createUser(CreateUserRequest req) {
        String email = req.getEmail().trim().toLowerCase(Locale.ROOT);

        if (userRepo.existsByEmail(email)) {
            throw new ConflictException("Email already exists");
        }

        // 1) Create User
        User user = new User(req.getName(), email, passwordEncoder.encode(req.getPassword()));
        userRepo.save(user);

        // 2) Create Organization
        Organization org = new Organization(req.getOrgName(), generateUniqueOrgSlug(req.getOrgName().trim()));
        org = orgRepo.save(org);

        // 3) Create OrgMember OWNER
        OrgMember member = new OrgMember(org, user, Role.OWNER);
        orgMemberRepo.save(member);

        // Response
        CreateUserResponse res = new CreateUserResponse();
        res.setUser(toUserResponse(user));
        res.setOrganizationId(org.getId());
        res.setOrganizationSlug(org.getSlug());
        return res;
    }

    @Transactional(readOnly = true)
    public UserResponse getUser(Long id) {
        User user = userRepo.findById(id)
                .orElseThrow(() -> new NotFoundException("User not found"));
        return toUserResponse(user);
    }

    @Transactional
    public UserResponse updateUser(Long id, UpdateUserRequest req) {
        User user = userRepo.findById(id)
                .orElseThrow(() -> new NotFoundException("User not found"));

        if (req.getName() != null && !req.getName().trim().isEmpty()) {
            user.setName(req.getName().trim());
        }

        if (req.getPassword() != null && !req.getPassword().trim().isEmpty()) {
            user.setHashedPassword(passwordEncoder.encode(req.getPassword()));
        }

        user = userRepo.save(user);
        return toUserResponse(user);
    }

    @Transactional
    public void deleteUser(Long id) {
        // Simple MVP delete:
        // - remove memberships first (so FK constraints won't fail)
        // - delete user
        // (Later you can decide what happens to org/projects/issues)
        if (!userRepo.existsById(id)) {
            throw new NotFoundException("User not found");
        }

        orgMemberRepo.deleteAll(orgMemberRepo.findByUserId(id));
        userRepo.deleteById(id);
    }

    // ---- Helpers ----

    private UserResponse toUserResponse(User user) {
        UserResponse dto = new UserResponse();
        dto.setId(user.getId());
        dto.setName(user.getName());
        dto.setEmail(user.getEmail());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setUpdatedAt(user.getUpdatedAt());
        return dto;
    }

    private String generateUniqueOrgSlug(String orgName) {
        String base = slugify(orgName);
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
