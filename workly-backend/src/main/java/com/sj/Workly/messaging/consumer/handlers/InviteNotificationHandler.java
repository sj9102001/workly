package com.sj.Workly.messaging.consumer.handlers;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sj.Workly.entity.Notification;
import com.sj.Workly.entity.Organization;
import com.sj.Workly.entity.enums.OrgEventType;
import com.sj.Workly.messaging.consumer.NotificationEventHandler;
import com.sj.Workly.repository.OrganizationRepository;
import com.sj.Workly.repository.UserRepository;
import com.sj.Workly.service.NotificationFromEventService;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;

@Component
public class InviteNotificationHandler implements NotificationEventHandler {

    private final ObjectMapper objectMapper;
    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;
    private final NotificationFromEventService notificationFromEventService;

    public InviteNotificationHandler(ObjectMapper objectMapper,
                                     UserRepository userRepository,
                                     OrganizationRepository organizationRepository,
                                     NotificationFromEventService notificationFromEventService) {
        this.objectMapper = objectMapper;
        this.userRepository = userRepository;
        this.organizationRepository = organizationRepository;
        this.notificationFromEventService = notificationFromEventService;
    }

    @Override
    public OrgEventType getEventType() {
        return OrgEventType.ORG_MEMBER_INVITED;
    }

    @Override
    public void handle(JsonNode payload) {
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

        String message = String.format(
                "You have been invited to %s as %s. Invitation expires at %s.",
                orgName, invitedRole, expiresAtFormatted
        );

        String actionPayloadJson = null;
        try {
            var actionPayloadNode = objectMapper.createObjectNode();
            actionPayloadNode.put("organizationId", organizationId);
            actionPayloadNode.put("organizationName", orgName);
            if (inviteId > 0) actionPayloadNode.put("inviteId", inviteId);
            if (inviteToken != null && !inviteToken.isBlank()) {
                actionPayloadNode.put("inviteToken", inviteToken);
                actionPayloadNode.put("acceptUrl", "/invite/" + inviteToken);
            }
            actionPayloadNode.put("invitedRole", invitedRole);
            actionPayloadNode.put("expiresAt", expiresAtFormatted);
            actionPayloadJson = objectMapper.writeValueAsString(actionPayloadNode);
        } catch (Exception e) {
            // leave null; notification still saved
        }

        notificationFromEventService.createAndSave(
                userOpt.get(),
                Notification.Type.INVITE_RECEIVED,
                message,
                "ORG_INVITE",
                actionPayloadJson
        );
    }
}
