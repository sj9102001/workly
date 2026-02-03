package com.sj.Workly.messaging.consumer;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sj.Workly.entity.Notification;
import com.sj.Workly.entity.Organization;
import com.sj.Workly.entity.enums.OrgEventType;
import com.sj.Workly.repository.NotificationRepository;
import com.sj.Workly.repository.OrganizationRepository;
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

import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;

@Component
@ConditionalOnProperty(name="app.kafka.enabled", havingValue="true")
public class OrgInviteNotificationConsumer {

    private static final Logger logger = LoggerFactory.getLogger(OrgInviteNotificationConsumer.class);
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final OrganizationRepository organizationRepository;

    private final ObjectMapper objectMapper;

    public OrgInviteNotificationConsumer(ObjectMapper objectMapper,
                                         UserRepository userRepository,
                                         NotificationRepository notificationRepository,
                                         OrganizationRepository organizationRepository) {
        this.objectMapper = objectMapper;
        this.userRepository = userRepository;
        this.notificationRepository = notificationRepository;
        this.organizationRepository = organizationRepository;
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
        String expiresAtRaw = payload.path("expires_at").asText(null);
        String inviteToken = payload.path("invite_token").asText(null);

        String expiresAtFormatted = "N/A";
        if (expiresAtRaw != null && !expiresAtRaw.isBlank()) {
            try {
                Instant instant = Instant.parse(expiresAtRaw);
                ZonedDateTime zdt = instant.atZone(ZoneId.systemDefault());
                DateTimeFormatter fmt = DateTimeFormatter.ofPattern("MMM d, uuuu h:mm a");
                expiresAtFormatted = fmt.format(zdt);
            } catch (Exception e) {
                expiresAtFormatted = expiresAtRaw;
            }
        }

        String orgName = "an organization";
        if (organizationId > 0) {
            Organization org = organizationRepository.findById(organizationId).orElse(null);
            if (org != null && org.getName() != null && !org.getName().isBlank()) {
                orgName = org.getName();
            }
        }

        Notification n = new Notification();
        n.setUser(userOpt.get());
        n.setType(Notification.Type.INVITE_RECEIVED);
        n.setMessage(String.format(
                "You have been invited to %s as %s. Invitation expires at %s.",
                orgName, invitedRole, expiresAtFormatted
        ));

        // Generic action metadata for future extensibility
        n.setActionEvent("ORG_INVITE");
        try {
            var actionPayloadNode = objectMapper.createObjectNode();
            actionPayloadNode.put("organizationId", organizationId);
            actionPayloadNode.put("organizationName", orgName);
            if (inviteId > 0) {
                actionPayloadNode.put("inviteId", inviteId);
            }
            if (inviteToken != null && !inviteToken.isBlank()) {
                actionPayloadNode.put("inviteToken", inviteToken);
                actionPayloadNode.put("acceptUrl", "/invite/" + inviteToken);
            }
            actionPayloadNode.put("invitedRole", invitedRole);
            actionPayloadNode.put("expiresAt", expiresAtFormatted);
            n.setActionPayload(objectMapper.writeValueAsString(actionPayloadNode));
        } catch (Exception e) {
            logger.warn("Failed to serialize notification action payload: {}", e.getMessage());
        }

        notificationRepository.save(n);
    }

}
