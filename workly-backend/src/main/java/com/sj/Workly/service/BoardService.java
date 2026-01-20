package com.sj.Workly.service;

import com.sj.Workly.dto.board.*;
import com.sj.Workly.entity.Board;
import com.sj.Workly.entity.Project;
import com.sj.Workly.entity.User;
import com.sj.Workly.entity.enums.Role;
import com.sj.Workly.exception.ConflictException;
import com.sj.Workly.exception.NotFoundException;
import com.sj.Workly.exception.UnauthorizedException;
import com.sj.Workly.repository.BoardRepository;
import com.sj.Workly.repository.OrgMemberRepository;
import com.sj.Workly.repository.ProjectMemberRepository;
import com.sj.Workly.repository.ProjectRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class BoardService {

    private final BoardRepository boardRepo;
    private final ProjectRepository projectRepo;
    private final OrgMemberRepository orgMemberRepo;
    private final ProjectMemberRepository projectMemberRepo;

    public BoardService(BoardRepository boardRepo,
                        ProjectRepository projectRepo,
                        OrgMemberRepository orgMemberRepo,
                        ProjectMemberRepository projectMemberRepo) {
        this.boardRepo = boardRepo;
        this.projectRepo = projectRepo;
        this.orgMemberRepo = orgMemberRepo;
        this.projectMemberRepo = projectMemberRepo;
    }

    @Transactional
    public BoardResponse createBoard(User actor, Long orgId, Long projectId, CreateBoardRequest req) {
        requireOrgAdminOrOwner(actor.getId(), orgId);

        Project project = projectRepo.findByIdAndOrgId(projectId, orgId)
                .orElseThrow(() -> new NotFoundException("Project not found"));

        if (boardRepo.existsByProjectIdAndNameIgnoreCase(projectId, req.getName())) {
            throw new ConflictException("Board name already exists in this project");
        }

        Board board = new Board();
        board.setProject(project);
        board.setName(req.getName().trim());

        board = boardRepo.save(board);
        return toResponse(board);
    }

    @Transactional(readOnly = true)
    public List<BoardResponse> listBoards(User actor, Long projectId) {
        requireProjectMember(actor.getId(), projectId);

        return boardRepo.findByProjectIdOrderByCreatedAtDesc(projectId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private void requireProjectMember(Long userId, Long projectId) {
        if (!projectMemberRepo.existsByProjectIdAndUserId(projectId, userId)) {
            throw new UnauthorizedException("Not a project member");
        }
    }

    private void requireOrgAdminOrOwner(Long userId, Long orgId) {
        var member = orgMemberRepo.findByOrgIdAndUserId(orgId, userId)
                .orElseThrow(() -> new UnauthorizedException("Not an organization member"));

        Role role = member.getRole();
        if (role != Role.OWNER && role != Role.ADMIN) {
            throw new UnauthorizedException("Only ADMIN/OWNER can do this");
        }
    }

    private BoardResponse toResponse(Board b) {
        BoardResponse r = new BoardResponse();
        r.setId(b.getId());
        r.setProjectId(b.getProject().getId());
        r.setName(b.getName());
        r.setCreatedAt(b.getCreatedAt());
        r.setUpdatedAt(b.getUpdatedAt());
        return r;
    }
}
