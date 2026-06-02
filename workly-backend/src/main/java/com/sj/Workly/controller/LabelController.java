package com.sj.Workly.controller;

import com.sj.Workly.dto.label.CreateLabelRequest;
import com.sj.Workly.dto.label.LabelResponse;
import com.sj.Workly.dto.label.UpdateLabelRequest;
import com.sj.Workly.entity.User;
import com.sj.Workly.service.LabelService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/orgs/{orgId}/projects/{projectId}/labels")
public class LabelController {

    private final LabelService labelService;

    public LabelController(LabelService labelService) {
        this.labelService = labelService;
    }

    @GetMapping
    public List<LabelResponse> list(@AuthenticationPrincipal User user,
                                    @PathVariable Long orgId,
                                    @PathVariable Long projectId) {
        return labelService.list(user, projectId);
    }

    @PostMapping
    public LabelResponse create(@AuthenticationPrincipal User user,
                                @PathVariable Long orgId,
                                @PathVariable Long projectId,
                                @Valid @RequestBody CreateLabelRequest req) {
        return labelService.create(user, orgId, projectId, req);
    }

    @PutMapping("/{labelId}")
    public LabelResponse update(@AuthenticationPrincipal User user,
                                @PathVariable Long orgId,
                                @PathVariable Long projectId,
                                @PathVariable Long labelId,
                                @Valid @RequestBody UpdateLabelRequest req) {
        return labelService.update(user, projectId, labelId, req);
    }

    @DeleteMapping("/{labelId}")
    public void delete(@AuthenticationPrincipal User user,
                       @PathVariable Long orgId,
                       @PathVariable Long projectId,
                       @PathVariable Long labelId) {
        labelService.delete(user, projectId, labelId);
    }
}
