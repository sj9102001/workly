# Cheatsheet: Add a new event or consumer

Use this when you want to add a **new kind of event** (e.g. “issue assigned”) or a **new reaction** (e.g. a new consumer that does something when “comment added” happens).

---

## A. Add a new event type (e.g. “Issue assigned” → outbox → Kafka)

**Goal:** When something happens in your app (e.g. issue assigned), write it to the outbox so it gets published to Kafka and existing (or new) consumers can react.

### 1. Add the event type enum

**File:** `entity/enums/OrgEventType.java`

```java
public enum OrgEventType {
    // ... existing
    ISSUE_ASSIGNED,   // add your new type
}
```

### 2. Add aggregate type (if new kind of aggregate)

**File:** `entity/enums/AggregateType.java`

```java
public enum AggregateType {
    // ... existing
    ISSUE,   // only if you're introducing a new aggregate
}
```

(For “issue assigned” you might reuse existing or add `ISSUE`.)

### 3. In your service: save the business data, then enqueue the event

**Where:** The service that performs the action (e.g. `IssueService` when assigning).

- Do the **business logic** (e.g. set assignee on issue, save).
- Build a **payload** (Map or POJO) with everything consumers might need: ids, names, timestamps, etc.
- Call the outbox writer **in the same transaction** (so if the transaction rolls back, no outbox row is committed).

**Example (pseudo):**

```java
// In IssueService.assign(...)
issue.setAssignee(assignee);
issueRepo.save(issue);

// Enqueue event (same transaction)
Map<String, Object> payload = new HashMap<>();
payload.put("issue_id", issue.getId());
payload.put("project_id", issue.getProject().getId());
payload.put("assignee_id", assignee.getId());
payload.put("assignee_email", assignee.getEmail());
payload.put("assigned_by_id", actor.getId());
payload.put("issue_title", issue.getTitle());
// ... anything else consumers need

String payloadJson = objectMapper.writeValueAsString(payload);
UUID orgIdUuid = OutboxWriter.longToUuid(issue.getProject().getOrg().getId());
UUID aggregateIdUuid = OutboxWriter.longToUuid(issue.getId());

outboxWriter.enqueueOrgEvent(
    OrgEventType.ISSUE_ASSIGNED,
    orgIdUuid,
    AggregateType.ISSUE,
    aggregateIdUuid,
    String.valueOf(issue.getId()),  // partition key
    payloadJson
);
```

**OutboxWriter** is in `service/outbox/OutboxWriter.java`. It only needs `enqueueOrgEvent(eventType, orgId, aggregateType, aggregateId, partitionKey, payloadJson)`. No Kafka call here—just one row in `outbox_events`.

### 4. Done for “publish” side

- **OutboxPoller** already runs every N ms and publishes **all** PENDING rows to Kafka (topic from `outbox_events.topic`, usually `org.events`).
- No change needed to the poller or producer when you add a new event type.

---

## B. Add a new **notification** for an event (recommended: use handler)

**Goal:** When an event happens (e.g. `ISSUE_ASSIGNED`), create a notification for the right user(s). No new Kafka consumer—just a new **handler** that the single `NotificationConsumer` will call.

### 1. Add a handler class

**Place:** `messaging/consumer/handlers/` (e.g. `IssueAssignedNotificationHandler.java`).

**Template:**

```java
@Component
public class IssueAssignedNotificationHandler implements NotificationEventHandler {

    private final ObjectMapper objectMapper;
    private final UserRepository userRepository;
    private final NotificationFromEventService notificationFromEventService;

    @Override
    public OrgEventType getEventType() {
        return OrgEventType.ISSUE_ASSIGNED;
    }

    @Override
    public void handle(JsonNode payload) {
        if (payload == null || payload.isMissingNode() || payload.isNull()) return;
        long assigneeId = payload.path("assignee_id").asLong(-1);
        if (assigneeId <= 0) return;
        userRepository.findById(assigneeId).ifPresent(user -> {
            String message = "You were assigned to: " + payload.path("issue_title").asText("");
            String actionPayloadJson = ...; // build JSON with issueId, projectId, etc.
            notificationFromEventService.createAndSave(
                user, Notification.Type.ISSUE_ASSIGNED, message, "ISSUE_ASSIGNED", actionPayloadJson);
        });
    }
}
```

- Implement **NotificationEventHandler** (interface in `messaging/consumer/NotificationEventHandler.java`).
- **getEventType()** returns the event you handle (e.g. `ISSUE_ASSIGNED`).
- **handle(JsonNode payload)** parses payload, decides who to notify, then calls **NotificationFromEventService.createAndSave(user, type, message, actionEvent, actionPayloadJson)** for each notification. No new consumer class, no new Kafka listener—the single **NotificationConsumer** discovers all handlers and dispatches by event type.

### 2. Add Notification.Type if needed

**File:** `entity/Notification.java` — enum `Type` already has `ISSUE_ASSIGNED`, `INVITE_RECEIVED`, `ISSUE_COMMENTED`, etc. Add a new value only if you introduce a new notification kind.

### 3. Done

- **NotificationConsumer** injects `List<NotificationEventHandler>` and builds a map by event type. Your new handler is picked up automatically as a Spring bean.

---

## C. Add a new **non-notification** consumer (e.g. email, Slack)

**Goal:** When an event is on Kafka, do something other than creating a notification (e.g. send email, post to Slack). Use a **separate** consumer class and its own consumer group.

### 1. Create a consumer class

**Place:** `messaging/consumer/` (e.g. `IssueAssignedSlackConsumer.java`).

**Template:**

```java
@Component
@ConditionalOnProperty(name = "app.kafka.enabled", havingValue = "true")
public class IssueAssignedNotificationConsumer {

    private final ObjectMapper objectMapper;
    private final NotificationRepository notificationRepository;
    // ... other deps

    @KafkaListener(
            topics = "${app.kafka.topics.org-events:org.events}",
            groupId = "${app.kafka.consumer.groups.issue-assigned:workly-issue-assigned}"
    )
    @Transactional
    public void consume(@Payload String message,
                       @Header(name = KafkaHeaders.RECEIVED_KEY, required = false) String key) {
        try {
            JsonNode envelope = objectMapper.readTree(message);
            if (!OrgEventType.ISSUE_ASSIGNED.name().equals(envelope.path("eventType").asText())) {
                return;  // ignore other event types
            }
            handleIssueAssigned(envelope.path("payload"));
        } catch (Exception e) {
            logger.error("Issue assigned consumer failed: {}", e.getMessage(), e);
        }
    }

    private void handleIssueAssigned(JsonNode payload) {
        // 1. Read from payload: payload.path("assignee_id").asLong(), etc.
        // 2. Create notification / call API / whatever you need
        // 3. notificationRepository.save(notification);
    }
}
```

### 2. Register the consumer group in config (optional but good)

**File:** `application.properties`

```properties
app.kafka.consumer.groups.issue-assigned=workly-issue-assigned
```

### 3. Use a unique consumer group id

- **Different reaction = different consumer group.**  
Examples: `workly-notifications`, `workly-email`, `workly-comment-notifications`, `workly-issue-assigned`.
- Same group id = same “logical consumer”; Kafka shares partitions among instances of that group.  
New group id = new independent consumer that gets its own copy of every message.

### 4. Done for consumer side

- No need to change the API, OutboxWriter, or NotificationConsumer.  
- Your new consumer listens to the same topic with its **own groupId**, filters by `eventType`, and does its work.

---

## Quick checklist


| I want to…                                                  | Do this                                                                                                                                                                       |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Publish a new event** (e.g. issue assigned)               | 1) Add `OrgEventType` (and optionally `AggregateType`). 2) In the service that does the action: after saving, call `outboxWriter.enqueueOrgEvent(..., payloadJson)`.          |
| **React to an existing event** (e.g. send Slack on comment) | 1) New class in `messaging/consumer/`, `@KafkaListener` on `org.events` with a **new groupId**. 2) In `consume()`, if `eventType` matches, parse `payload` and do your logic. |
| **React to a new event**                                    | Do “Publish a new event” first, then “React to an existing event” for that event type.                                                                                        |


---

## File map (where to touch)


| What                                  | File(s)                                                                                                                                    |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| New event type                        | `entity/enums/OrgEventType.java`                                                                                                           |
| New aggregate type                    | `entity/enums/AggregateType.java`                                                                                                          |
| Enqueue from app                      | Your service + `OutboxWriter.enqueueOrgEvent(...)`                                                                                         |
| New **notification** for an event     | New class in `messaging/consumer/handlers/` implementing `NotificationEventHandler`; use `NotificationFromEventService.createAndSave(...)` |
| New **other** consumer (email, Slack) | New class in `messaging/consumer/` with `@KafkaListener` and new groupId                                                                   |
| Consumer group id                     | `application.properties` (for non-notification consumers)                                                                                  |


---

## Copy-paste checklist for a new “X happened → notify user” flow

1. [ ] Add `X_HAPPENED` to `OrgEventType`.
2. [ ] In the service where X happens: after `save()`, build `payload` (Map with ids, names, etc.), then `outboxWriter.enqueueOrgEvent(X_HAPPENED, orgIdUuid, aggregateType, aggregateIdUuid, partitionKey, objectMapper.writeValueAsString(payload))`.
3. [ ] New consumer class: `@KafkaListener(topics = "org.events", groupId = "workly-x-notifications")`, in `consume()` check `eventType == "X_HAPPENED"`, then `handleX(envelope.path("payload"))` → create `Notification`, save.
4. [ ] Add `app.kafka.consumer.groups.x-notifications=workly-x-notifications` in `application.properties` (optional).
5. [ ] Run and test: trigger the action, check `outbox_events` (PENDING → PUBLISHED), then check `notifications` for the new row.

That’s the full loop; use this cheatsheet whenever you add another event or consumer by yourself.