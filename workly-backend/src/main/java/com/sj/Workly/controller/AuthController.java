package com.sj.Workly.controller;

import com.sj.Workly.dto.auth.*;
import com.sj.Workly.service.AuthService;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;

@SecurityRequirements
@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) { this.authService = authService; }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest req) {
        var result = authService.register(req);
        return ResponseEntity.ok()
                .header("Set-Cookie", result.refreshCookie().toString())
                .body(result.body());
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest req) {
        var result = authService.login(req);
        return ResponseEntity.ok()
                .header("Set-Cookie", result.refreshCookie().toString())
                .body(result.body());
    }

    @SecurityRequirements()
    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(HttpServletRequest request) {
        String token = readCookie(request, AuthService.REFRESH_COOKIE_NAME);
        var result = authService.refresh(token);
        return ResponseEntity.ok()
                .header("Set-Cookie", result.refreshCookie().toString())
                .body(result.body());
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request) {
        String token = readCookie(request, AuthService.REFRESH_COOKIE_NAME);
        var cleared = authService.logout(token);
        return ResponseEntity.noContent()
                .header("Set-Cookie", cleared.toString())
                .build();
    }

    private String readCookie(HttpServletRequest req, String name) {
        Cookie[] cookies = req.getCookies();
        if (cookies == null) return null;
        for (Cookie c : cookies) {
            if (name.equals(c.getName())) return c.getValue();
        }
        return null;
    }
}
