package com.sj.Workly.dto.label;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class UpdateLabelRequest {

    @Size(min = 1, max = 50)
    private String name;

    @Pattern(regexp = "^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$", message = "color must be a hex value")
    private String color;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }
}
