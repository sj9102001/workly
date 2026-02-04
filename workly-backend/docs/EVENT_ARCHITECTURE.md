# Event-driven architecture (Kafka + Outbox)

## Current setup

- **One producer:** `OrgEventProducer` — publishes to **any topic** (topic comes from the outbox row). Default topic is `org.events`.
- **One outbox table:** `outbox_events` — stores `topic`, `event_type`, `payload_json`, `partition_key`, etc. The **OutboxPoller** reads PENDING rows and calls `producer.publish(event.getTopic(), key, envelope)` so each event can go to a different topic.
- **One poller:** `OutboxPoller` — batch-reads outbox, builds envelope JSON, publishes via the producer, marks PUBLISHED or retries.
- **Three consumers** (each in its own consumer group):

  | Consumer | Topic(s) | Group | Handles |
  |----------|----------|--------|---------|
  | OrgInviteNotificationConsumer | org.events | workly-notifications | ORG_MEMBER_INVITED → create notification |
  | OrgInviteEmailConsumer | org.events | workly-email | ORG_MEMBER_INVITED → send email |
  | IssueCommentNotificationConsumer | org.events | workly-comment-notifications | ISSUE_COMMENTED → create notification |

So: **one producer, one outbox, one poller, one topic today, three consumer groups**. Each consumer ignores event types it doesn’t care about.

---

## Is this fine?

Yes, for a single-topic design it’s correct:

- One producer that is **topic-aware** (publish to `event.getTopic()`) is the right abstraction.
- Multiple consumer groups on the same topic is standard Kafka: each group gets a full copy of the stream and processes independently.
- Filtering by `eventType` inside the consumer is valid; the cost is that every consumer receives every message and drops the ones it doesn’t handle.

So the architecture is **sound**. The main improvement we made was making the producer use the outbox’s `topic` so you can add more topics later without changing the poller.

---

## Enterprise-level recommendations

### 1. Topic strategy

| Approach | Pros | Cons | When to use |
|----------|------|------|-------------|
| **Single topic (current)** | Simple, one topic to operate, ordering by partition key across all event types | All consumers get all events; retention is global; topic can get large | Small/medium, few event types, same retention needs |
| **Topic per bounded context** | Clear ownership (e.g. org.events vs project.events), can tune retention per context | More topics to manage | Medium/large, clear domain boundaries |
| **Topic per event type** | Consumers subscribe only to what they need; easy to scale and set retention per type | Many topics; more ops | High scale, many event types, different SLAs |

**Recommendation:** Start with **one topic** (`org.events`) as you have now. When you add another context (e.g. project/issue events), introduce a second topic (e.g. `project.events`) and set `OutboxWriter` (or a dedicated project-outbox writer) to write `topic = project.events` for those events. The same producer and poller already support multiple topics.

### 2. Producer

- **One logical producer** that accepts `(topic, key, value)` is the right abstraction. You already have this.
- Naming: `OrgEventProducer` is a bit misleading now that it can publish to any topic. You could rename to `DomainEventProducer` or `EventProducer` and keep a single bean. Optional.

### 3. Consumers

- **Separate consumer group per use case** (notifications, email, comment-notifications) is correct. Keep that.
- When you add more topics, each consumer subscribes only to the topic(s) it needs (e.g. invite/email on `org.events`, comment on `org.events` or later `project.events`).
- Make handlers **idempotent** (e.g. don’t create duplicate notifications for the same event), and consider **dead-letter queues (DLQ)** for failed messages after retries.

### 4. Outbox

- Keep **one outbox table**; the `topic` column already allows routing to multiple topics.
- Optionally add a **event type → default topic** mapping in config or a small service so writers don’t hardcode topic names everywhere.

### 5. Contracts and evolution

- **Event envelope:** Keep a stable envelope (e.g. `eventType`, `payload`, `timestamp`, `aggregateId`). You have this.
- **Versioning:** For breaking changes, add a version to the event type or payload (e.g. `ISSUE_COMMENTED_V2`) and have consumers handle multiple versions or ignore old ones.
- **Schema registry:** For strict contracts and evolution, consider Avro/Protobuf + schema registry later; JSON is fine to start.

### 6. Observability and ops

- Log producer/poller failures and outbox FAILED rows; consider alerting.
- Monitor consumer lag per group.
- Optional: trace IDs in the envelope to trace a request across producer → Kafka → consumers.

---

## Summary

- **Current design:** One topic-aware producer, one outbox, one poller, three consumer groups on `org.events` is **correct and scalable** for your current scale.
- **Enterprise next steps:** (1) Keep one producer, use `event.getTopic()` (done). (2) Add more topics when you have a new bounded context. (3) Keep one consumer group per use case. (4) Add idempotency, DLQ, and observability as you grow.
