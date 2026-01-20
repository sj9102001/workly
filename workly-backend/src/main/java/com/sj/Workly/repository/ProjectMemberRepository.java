package com.sj.Workly.repository;

import com.sj.Workly.entity.ProjectMember;
import com.sj.Workly.entity.ProjectMember.Role;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProjectMemberRepository extends JpaRepository<ProjectMember, Long> {
    boolean existsByProjectIdAndUserId(Long projectId, Long userId);

    Optional<ProjectMember> findByProjectIdAndUserId(Long projectId, Long userId);

    List<ProjectMember> findByProjectId(Long projectId);

    List<ProjectMember> findByUserId(Long userId);

    long countByProjectIdAndRole(Long projectId, Role role);
}
