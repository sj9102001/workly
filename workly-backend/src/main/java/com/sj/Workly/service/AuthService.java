package com.sj.Workly.service;

import com.sj.Workly.dto.auth.*;
import com.sj.Workly.entity.OrgMember;
import com.sj.Workly.entity.Organization;
import com.sj.Workly.entity.RefreshToken;
import com.sj.Workly.entity.User;
import com.sj.Workly.entity.enums.Role;
import com.sj.Workly.exception.ConflictException;
import com.sj.Workly.exception.UnauthorizedException;
import com.sj.Workly.repository.OrgMemberRepository;
import com.sj.Workly.repository.OrganizationRepository;
import com.sj.Workly.repository.RefreshTokenRepository;
import com.sj.Workly.repository.UserRepository;
import com.sj.Workly.security.JwtService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.time.Instant;
import java.util.Locale;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepo;
    private final RefreshTokenRepository refreshRepo;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    private final int refreshDays;
    private final boolean cookieSecure;
    private final String sameSite;

    public static final String REFRESH_COOKIE_NAME = "refresh_token";
    private final OrganizationRepository orgRepo;
    private final OrgMemberRepository orgMemberRepo;

    public AuthService(
            UserRepository userRepo,
            RefreshTokenRepository refreshRepo,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            @Value("${app.jwt.refresh-days}") int refreshDays,
            @Value("${app.cookie.secure}") boolean cookieSecure,
            @Value("${app.cookie.same-site}") String sameSite,
            OrganizationRepository orgRepo,
            OrgMemberRepository orgMemberRepo
    ) {
        this.userRepo = userRepo;
        this.refreshRepo = refreshRepo;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.refreshDays = refreshDays;
        this.cookieSecure = cookieSecure;
        this.sameSite = sameSite;
        this.orgRepo = orgRepo;
        this.orgMemberRepo = orgMemberRepo;
    }

    private String slugify(String input) {
        String s = Normalizer.normalize(input, Normalizer.Form.NFKD);
        s = s.replaceAll("[^\\p{Alnum}]+", "-");
        s = s.replaceAll("(^-+|-+$)", "");
        s = s.toLowerCase(Locale.ROOT);
        return s.isBlank() ? "org" : s;
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


    @Transactional
    public AuthResult register(RegisterRequest req) {
        String email = req.getEmail().trim().toLowerCase(Locale.ROOT);

        if (userRepo.existsByEmail(email)) {
            throw new ConflictException("Email already exists");
        }

        // Create user (and your org bootstrap)
        User user = new User(req.getName().trim(), email, passwordEncoder.encode(req.getPassword()));
        user = userRepo.save(user);

        // 2) Create Organization
        Organization org = new Organization(req.getOrgName(), generateUniqueOrgSlug(req.getOrgName().trim()));
        org = orgRepo.save(org);

        // 3) Create OrgMember OWNER
        OrgMember member = new OrgMember(org, user, Role.OWNER);
        orgMemberRepo.save(member);


        String access = jwtService.createAccessToken(user.getId(), user.getEmail());
        RefreshToken refresh = createRefreshToken(user);

        return new AuthResult(new AuthResponse(access, user.getId()), buildRefreshCookie(refresh.getToken()));
    }

    @Transactional
    public AuthResult login(LoginRequest req) {
        String email = req.getEmail().trim().toLowerCase(Locale.ROOT);

        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));

        if (!passwordEncoder.matches(req.getPassword(), user.getHashedPassword())) {
            throw new UnauthorizedException("Invalid email or password");
        }

        String access = jwtService.createAccessToken(user.getId(), user.getEmail());
        RefreshToken refresh = createRefreshToken(user);

        return new AuthResult(new AuthResponse(access, user.getId()), buildRefreshCookie(refresh.getToken()));
    }

    @Transactional
    public AuthResult refresh(String refreshTokenValue) {
        if (refreshTokenValue == null || refreshTokenValue.isBlank()) {
            throw new UnauthorizedException("Missing refresh token");
        }

        RefreshToken old = refreshRepo.findByToken(refreshTokenValue)
                .orElseThrow(() -> new UnauthorizedException("Invalid refresh token"));

        if (old.isRevoked() || old.getExpiresAt().isBefore(Instant.now())) {
            throw new UnauthorizedException("Refresh token expired");
        }

        // Rotate refresh token
        old.setRevokedAt(Instant.now());
        RefreshToken next = createRefreshToken(old.getUser());
        old.setReplacedByToken(next.getToken());
        refreshRepo.save(old);

        String access = jwtService.createAccessToken(old.getUser().getId(), old.getUser().getEmail());
        return new AuthResult(new AuthResponse(access, old.getUser().getId()), buildRefreshCookie(next.getToken()));
    }

    @Transactional
    public ResponseCookie logout(String refreshTokenValue) {
        if (refreshTokenValue != null && !refreshTokenValue.isBlank()) {
            refreshRepo.findByToken(refreshTokenValue).ifPresent(rt -> {
                rt.setRevokedAt(Instant.now());
                refreshRepo.save(rt);
            });
        }
        return clearRefreshCookie();
    }

    // ---- Cookie helpers ----

    private ResponseCookie buildRefreshCookie(String token) {
        // Path restricted to refresh/logout endpoints
        return ResponseCookie.from(REFRESH_COOKIE_NAME, token)
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite(sameSite) // Strict is safest for same-site apps
                .path("/auth")      // cookie only sent to /auth/*
                .maxAge(refreshDays * 24L * 60L * 60L)
                .build();
    }

    private ResponseCookie clearRefreshCookie() {
        return ResponseCookie.from(REFRESH_COOKIE_NAME, "")
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite(sameSite)
                .path("/auth")
                .maxAge(0)
                .build();
    }

    private RefreshToken createRefreshToken(User user) {
        RefreshToken rt = new RefreshToken();
        rt.setUser(user);
        rt.setToken(UUID.randomUUID().toString().replace("-", "") + UUID.randomUUID().toString().replace("-", ""));
        rt.setExpiresAt(Instant.now().plusSeconds(refreshDays * 24L * 60L * 60L));
        return refreshRepo.save(rt);
    }

    // Small helper record to return both JSON + cookie
    public record AuthResult(AuthResponse body, ResponseCookie refreshCookie) {}
}
