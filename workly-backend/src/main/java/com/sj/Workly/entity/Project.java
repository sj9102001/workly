package com.sj.Workly.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(
        name = "projects",
        uniqueConstraints = @UniqueConstraint(columnNames = {"org_id", "slug"})
)
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // MANY projects belong to ONE organization
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "org_id", nullable = false)
    private Organization org;

    @Column(nullable = false)
    private String name;

    @Column(name = "slug", nullable = false)
    private String slug; // e.g. "WORK", used in Issue keys WORK-123

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by_user_id", nullable = false)
    private User createdBy;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
        updatedAt = createdAt;
    }

    @PreUpdate
    void onUpdate() {updatedAt = Instant.now();}

    public Project() {}

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Organization getOrg() {
        return org;
    }

    public void setOrg(Organization org) {
        this.org = org;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getSlug() {
        return slug;
    }

    public void setSlug(String key) {
        this.slug = key;
    }

    public User getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(User createdBy) {
        this.createdBy = createdBy;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
