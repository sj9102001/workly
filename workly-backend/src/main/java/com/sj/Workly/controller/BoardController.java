package com.sj.Workly.controller;

import com.sj.Workly.dto.board.*;
import com.sj.Workly.entity.User;
import com.sj.Workly.service.BoardService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/orgs/{orgId}/projects/{projectId}/boards")
public class BoardController {

    private final BoardService boardService;

    public BoardController(BoardService boardService) {
        this.boardService = boardService;
    }

    @PostMapping
    public BoardResponse create(@AuthenticationPrincipal User user,
                                @PathVariable Long orgId,
                                @PathVariable Long projectId,
                                @Valid @RequestBody CreateBoardRequest req) {
        return boardService.createBoard(user, orgId, projectId, req);
    }

    @GetMapping
    public List<BoardResponse> list(@AuthenticationPrincipal User user,
                                    @PathVariable Long orgId,
                                    @PathVariable Long projectId) {
        return boardService.listBoards(user, projectId);
    }
}
