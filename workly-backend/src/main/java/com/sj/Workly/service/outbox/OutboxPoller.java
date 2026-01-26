package com.sj.Workly.service.outbox;

import com.sj.Workly.entity.OutboxEvent;
import com.sj.Workly.entity.enums.OutboxStatus;
import com.sj.Workly.messaging.producer.OrgEventProducer;
import com.sj.Workly.repository.OutboxEventRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Instant;
import java.util.List;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeoutException;

@Component
@ConditionalOnProperty(name="app.kafka.enabled", havingValue="true")
public class OutboxPoller {

    private static final Logger logger = LoggerFactory.getLogger(OutboxPoller.class);

    private final OutboxEventRepository outboxRepo;
    private final OrgEventProducer producer;
    private final OrgEventSerializer serializer;

    @Value("${app.outbox.batch-size:50}")
    private int batchSize;

    @Value("${app.outbox.max-attempts:5}")
    private int maxAttempts;

    public OutboxPoller(OutboxEventRepository outboxRepo, OrgEventProducer producer, OrgEventSerializer serializer) {
        this.outboxRepo = outboxRepo;
        this.producer = producer;
        this.serializer = serializer;
    }

    @Scheduled(fixedDelayString = "${app.outbox.poll-ms:1000}")
    @Transactional
    public void pollAndPublish() {
        // 1) Fetch PENDING events in batch
        List<OutboxEvent> pendingEvents = outboxRepo.findTop50ByStatusOrderByCreatedAtAsc(OutboxStatus.PENDING);
        
        if (pendingEvents.isEmpty()) {
            return; // No events to process
        }

        // 2) Process each event
        for (OutboxEvent event : pendingEvents) {
            try {
                // Build envelope JSON
                String envelopeJson = serializer.toJsonEnvelope(
                        event.getEventType(),
                        event.getOrgId(),
                        event.getAggregateType(),
                        event.getAggregateId(),
                        event.getPayloadJson()
                );

                // 3) Publish to Kafka with partitionKey
                logger.info("Publishing outbox event id={} to topic={} key={}", event.getId(), event.getTopic(), event.getPartitionKey());
                producer.publish(event.getPartitionKey(), envelopeJson);

                // 4) Mark event as PUBLISHED with publishedAt timestamp
                event.setStatus(OutboxStatus.PUBLISHED);
                event.setPublishedAt(Instant.now());
                outboxRepo.save(event);

            } catch (Exception e) {
                // 5) On error: increment attempts, set lastError, mark as FAILED after max attempts
                logger.error("Failed to publish outbox event {}: {}", event.getId(), e.getMessage(), e);
                handlePublishError(event, e);
            }
        }
    }

    private void handlePublishError(OutboxEvent event, Exception e) {
        int newAttempts = event.getAttempts() + 1;
        event.setAttempts(newAttempts);
        event.setLastError(e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName());

        if (newAttempts >= maxAttempts) {
            // Mark as FAILED after max attempts
            event.setStatus(OutboxStatus.FAILED);
        }
        // Otherwise, keep as PENDING so it will be retried in the next poll cycle

        outboxRepo.save(event);
    }
}
