package com.sj.Workly.messaging.consumer;

import com.sj.Workly.entity.enums.OrgEventType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@Component
@ConditionalOnProperty(name="app.kafka.enabled", havingValue = "true")
public class OrgInviteEmailConsumer {
    private static final Logger logger = LoggerFactory.getLogger(OrgInviteEmailConsumer.class);

    private final ObjectMapper objectMapper;

    public OrgInviteEmailConsumer(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @KafkaListener(
            topics = "${app.kafka.topics.org-events:org.events}",
            groupId = "${app.kafka.consumer.groups.email:workly-email}"
    )
    public void consume(String message) {
        try {
            JsonNode envelope = objectMapper.readTree(message);

            if (!OrgEventType.ORG_MEMBER_INVITED.name().equals(envelope.path("eventType").asText())) return;

            JsonNode payload = envelope.path("payload");
            String email = payload.path("invited_email").asText(null);
            logger.info("Email Sent To: {}", email );
        } catch (Exception e) {
            logger.error("Email consumer failed: {}", e.getMessage(), e);
        }
    }
}
