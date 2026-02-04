package com.sj.Workly.messaging.consumer;

import com.fasterxml.jackson.databind.JsonNode;
import com.sj.Workly.entity.enums.OrgEventType;

/**
 * Handles one kind of domain event and creates notification(s) for the right user(s).
 * Register implementations as Spring beans; the unified {@link NotificationConsumer} will dispatch to them.
 */
public interface NotificationEventHandler {

    /** The event type this handler cares about (e.g. ORG_MEMBER_INVITED, ISSUE_COMMENTED). */
    OrgEventType getEventType();

    /**
     * Parse the event payload and create/save one or more notifications.
     * Called within a transaction by the consumer.
     */
    void handle(JsonNode payload);
}
