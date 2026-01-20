package com.sj.Workly.dto.organization;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class CreateOrganizationRequest {
    @NotBlank
    @Size(min = 2, max = 80)
    private String name;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}
