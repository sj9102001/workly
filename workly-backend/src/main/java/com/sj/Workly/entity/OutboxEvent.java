package com.sj.Workly.entity;

import com.sj.Workly.entity.enums.OutboxStatus;
import jakarta.persistence.*;
import org.hibernate.annotations.ColumnTransformer;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "outbox_events")
public class OutboxEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String topic; // "org.events"

    @Column(name="event_type", nullable = false, length = 100)
    private String eventType;

    @Column(name="aggregate_type", nullable = false, length = 100)
    private String aggregateType;

    @Column(name="aggregate_id", nullable = false)
    private UUID aggregateId;

    @Column(name="org_id", nullable = false)
    private UUID orgId;

    @Column(name="partition_key", nullable = false, length = 200)
    private String partitionKey;

    @Column(name="payload_json", nullable = false, columnDefinition = "jsonb")
    @ColumnTransformer(write = "?::jsonb")
    private String payloadJson;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private OutboxStatus status;

    @Column(nullable = false)
    private int attempts;

    @Column(name="last_error")
    private String lastError;

    @Column(name="published_at")
    private Instant publishedAt;

    @Column(name="created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }

    public String getTopic() {
        return topic;
    }

    public void setTopic(String topic) {
        this.topic = topic;
    }

    public String getEventType() {
        return eventType;
    }

    public void setEventType(String eventType) {
        this.eventType = eventType;
    }

    public String getAggregateType() {
        return aggregateType;
    }

    public void setAggregateType(String aggregateType) {
        this.aggregateType = aggregateType;
    }

    public UUID getAggregateId() {
        return aggregateId;
    }

    public void setAggregateId(UUID aggregateId) {
        this.aggregateId = aggregateId;
    }

    public UUID getOrgId() {
        return orgId;
    }

    public void setOrgId(UUID orgId) {
        this.orgId = orgId;
    }

    public String getPartitionKey() {
        return partitionKey;
    }

    public void setPartitionKey(String partitionKey) {
        this.partitionKey = partitionKey;
    }

    public String getPayloadJson() {
        return payloadJson;
    }

    public void setPayloadJson(String payloadJson) {
        this.payloadJson = payloadJson;
    }

    public OutboxStatus getStatus() {
        return status;
    }

    public void setStatus(OutboxStatus status) {
        this.status = status;
    }

    public int getAttempts() {
        return attempts;
    }

    public void setAttempts(int attempts) {
        this.attempts = attempts;
    }

    public String getLastError() {
        return lastError;
    }

    public void setLastError(String lastError) {
        this.lastError = lastError;
    }

    public Instant getPublishedAt() {
        return publishedAt;
    }

    public void setPublishedAt(Instant publishedAt) {
        this.publishedAt = publishedAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
