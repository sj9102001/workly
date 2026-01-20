package com.sj.Workly.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "project_members",
        uniqueConstraints = @UniqueConstraint(name = "uq_project_user", columnNames = {"project_id", "user_id"}))
public class ProjectMember {

    public enum Role { ADMIN, MEMBER }

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name="project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name="user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable=false, length = 20)
    private Role role = Role.MEMBER;

    @Column(nullable=false, updatable=false)
    private Instant createdAt;

    @PrePersist
    void onCreate() { createdAt = Instant.now(); }

    public ProjectMember() {}

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Project getProject() {
        return project;
    }

    public void setProject(Project project) {
        this.project = project;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
