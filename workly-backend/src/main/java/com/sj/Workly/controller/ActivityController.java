package com.sj.Workly.controller;

import com.sj.Workly.dto.activity.ActivityResponse;
import com.sj.Workly.entity.User;
import com.sj.Workly.service.ActivityService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/orgs/{orgId}/projects/{projectId}/activity")
public class ActivityController {

    private final ActivityService activityService;

    public ActivityController(ActivityService activityService) {
        this.activityService = activityService;
    }

    @GetMapping
    public List<ActivityResponse> list(@AuthenticationPrincipal User user,
                                       @PathVariable Long orgId,
                                       @PathVariable Long projectId,
                                       @RequestParam(required = false, defaultValue = "20") int limit) {
        return activityService.list(user, projectId, limit);
    }
}
