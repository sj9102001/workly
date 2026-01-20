package com.sj.Workly.repository;

import com.sj.Workly.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProjectRepository extends JpaRepository<Project, Long> {
    boolean existsByOrgIdAndSlug(Long orgId, String slug);
    List<Project> findByOrgIdOrderByCreatedAtDesc(Long orgId);
    Optional<Project> findByIdAndOrgId(Long projectId, Long orgId);
}
