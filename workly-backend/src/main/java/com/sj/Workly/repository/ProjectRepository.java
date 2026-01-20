package com.sj.Workly.repository;

import com.sj.Workly.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProjectRepository extends JpaRepository<Project, Long> {
    List<Project> findByOrgId(Long orgId);
    Optional<Project> findByOrgIdAndKey(Long orgId, String key);
}
