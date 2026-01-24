package com.sj.Workly.dto.column;

import jakarta.validation.constraints.Size;

public class UpdateColumnRequest {

    @Size(min = 1, max = 100)
    private String name;

    private Integer orderIndex;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Integer getOrderIndex() { return orderIndex; }
    public void setOrderIndex(Integer orderIndex) { this.orderIndex = orderIndex; }
}
