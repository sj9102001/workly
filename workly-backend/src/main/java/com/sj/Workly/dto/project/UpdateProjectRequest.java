package com.sj.Workly.dto.project;

import jakarta.validation.constraints.Size;

public class UpdateProjectRequest {
    @Size(min=2, max=120)
    private String name;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}
