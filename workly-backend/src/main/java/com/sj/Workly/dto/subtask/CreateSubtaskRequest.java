package com.sj.Workly.dto.subtask;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class CreateSubtaskRequest {

    @NotBlank
    @Size(min = 1, max = 300)
    private String title;

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
}
