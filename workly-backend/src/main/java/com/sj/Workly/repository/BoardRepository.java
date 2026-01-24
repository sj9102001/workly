package com.sj.Workly.repository;

import com.sj.Workly.entity.Board;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BoardRepository extends JpaRepository<Board, Long> {
    Optional<Board> findByProjectId(Long projectId);
    boolean existsByProjectId(Long projectId);
}
