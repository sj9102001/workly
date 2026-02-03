package com.sj.Workly.service.outbox;

import com.sj.Workly.entity.OutboxEvent;
import com.sj.Workly.entity.enums.AggregateType;
import com.sj.Workly.entity.enums.OrgEventType;
import com.sj.Workly.entity.enums.OutboxStatus;
import com.sj.Workly.repository.OutboxEventRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class OutboxWriter {

    private final OutboxEventRepository outboxRepo;
    private final String orgEventsTopic;

    public OutboxWriter(
            OutboxEventRepository outboxRepo,
            @Value("${app.kafka.topics.org-events:org.events}") String orgEventsTopic
    ) {
        this.outboxRepo = outboxRepo;
        this.orgEventsTopic = orgEventsTopic;
    }

    public void enqueueOrgEvent(
            OrgEventType eventType,
            UUID orgId,
            AggregateType aggregateType,
            UUID aggregateId,
            String partitionKey,
            String payloadJson
    ) {
        OutboxEvent event = new OutboxEvent();
        event.setTopic(orgEventsTopic);
        event.setEventType(eventType.name());
        event.setAggregateType(aggregateType.name());
        event.setAggregateId(aggregateId);
        event.setOrgId(orgId);
        event.setPartitionKey(partitionKey);
        event.setPayloadJson(payloadJson);
        event.setStatus(OutboxStatus.PENDING);
        event.setAttempts(0);

        outboxRepo.save(event);
    }

    /**
     * Helper method to convert Long ID to UUID for outbox events.
     * Uses a deterministic UUID generation based on the Long value.
     */
    public static UUID longToUuid(Long id) {
        if (id == null) {
            return null;
        }
        // Create a deterministic UUID from Long by using nameUUIDFromBytes
        // This ensures the same Long always produces the same UUID
        byte[] bytes = new byte[16];
        long value = id;
        for (int i = 0; i < 8; i++) {
            bytes[i] = (byte) (value >>> (8 * i));
        }
        // Fill remaining bytes with zeros for consistency
        return UUID.nameUUIDFromBytes(bytes);
    }
}
