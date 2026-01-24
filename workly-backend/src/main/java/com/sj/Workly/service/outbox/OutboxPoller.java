package com.sj.Workly.service.outbox;

import com.sj.Workly.messaging.producer.OrgEventProducer;
import com.sj.Workly.repository.OutboxEventRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name="app.kafka.enabled", havingValue="true")
public class OutboxPoller {

    private final OutboxEventRepository outboxRepo;
    private final OrgEventProducer producer;
    private final OrgEventSerializer serializer;

    public OutboxPoller(OutboxEventRepository outboxRepo, OrgEventProducer producer, OrgEventSerializer serializer) {
        this.outboxRepo = outboxRepo;
        this.producer = producer;
        this.serializer = serializer;
    }

    @Value("${app.outbox.batch-size:50}")
    private int batchSize;

    @Scheduled(fixedDelayString = "${app.outbox.poll-ms:1000}")
    @Transactional
    public void pollAndPublish() {
        // 1) fetch PENDING (batch)
        // 2) for each: build envelope JSON
        // 3) publish to kafka with partitionKey
        // 4) mark event PUBLISHED + publishedAt
        // 5) on error: attempts++, lastError, maybe FAILED after N attempts
    }
}
