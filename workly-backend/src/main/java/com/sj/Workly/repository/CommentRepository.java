package com.sj.Workly.repository;

import com.sj.Workly.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {
    List<Comment> findByIssueId(Long issueId);
    List<Comment> findByAuthorId(Long authorId);
}
