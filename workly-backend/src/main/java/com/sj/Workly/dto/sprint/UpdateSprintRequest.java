package com.sj.Workly.dto.sprint;

import com.sj.Workly.entity.enums.SprintStatus;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public class UpdateSprintRequest {

    @Size(min = 1, max = 120)
    private String name;

    private String goal;
    private SprintStatus status;
    private LocalDate startDate;
    private LocalDate endDate;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getGoal() { return goal; }
    public void setGoal(String goal) { this.goal = goal; }

    public SprintStatus getStatus() { return status; }
    public void setStatus(SprintStatus status) { this.status = status; }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }
}
