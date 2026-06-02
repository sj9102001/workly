package com.sj.Workly.repository;

import com.sj.Workly.entity.Activity;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ActivityRepository extends JpaRepository<Activity, Long> {
    List<Activity> findByProjectIdOrderByCreatedAtDesc(Long projectId, Pageable pageable);
}
