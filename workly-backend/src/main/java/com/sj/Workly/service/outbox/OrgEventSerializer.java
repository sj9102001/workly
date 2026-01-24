package com.sj.Workly.service.outbox;

import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class OrgEventSerializer {

    public String toJsonEnvelope(
            String eventType,
            UUID orgId,
            String aggregateType,
            UUID aggregateId,
            String payloadJson
    ) {
        // returns JSON string in your standard envelope format
        return null;
    }
}
