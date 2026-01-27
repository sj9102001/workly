package com.sj.Workly.service;

import com.sj.Workly.entity.Notification;
import com.sj.Workly.entity.User;
import com.sj.Workly.repository.NotificationRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class NotificationService {
    private NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @Transactional()
    public List<Notification> getNotifications(User actor) {

    }
}
