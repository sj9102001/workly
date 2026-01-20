package com.sj.Workly.dto.project;

import com.sj.Workly.entity.ProjectMember;
import jakarta.validation.constraints.NotNull;

public class AddProjectMemberRequest {
    @NotNull
    private Long userId;

    private ProjectMember.Role role = ProjectMember.Role.MEMBER;

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public ProjectMember.Role getRole() {
        return role;
    }

    public void setRole(ProjectMember.Role role) {
        this.role = role;
    }
}
