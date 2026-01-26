package com.sj.Workly.messaging.consumer;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sj.Workly.entity.Notification;
import com.sj.Workly.entity.enums.OrgEventType;
import com.sj.Workly.repository.NotificationRepository;
import com.sj.Workly.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name="app.kafka.enabled", havingValue="true")
public class OrgInviteNotificationConsumer {

    private static final Logger logger = LoggerFactory.getLogger(OrgInviteNotificationConsumer.class);
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;

    private final ObjectMapper objectMapper;

    public OrgInviteNotificationConsumer(ObjectMapper objectMapper, UserRepository userRepository,
                                         NotificationRepository notificationRepository) {
        this.objectMapper = objectMapper;
        this.userRepository = userRepository;
        this.notificationRepository = notificationRepository;
        logger.info("OrgEventConsumer initialized and ready to consume from topic: org.events");
    }
    @KafkaListener(
            topics = "${app.kafka.topics.org-events:org.events}",
            groupId = "${app.kafka.consumer.groups.notifications:workly-notifications}"
    )
    @Transactional
    public void consumeOrgEventInvite(@Payload String message,
                                      @Header(name = KafkaHeaders.RECEIVED_KEY, required = false) String key) {
        try {
            JsonNode envelope = objectMapper.readTree(message);
            if (!OrgEventType.ORG_MEMBER_INVITED.name().equals(envelope.path("eventType").asText())) return;

            handleOrgMemberInvited(envelope.path("payload"));
        } catch (Exception e) {
            logger.error("Invite consumer failed: {}", e.getMessage(), e);
        }
    }

    private void handleOrgMemberInvited(JsonNode payload) {
        if (payload == null || payload.isMissingNode() || payload.isNull()) return;

        String invitedEmail = payload.path("invited_email").asText(null);
        if (invitedEmail == null || invitedEmail.isBlank()) return;

        var userOpt = userRepository.findByEmail(invitedEmail);
        if (userOpt.isEmpty()) return;

        long organizationId = payload.path("organization_id").asLong(-1);
        long inviteId = payload.path("invite_id").asLong(-1);
        String invitedRole = payload.path("invited_role").asText("MEMBER");
        String expiresAt = payload.path("expires_at").asText("N/A");

        Notification n = new Notification();
        n.setUser(userOpt.get());
        n.setType(Notification.Type.INVITE_RECEIVED);
        n.setMessage(String.format(
                "You have been invited to organization %d as %s (inviteId=%d). Expires at %s",
                organizationId, invitedRole, inviteId, expiresAt
        ));

        notificationRepository.save(n);
    }

}
