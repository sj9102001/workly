package com.sj.Workly.service.outbox;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.UUID;

@Component
public class OrgEventSerializer {

    private final ObjectMapper objectMapper;

    public OrgEventSerializer(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public String toJsonEnvelope(
            String eventType,
            UUID orgId,
            String aggregateType,
            UUID aggregateId,
            String payloadJson
    ) {
        try {
            ObjectNode envelope = objectMapper.createObjectNode();
            envelope.put("eventType", eventType);
            envelope.put("orgId", orgId.toString());
            envelope.put("aggregateType", aggregateType);
            envelope.put("aggregateId", aggregateId.toString());
            envelope.put("timestamp", Instant.now().toString());
            
            // Parse the payload JSON string and add it as a nested object
            envelope.set("payload", objectMapper.readTree(payloadJson));
            
            return objectMapper.writeValueAsString(envelope);
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize event envelope", e);
        }
    }
}
