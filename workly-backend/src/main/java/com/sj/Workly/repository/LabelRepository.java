package com.sj.Workly.repository;

import com.sj.Workly.entity.Label;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LabelRepository extends JpaRepository<Label, Long> {
    List<Label> findByProjectIdOrderByNameAsc(Long projectId);
    Optional<Label> findByIdAndProjectId(Long labelId, Long projectId);
    boolean existsByProjectIdAndNameIgnoreCase(Long projectId, String name);
}
