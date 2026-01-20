package com.sj.Workly.controller;

import com.sj.Workly.dto.user.*;
import com.sj.Workly.entity.User;
import com.sj.Workly.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/user")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) { this.userService = userService; }

    @PostMapping
    public ResponseEntity<CreateUserResponse> create(@Valid @RequestBody CreateUserRequest req) {
        return ResponseEntity.ok(userService.createUser(req));
    }

    @GetMapping
    public ResponseEntity<UserResponse> get(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(userService.getUser(user.getId()));
    }

    @PutMapping("")
    public ResponseEntity<UserResponse> update(@AuthenticationPrincipal User user,
                                               @Valid @RequestBody UpdateUserRequest req) {
        return ResponseEntity.ok(userService.updateUser(user.getId(), req));
    }

    @DeleteMapping("")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal User user) {
        userService.deleteUser(user.getId());
        return ResponseEntity.noContent().build();
    }
}
