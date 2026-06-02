package com.sj.Workly.entity;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * A project-scoped label (a.k.a. tag) that can be applied to many issues.
 * Names are unique within a project.
 */
@Entity
@Table(
        name = "labels",
        uniqueConstraints = @UniqueConstraint(columnNames = {"project_id", "name"}),
        indexes = {
                @Index(name = "idx_label_project", columnList = "project_id")
        }
)
public class Label {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // MANY labels belong to ONE project
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(nullable = false, length = 50)
    private String name;

    // Hex color (e.g. "#f97316"); used as the chip color in the UI.
    @Column(nullable = false, length = 9)
    private String color;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
    }

    public Label() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Project getProject() { return project; }
    public void setProject(Project project) { this.project = project; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
