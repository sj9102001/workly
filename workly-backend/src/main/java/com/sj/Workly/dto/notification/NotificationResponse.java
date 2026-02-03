package com.sj.Workly.dto.notification;

import com.fasterxml.jackson.databind.JsonNode;

import java.time.Instant;

public class NotificationResponse {

    private Long id;
    private String type;
    private String message;
    private String actionEvent;
    /** Frontend-facing payload as JSON object (e.g. for click handlers, navigation). */
    private JsonNode actionPayload;
    private String actionUrl;
    private Long inviteId;
    private Instant createdAt;
    private Instant readAt;
    private boolean read;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getActionEvent() {
        return actionEvent;
    }

    public void setActionEvent(String actionEvent) {
        this.actionEvent = actionEvent;
    }

    public JsonNode getActionPayload() {
        return actionPayload;
    }

    public void setActionPayload(JsonNode actionPayload) {
        this.actionPayload = actionPayload;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getReadAt() {
        return readAt;
    }

    public void setReadAt(Instant readAt) {
        this.readAt = readAt;
    }

    public boolean isRead() {
        return read;
    }

    public void setRead(boolean read) {
        this.read = read;
    }
}

