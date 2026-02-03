package com.sj.Workly.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sj.Workly.dto.notification.NotificationResponse;
import com.sj.Workly.entity.Notification;
import com.sj.Workly.entity.User;
import com.sj.Workly.exception.NotFoundException;
import com.sj.Workly.exception.UnauthorizedException;
import com.sj.Workly.repository.NotificationRepository;
import jakarta.transaction.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final ObjectMapper objectMapper;

    public NotificationService(NotificationRepository notificationRepository, ObjectMapper objectMapper) {
        this.notificationRepository = notificationRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public Page<NotificationResponse> getNotifications(User actor, int page, int size, Boolean unreadOnly) {
        PageRequest pageable = PageRequest.of(page, size);

        Page<Notification> notifications = Boolean.TRUE.equals(unreadOnly)
                ? notificationRepository.findByUserIdAndReadAtIsNullOrderByCreatedAtDesc(actor.getId(), pageable)
                : notificationRepository.findByUserIdOrderByCreatedAtDesc(actor.getId(), pageable);

        return notifications.map(this::toResponse);
    }

    @Transactional
    public void markAsRead(User actor, Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new NotFoundException("Notification not found"));

        if (!notification.getUser().getId().equals(actor.getId())) {
            throw new UnauthorizedException("Cannot modify notifications of another user");
        }

        if (notification.getReadAt() == null) {
            notification.setReadAt(Instant.now());
            notificationRepository.save(notification);
        }
    }

    @Transactional
    public void markAllAsRead(User actor) {
        notificationRepository.findByUserIdAndReadAtIsNull(actor.getId())
                .forEach(n -> {
                    n.setReadAt(Instant.now());
                    notificationRepository.save(n);
                });
    }

    @Transactional
    public long getUnreadCount(User actor) {
        return notificationRepository.countByUserIdAndReadAtIsNull(actor.getId());
    }

    private NotificationResponse toResponse(Notification n) {
        NotificationResponse r = new NotificationResponse();
        r.setId(n.getId());
        r.setType(n.getType().name());
        r.setMessage(n.getMessage());
        r.setActionEvent(n.getActionEvent());
        try {
            r.setActionPayload(n.getActionPayload() != null && !n.getActionPayload().isBlank()
                    ? objectMapper.readTree(n.getActionPayload()) : null);
        } catch (Exception e) {
            r.setActionPayload(null);
        }
        r.setCreatedAt(n.getCreatedAt());
        r.setReadAt(n.getReadAt());
        r.setRead(n.getReadAt() != null);
        return r;
    }
}
