package com.sj.Workly.service;

import com.sj.Workly.dto.board.BoardResponse;
import com.sj.Workly.entity.Board;
import com.sj.Workly.entity.BoardColumn;
import com.sj.Workly.entity.Project;
import com.sj.Workly.entity.User;
import com.sj.Workly.exception.NotFoundException;
import com.sj.Workly.exception.UnauthorizedException;
import com.sj.Workly.repository.BoardRepository;
import com.sj.Workly.repository.ColumnRepository;
import com.sj.Workly.repository.ProjectMemberRepository;
import com.sj.Workly.repository.ProjectRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BoardService {

    private final BoardRepository boardRepo;
    private final ColumnRepository columnRepo;
    private final ProjectRepository projectRepo;
    private final ProjectMemberRepository projectMemberRepo;

    public BoardService(BoardRepository boardRepo,
                        ColumnRepository columnRepo,
                        ProjectRepository projectRepo,
                        ProjectMemberRepository projectMemberRepo) {
        this.boardRepo = boardRepo;
        this.columnRepo = columnRepo;
        this.projectRepo = projectRepo;
        this.projectMemberRepo = projectMemberRepo;
    }

    /**
     * Creates a board for a project with default columns if it doesn't exist.
     * This is called automatically when a project is created.
     */
    @Transactional
    public Board createBoardForProject(Project project) {
        if (boardRepo.existsByProjectId(project.getId())) {
            return boardRepo.findByProjectId(project.getId())
                    .orElseThrow(() -> new NotFoundException("Board not found"));
        }

        Board board = new Board();
        board.setProject(project);
        board = boardRepo.save(board);

        // Create default columns
        String[] defaultColumns = {"TO DO", "IN PROGRESS", "IN REVIEW", "DONE"};
        for (int i = 0; i < defaultColumns.length; i++) {
            BoardColumn column = new BoardColumn();
            column.setBoard(board);
            column.setName(defaultColumns[i]);
            column.setOrderIndex(i);
            columnRepo.save(column);
        }

        return board;
    }

    @Transactional(readOnly = true)
    public BoardResponse getBoard(User actor, Long orgId, Long projectId) {
        requireProjectMember(actor.getId(), projectId);

        Project project = projectRepo.findByIdAndOrgId(projectId, orgId)
                .orElseThrow(() -> new NotFoundException("Project not found"));

        Board board = boardRepo.findByProjectId(projectId)
                .orElseThrow(() -> new NotFoundException("Board not found for this project"));

        return toResponse(board);
    }

    private void requireProjectMember(Long userId, Long projectId) {
        if (!projectMemberRepo.existsByProjectIdAndUserId(projectId, userId)) {
            throw new UnauthorizedException("Not a project member");
        }
    }

    private BoardResponse toResponse(Board b) {
        BoardResponse r = new BoardResponse();
        r.setId(b.getId());
        r.setProjectId(b.getProject().getId());
        r.setCreatedAt(b.getCreatedAt());
        r.setUpdatedAt(b.getUpdatedAt());
        return r;
    }
}
