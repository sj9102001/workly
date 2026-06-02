package com.sj.Workly.repository;

import com.sj.Workly.entity.Subtask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface SubtaskRepository extends JpaRepository<Subtask, Long> {
    List<Subtask> findByIssueIdOrderByOrderIndexAsc(Long issueId);
    Optional<Subtask> findByIdAndIssueId(Long subtaskId, Long issueId);

    @Query("""
        select max(s.orderIndex)
        from Subtask s
        where s.issue.id = :issueId
    """)
    Integer findMaxOrderIndex(Long issueId);
}
