package com.sj.Workly.service;

import com.sj.Workly.entity.Notification;
import com.sj.Workly.entity.User;
import com.sj.Workly.repository.NotificationRepository;
import org.springframework.stereotype.Service;

/**
 * Shared helper for creating and saving notifications from event payloads.
 * Used by all {@link com.sj.Workly.messaging.consumer.NotificationEventHandler} implementations
 * so we don't duplicate "new Notification(); set...; save" logic.
 */
@Service
public class NotificationFromEventService {

    private final NotificationRepository notificationRepository;

    public NotificationFromEventService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    /**
     * Create and save one notification. Call this from each event handler for each user to notify.
     *
     * @param user       the user to notify
     * @param type       notification type (e.g. INVITE_RECEIVED, ISSUE_COMMENTED)
     * @param message    human-readable message (e.g. "You were invited to Acme as ADMIN")
     * @param actionEvent frontend action key (e.g. "ORG_INVITE", "ISSUE_COMMENT")
     * @param actionPayloadJson JSON string for action payload (stored as jsonb); can be null
     */
    public void createAndSave(User user,
                              Notification.Type type,
                              String message,
                              String actionEvent,
                              String actionPayloadJson) {
        Notification n = new Notification();
        n.setUser(user);
        n.setType(type);
        n.setMessage(message);
        n.setActionEvent(actionEvent);
        n.setActionPayload(actionPayloadJson);
        notificationRepository.save(n);
    }
}
