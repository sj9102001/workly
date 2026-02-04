package com.sj.Workly.messaging.consumer;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sj.Workly.entity.enums.OrgEventType;
import jakarta.annotation.PostConstruct;
import jakarta.transaction.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Single Kafka consumer for all notification-producing events.
 * Dispatches each message to the right {@link NotificationEventHandler} by event type.
 * To add a new notification type: implement NotificationEventHandler and register as a Spring bean.
 */
@Component
@ConditionalOnProperty(name = "app.kafka.enabled", havingValue = "true")
public class NotificationConsumer {

    private static final Logger logger = LoggerFactory.getLogger(NotificationConsumer.class);

    private final ObjectMapper objectMapper;
    private final List<NotificationEventHandler> handlers;

    private Map<OrgEventType, NotificationEventHandler> handlerByEventType;

    public NotificationConsumer(ObjectMapper objectMapper,
                               List<NotificationEventHandler> handlers) {
        this.objectMapper = objectMapper;
        this.handlers = handlers;
        logger.info("NotificationConsumer initialized with {} handler(s) for event types: {}",
                handlers.size(),
                handlers.stream().map(h -> h.getEventType().name()).collect(Collectors.joining(", ")));
    }

    @PostConstruct
    void buildHandlerMap() {
        this.handlerByEventType = handlers.stream()
                .collect(Collectors.toUnmodifiableMap(NotificationEventHandler::getEventType, h -> h));
    }

    @KafkaListener(
            topics = "${app.kafka.topics.org-events:org.events}",
            groupId = "${app.kafka.consumer.groups.notifications:workly-notifications}"
    )
    @Transactional
    public void consume(@Payload String message,
                        @Header(name = KafkaHeaders.RECEIVED_KEY, required = false) String key) {
        try {
            JsonNode envelope = objectMapper.readTree(message);
            String eventTypeStr = envelope.path("eventType").asText(null);
            if (eventTypeStr == null || eventTypeStr.isBlank()) return;

            OrgEventType eventType;
            try {
                eventType = OrgEventType.valueOf(eventTypeStr);
            } catch (IllegalArgumentException e) {
                return; // unknown event type, ignore
            }

            NotificationEventHandler handler = handlerByEventType.get(eventType);
            if (handler == null) return;

            JsonNode payload = envelope.path("payload");
            handler.handle(payload);
        } catch (Exception e) {
            logger.error("Notification consumer failed: {}", e.getMessage(), e);
        }
    }
}
