package com.sj.Workly.controller;

import com.sj.Workly.dto.column.*;
import com.sj.Workly.entity.User;
import com.sj.Workly.service.ColumnService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/orgs/{orgId}/projects/{projectId}/columns")
public class ColumnController {

    private final ColumnService columnService;

    public ColumnController(ColumnService columnService) {
        this.columnService = columnService;
    }

    @PostMapping
    public ColumnResponse create(@AuthenticationPrincipal User user,
                                 @PathVariable Long orgId,
                                 @PathVariable Long projectId,
                                 @Valid @RequestBody CreateColumnRequest req) {
        return columnService.create(user, orgId, projectId, req);
    }

    @GetMapping
    public List<ColumnResponse> list(@AuthenticationPrincipal User user,
                                     @PathVariable Long orgId,
                                     @PathVariable Long projectId) {
        return columnService.list(user, orgId, projectId);
    }

    @PutMapping("/{columnId}")
    public ColumnResponse update(@AuthenticationPrincipal User user,
                                 @PathVariable Long orgId,
                                 @PathVariable Long projectId,
                                 @PathVariable Long columnId,
                                 @Valid @RequestBody UpdateColumnRequest req) {
        return columnService.update(user, orgId, projectId, columnId, req);
    }

    @DeleteMapping("/{columnId}")
    public void delete(@AuthenticationPrincipal User user,
                       @PathVariable Long orgId,
                       @PathVariable Long projectId,
                       @PathVariable Long columnId) {
        columnService.delete(user, orgId, projectId, columnId);
    }
}
