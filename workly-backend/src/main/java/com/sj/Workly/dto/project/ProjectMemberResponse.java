package com.sj.Workly.dto.project;

import com.sj.Workly.entity.ProjectMember;
import java.time.Instant;

public class ProjectMemberResponse {
    private Long id;
    private Long userId;
    private String userName;
    private String userEmail;
    private ProjectMember.Role role;
    private Instant createdAt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public String getUserEmail() {
        return userEmail;
    }

    public void setUserEmail(String userEmail) {
        this.userEmail = userEmail;
    }

    public ProjectMember.Role getRole() {
        return role;
    }

    public void setRole(ProjectMember.Role role) {
        this.role = role;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
