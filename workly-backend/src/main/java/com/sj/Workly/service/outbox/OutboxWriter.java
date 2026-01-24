package com.sj.Workly.service.outbox;

import com.sj.Workly.entity.enums.AggregateType;
import com.sj.Workly.entity.enums.OrgEventType;
import com.sj.Workly.repository.OutboxEventRepository;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class OutboxWriter {

    private final OutboxEventRepository outboxRepo;

    public OutboxWriter(OutboxEventRepository outboxRepo) {
        this.outboxRepo = outboxRepo;
    }

    public void enqueueOrgEvent(
            OrgEventType eventType,
            UUID orgId,
            AggregateType aggregateType,
            UUID aggregateId,
            String partitionKey,
            String payloadJson
    ) {
        // create OutboxEvent row with status=PENDING
    }
}
