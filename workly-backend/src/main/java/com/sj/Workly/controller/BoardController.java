package com.sj.Workly.controller;

import com.sj.Workly.dto.board.BoardResponse;
import com.sj.Workly.entity.User;
import com.sj.Workly.service.BoardService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/orgs/{orgId}/projects/{projectId}/board")
public class BoardController {

    private final BoardService boardService;

    public BoardController(BoardService boardService) {
        this.boardService = boardService;
    }

    @GetMapping
    public BoardResponse get(@AuthenticationPrincipal User user,
                             @PathVariable Long orgId,
                             @PathVariable Long projectId) {
        return boardService.getBoard(user, orgId, projectId);
    }
}
