package com.sj.Workly.repository;

import com.sj.Workly.entity.Sprint;
import com.sj.Workly.entity.enums.SprintStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SprintRepository extends JpaRepository<Sprint, Long> {
    List<Sprint> findByProjectIdOrderByCreatedAtDesc(Long projectId);
    Optional<Sprint> findByIdAndProjectId(Long sprintId, Long projectId);
    Optional<Sprint> findFirstByProjectIdAndStatus(Long projectId, SprintStatus status);
    List<Sprint> findByProjectIdAndStatus(Long projectId, SprintStatus status);
}
