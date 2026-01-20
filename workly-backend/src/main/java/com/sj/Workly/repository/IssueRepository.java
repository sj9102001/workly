package com.sj.Workly.repository;

import com.sj.Workly.entity.Issue;
import com.sj.Workly.entity.enums.IssueStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface IssueRepository extends JpaRepository<Issue, Long> {
    List<Issue> findByProjectId(Long projectId);
    List<Issue> findByAssigneeId(Long userId);
    List<Issue> findByProjectIdOrderByCreatedAtDesc(Long projectId);
    List<Issue> findByProjectIdAndBoardIdOrderByPositionAsc(Long projectId, Long boardId);
    List<Issue> findByProjectIdAndBoardIsNullOrderByPositionAsc(Long projectId);
    List<Issue> findByProjectIdAndStatusOrderByCreatedAtDesc(Long projectId, IssueStatus status);
    Optional<Issue> findByIdAndProjectId(Long issueId, Long projectId);
    @Query("""
        select max(i.position)
        from Issue i
        where i.project.id = :projectId
          and (:boardId is null and i.board is null or i.board.id = :boardId)
    """)
    Double findMaxPosition(Long projectId, Long boardId);
}
