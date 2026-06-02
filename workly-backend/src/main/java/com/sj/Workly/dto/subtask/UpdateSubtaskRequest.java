package com.sj.Workly.dto.subtask;

import jakarta.validation.constraints.Size;

public class UpdateSubtaskRequest {

    @Size(min = 1, max = 300)
    private String title;

    private Boolean done;

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public Boolean getDone() { return done; }
    public void setDone(Boolean done) { this.done = done; }
}
