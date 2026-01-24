package com.sj.Workly.repository;

import com.sj.Workly.entity.BoardColumn;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ColumnRepository extends JpaRepository<BoardColumn, Long> {
    List<BoardColumn> findByBoardIdOrderByOrderIndexAsc(Long boardId);
    Optional<BoardColumn> findByIdAndBoardId(Long id, Long boardId);
    boolean existsByBoardIdAndNameIgnoreCase(Long boardId, String name);
    Integer countByBoardId(Long boardId);
}
