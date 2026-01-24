package com.sj.Workly.service;

import com.sj.Workly.dto.column.*;
import com.sj.Workly.entity.Board;
import com.sj.Workly.entity.BoardColumn;
import com.sj.Workly.entity.Project;
import com.sj.Workly.entity.User;
import com.sj.Workly.exception.ConflictException;
import com.sj.Workly.exception.NotFoundException;
import com.sj.Workly.exception.UnauthorizedException;
import com.sj.Workly.repository.BoardRepository;
import com.sj.Workly.repository.ColumnRepository;
import com.sj.Workly.repository.ProjectMemberRepository;
import com.sj.Workly.repository.ProjectRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ColumnService {

    private final ColumnRepository columnRepo;
    private final BoardRepository boardRepo;
    private final ProjectRepository projectRepo;
    private final ProjectMemberRepository projectMemberRepo;

    public ColumnService(ColumnRepository columnRepo,
                         BoardRepository boardRepo,
                         ProjectRepository projectRepo,
                         ProjectMemberRepository projectMemberRepo) {
        this.columnRepo = columnRepo;
        this.boardRepo = boardRepo;
        this.projectRepo = projectRepo;
        this.projectMemberRepo = projectMemberRepo;
    }

    @Transactional
    public ColumnResponse create(User actor, Long orgId, Long projectId, CreateColumnRequest req) {
        requireProjectMember(actor.getId(), projectId);

        Project project = projectRepo.findByIdAndOrgId(projectId, orgId)
                .orElseThrow(() -> new NotFoundException("Project not found"));

        Board board = boardRepo.findByProjectId(projectId)
                .orElseThrow(() -> new NotFoundException("Board not found for this project"));

        if (columnRepo.existsByBoardIdAndNameIgnoreCase(board.getId(), req.getName())) {
            throw new ConflictException("Column name already exists in this board");
        }

        // Get max orderIndex and add 1
        Integer maxOrder = columnRepo.countByBoardId(board.getId());
        if (maxOrder == null) maxOrder = 0;

        BoardColumn column = new BoardColumn();
        column.setBoard(board);
        column.setName(req.getName().trim());
        column.setOrderIndex(maxOrder);

        column = columnRepo.save(column);
        return toResponse(column);
    }

    @Transactional(readOnly = true)
    public List<ColumnResponse> list(User actor, Long orgId, Long projectId) {
        requireProjectMember(actor.getId(), projectId);

        Project project = projectRepo.findByIdAndOrgId(projectId, orgId)
                .orElseThrow(() -> new NotFoundException("Project not found"));

        Board board = boardRepo.findByProjectId(projectId)
                .orElseThrow(() -> new NotFoundException("Board not found for this project"));

        return columnRepo.findByBoardIdOrderByOrderIndexAsc(board.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public ColumnResponse update(User actor, Long orgId, Long projectId, Long columnId, UpdateColumnRequest req) {
        requireProjectMember(actor.getId(), projectId);

        Project project = projectRepo.findByIdAndOrgId(projectId, orgId)
                .orElseThrow(() -> new NotFoundException("Project not found"));

        Board board = boardRepo.findByProjectId(projectId)
                .orElseThrow(() -> new NotFoundException("Board not found for this project"));

        BoardColumn column = columnRepo.findByIdAndBoardId(columnId, board.getId())
                .orElseThrow(() -> new NotFoundException("Column not found"));

        if (req.getName() != null && !req.getName().trim().isEmpty()) {
            // Check for duplicate name (excluding current column)
            if (columnRepo.existsByBoardIdAndNameIgnoreCase(board.getId(), req.getName()) &&
                !column.getName().equalsIgnoreCase(req.getName())) {
                throw new ConflictException("Column name already exists in this board");
            }
            column.setName(req.getName().trim());
        }

        if (req.getOrderIndex() != null) {
            column.setOrderIndex(req.getOrderIndex());
        }

        column = columnRepo.save(column);
        return toResponse(column);
    }

    @Transactional
    public void delete(User actor, Long orgId, Long projectId, Long columnId) {
        requireProjectMember(actor.getId(), projectId);

        Project project = projectRepo.findByIdAndOrgId(projectId, orgId)
                .orElseThrow(() -> new NotFoundException("Project not found"));

        Board board = boardRepo.findByProjectId(projectId)
                .orElseThrow(() -> new NotFoundException("Board not found for this project"));

        BoardColumn column = columnRepo.findByIdAndBoardId(columnId, board.getId())
                .orElseThrow(() -> new NotFoundException("Column not found"));

        // TODO: Handle issues in this column - either move them or prevent deletion
        // For now, we'll prevent deletion if there are issues
        // This should be handled by cascade delete or moving issues to another column

        columnRepo.delete(column);
    }

    private void requireProjectMember(Long userId, Long projectId) {
        if (!projectMemberRepo.existsByProjectIdAndUserId(projectId, userId)) {
            throw new UnauthorizedException("Not a project member");
        }
    }

    private ColumnResponse toResponse(BoardColumn c) {
        ColumnResponse r = new ColumnResponse();
        r.setId(c.getId());
        r.setBoardId(c.getBoard().getId());
        r.setName(c.getName());
        r.setOrderIndex(c.getOrderIndex());
        r.setCreatedAt(c.getCreatedAt());
        r.setUpdatedAt(c.getUpdatedAt());
        return r;
    }
}
