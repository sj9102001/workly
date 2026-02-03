package com.sj.Workly.controller;

import com.sj.Workly.dto.notification.NotificationResponse;
import com.sj.Workly.entity.User;
import com.sj.Workly.service.NotificationService;
import org.springframework.data.domain.Page;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public Page<NotificationResponse> list(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size,
            @RequestParam(required = false, defaultValue = "false") boolean unreadOnly
    ) {
        return notificationService.getNotifications(user, page, size, unreadOnly);
    }

    @GetMapping("/unread-count")
    public long unreadCount(@AuthenticationPrincipal User user) {
        return notificationService.getUnreadCount(user);
    }

    @PatchMapping("/{id}/read")
    public void markAsRead(@AuthenticationPrincipal User user, @PathVariable Long id) {
        notificationService.markAsRead(user, id);
    }

    @PatchMapping("/read-all")
    public void markAllAsRead(@AuthenticationPrincipal User user) {
        notificationService.markAllAsRead(user);
    }
}

