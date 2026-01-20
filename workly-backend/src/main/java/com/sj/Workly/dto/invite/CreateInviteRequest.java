package com.sj.Workly.dto.invite;

import com.sj.Workly.entity.OrgMember;
import com.sj.Workly.entity.enums.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class CreateInviteRequest {

    @NotBlank
    @Email
    private String email;

    // optional: allow inviting as MEMBER/ADMIN
    private Role role = Role.MEMBER;

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }
}
