# Event-driven flow: end-to-end (beginner guide)

This doc walks through **how an action in your app (e.g. “add a comment”) turns into a Kafka event and then into a notification**, and why we build it this way. No prior Kafka knowledge assumed.

---

## 1. What is “event-driven” and why use it?

### The old way (synchronous)

When the user adds a comment, you could do everything in one request:

```
User clicks "Post comment"
  → API saves comment to DB
  → API calls NotificationService.createNotification(...)   ← same process
  → API calls EmailService.send(...)                        ← same process
  → API returns "Comment added"
```

**Problems:**

- If creating the notification or sending email is **slow or fails**, the whole request fails or times out. The user might see an error even though the comment was saved.
- Your API is **tightly coupled** to notifications and email. Adding a new “reaction” (e.g. “send Slack message when someone comments”) means changing the comment API again.
- You can’t **scale** “comment API” and “notification creation” independently.

### The event-driven way (what we do)

We **don’t** call the notification or email code from the comment API. We only:

1. Save the comment.
2. Write **“this happened”** somewhere (a record that says “comment X was added with this data”).

Then, **separately**, other processes read “this happened” and do their job (create notification, send email, etc.). Those processes are **decoupled** from the API.

```
User clicks "Post comment"
  → API saves comment to DB
  → API writes one row: "Event: COMMENT_ADDED, payload: {...}"   ← just a DB write
  → API returns "Comment added"   ← fast, no waiting for notifications

Later, in the background:
  → Something reads that row and publishes it to Kafka
  → Kafka delivers the message to "notification worker" and "email worker"
  → Each worker does its job (create notification, send email)
```

So: **event-driven** = “something happened” is stored as an **event**; other parts of the system **react** to that event asynchronously.

---

## 2. Why Kafka? Why not just a background thread?

You could run a background thread that reads “pending events” from the DB and calls NotificationService. That’s a simple form of async. We use **Kafka** because:

- **Durable:** Messages stay in Kafka even if your consumer is down. When the consumer comes back, it continues from where it left off.
- **Multiple consumers:** Many “workers” (notification, email, analytics, etc.) can all read the **same** event, each in its own **consumer group**, without you coding a custom dispatcher.
- **Scaling:** You can run more instances of a consumer; Kafka shares the load (partitions).
- **Standard:** Kafka is a standard piece of event-driven architecture; learning it helps you in any enterprise system.

So in our app: the **API + outbox** produce events; **Kafka** is the bus that delivers them; **consumers** are the workers that react (notifications, email, etc.).

---

## 3. Why the “outbox” table?

We don’t publish to Kafka **directly** from the same database transaction that saves the comment. Why?

**Problem if we publish inside the transaction:**

- Transaction starts → save comment → send message to Kafka → Kafka says “OK” → transaction commits.
- If the transaction **rolls back** (e.g. DB error after Kafka said OK), the comment is not in the DB but Kafka already has the event. So a consumer might create a notification for a comment that “doesn’t exist.” **Inconsistent.**

**Outbox pattern:**

- In the **same** transaction as “save comment,” we also **insert a row** into an `outbox_events` table: “event type = ISSUE_COMMENTED, payload = {...}”.
- We **never** send to Kafka inside that transaction.
- A **separate process** (the **OutboxPoller**) runs every second, reads **pending** rows from `outbox_events`, publishes each to Kafka, then marks the row as PUBLISHED.

So: **only events that are safely stored in the DB ever get published.** If the transaction rolls back, the outbox row is never committed, so nothing is published. This keeps “comment in DB” and “event in Kafka” in sync.

---

## 4. End-to-end flow (one example: “Comment added → Notification”)

Follow this with the code open. We’ll use **adding a comment** as the example.

### Step 0: User action

- User posts a comment on an issue (e.g. “Looks good!”).
- Frontend calls: `POST /orgs/1/projects/2/issues/3/comments` with body `{ "body": "Looks good!" }`.

---

### Step 1: API saves the comment and writes to the outbox (same transaction)

**Where:** `CommentService.add(...)` in `service/CommentService.java`.

1. Check user is a project member.
2. Load the issue; create a `Comment` entity; set author, body, issue.
3. **Save the comment:** `commentRepo.save(comment)` → one row in `comments` table.
4. **Publish “event” = write to outbox only:**  
   `publishCommentAddedEvent(comment, issue)` builds a JSON payload (comment_id, issue_id, author_name, assignee_id, reporter_id, etc.) and calls **OutboxWriter.enqueueOrgEvent(...)**.

**OutboxWriter** (`service/outbox/OutboxWriter.java`):

- Creates an **OutboxEvent** entity: topic = `org.events`, eventType = `ISSUE_COMMENTED`, payloadJson = that JSON, status = PENDING, partition_key = e.g. issue id.
- Saves it: **one row in `outbox_events`** table.

So after the transaction commits we have:

- **DB:** comment row + one outbox row (status = PENDING).  
- **Kafka:** nothing yet.

---

### Step 2: OutboxPoller runs (scheduled, every 1 second)

**Where:** `OutboxPoller.pollAndPublish()` in `service/outbox/OutboxPoller.java`.

- Runs on a schedule (`@Scheduled(fixedDelayString = "${app.outbox.poll-ms:1000}")`), e.g. every 1 second.
- **Reads:** “Give me up to 50 outbox rows where status = PENDING, ordered by created_at.”
- For **each** such row:
  1. **Build envelope:** `OrgEventSerializer.toJsonEnvelope(...)` wraps the payload into a single JSON object: `{ "eventType": "ISSUE_COMMENTED", "orgId": "...", "aggregateType": "COMMENT", "aggregateId": "...", "timestamp": "...", "payload": { ... } }`.
  2. **Send to Kafka:** `OrgEventProducer.publish(event.getTopic(), event.getPartitionKey(), envelopeJson)` → message is published to the topic **org.events** with partition key = e.g. issue id.
  3. **Update outbox row:** status = PUBLISHED, published_at = now, save.

So now:

- **DB:** outbox row status = PUBLISHED.  
- **Kafka:** one message on topic **org.events** with that envelope.

---

### Step 3: Kafka stores the message and delivers it to consumer groups

- **Topic:** `org.events`. All our domain events (invites, comments) go here.
- **Partition key:** we use e.g. issue id so all events for the same issue tend to go to the same partition (ordering per issue).
- **Consumer groups:** we have several (e.g. `workly-notifications`, `workly-email`, `workly-comment-notifications`). **Each group** gets a copy of every message. Within a group, only one consumer instance processes a given message (so no duplicate handling per group).

So the same “comment added” message is delivered to:

- workly-notifications  
- workly-email  
- workly-comment-notifications  

Each group processes it **independently** (and can be different applications or different services later).

---

### Step 4: Comment notification consumer handles the message

**Where:** `IssueCommentNotificationConsumer` in `messaging/consumer/IssueCommentNotificationConsumer.java`.

- **Listens to:** topic `org.events`, group `workly-comment-notifications`.
- **For every message:**
  1. Parse JSON envelope.
  2. **Filter:** if `eventType != "ISSUE_COMMENTED"`, return (do nothing). So this consumer only cares about comments.
  3. **Handle:** `handleIssueCommented(payload)`:
     - Read from payload: author_name, issue_id, issue_title, assignee_id, reporter_id, etc.
     - **Assignee:** if there is an assignee and they are not the author → create a **Notification** for that user: type ISSUE_COMMENTED, message like “Alice commented on issue: Fix login”.
     - **Reporter:** if reporter exists and is not the author and not the assignee → create a Notification for the reporter.
  4. **Save:** `notificationRepository.save(n)` → new rows in `notifications` table.

So the **event** (comment added) has been **consumed** and turned into **notifications** for the right users. The assignee/reporter will see them when they call GET /notifications.

---

### Step 5: (Optional) Invite / email consumers

For **invite** events (ORG_MEMBER_INVITED), the same message on `org.events` is also consumed by:

- **OrgInviteNotificationConsumer:** creates “You were invited to…” notification.
- **OrgInviteEmailConsumer:** sends the invite email.

So **one event, multiple consumers** (multiple groups), each doing one job. That’s the power of event-driven: the “comment API” doesn’t know about notifications or email; it only writes “comment added” to the outbox; the rest is done by consumers.

---

## 5. Picture of the full flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  USER: "Post comment"                                                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  COMMENT API (CommentService.add)                                            │
│    1. Save comment in DB (table: comments)                                  │
│    2. OutboxWriter.enqueueOrgEvent(ISSUE_COMMENTED, payload)                 │
│       → one row in table: outbox_events (status = PENDING)                   │
│  Returns HTTP 200 to user immediately.                                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                    ┌─────────────────┴─────────────────┐
                    │  Same DB                          │  Background (later)
                    │  outbox_events                    │
                    │  row: PENDING                     │
                    └─────────────────┴─────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  OUTBOX POLLER (runs every 1 sec)                                            │
│    1. SELECT * FROM outbox_events WHERE status = 'PENDING' LIMIT 50            │
│    2. For each row: build JSON envelope, then:                               │
│    3. OrgEventProducer.publish("org.events", key, envelope)  →  KAFKA        │
│    4. UPDATE outbox_events SET status = 'PUBLISHED'                          │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  KAFKA  (topic: org.events)                                                  │
│    Message sits here. Delivered to every consumer group that subscribes.     │
└─────────────────────────────────────────────────────────────────────────────┘
                    │                    │                    │
        ┌───────────┴───────────┐       │       ┌────────────┴────────────┐
        ▼                       ▼       ▼       ▼                          ▼
┌───────────────┐     ┌─────────────────────┐     ┌─────────────────────────────┐
│ workly-       │     │ workly-email        │     │ workly-comment-              │
│ notifications │     │ (invite email)      │     │ notifications               │
│ (invite       │     │                     │     │ (comment → notification)    │
│  notification)│     │ Only handles        │     │                             │
│               │     │ ORG_MEMBER_INVITED  │     │ Only handles                │
│ Only handles  │     │                     │     │ ISSUE_COMMENTED             │
│ ORG_MEMBER_   │     │ Sends email.        │     │                             │
│ INVITED       │     └─────────────────────┘     │ Creates Notification rows   │
│               │                                 │ for assignee/reporter.      │
│ Creates       │                                 └─────────────────────────────┘
│ Notification. │
└───────────────┘
```

---

## 6. Same flow for “Invite sent” (to tie it together)

1. **InviteService** (e.g. create invite): saves invite, then **OutboxWriter.enqueueOrgEvent(ORG_MEMBER_INVITED, ...)** → one PENDING row in `outbox_events`.
2. **OutboxPoller** picks it up, builds envelope, **publishes to org.events**, marks row PUBLISHED.
3. **Kafka** has the message.
4. **OrgInviteNotificationConsumer** (group workly-notifications): sees ORG_MEMBER_INVITED → creates “You were invited to X” notification.
5. **OrgInviteEmailConsumer** (group workly-email): sees ORG_MEMBER_INVITED → sends email.

So: **one outbox, one topic, one producer, one poller**; **multiple event types** (ORG_MEMBER_INVITED, ISSUE_COMMENTED); **multiple consumers** each handling the event types they care about.

---

## 7. Important concepts to remember

| Concept | What it means here |
|--------|---------------------|
| **Event** | “Something happened” (e.g. comment added, invite sent). Stored as a row in outbox, then as a message in Kafka. |
| **Outbox table** | Ensures we only publish to Kafka what we’ve already committed in the DB (no “event in Kafka but no comment in DB”). |
| **Topic** | A Kafka log. We use one topic `org.events` for these domain events. Messages are appended and read by consumers. |
| **Producer** | Code that sends messages to Kafka. Here: **OrgEventProducer**; called by **OutboxPoller** (not by the API directly). |
| **Consumer** | Code that reads messages from a topic and does something. Here: **OrgInviteNotificationConsumer**, **OrgInviteEmailConsumer**, **IssueCommentNotificationConsumer**. |
| **Consumer group** | A named group of consumers. Kafka gives each message to one member of each group. Different groups each get a copy. So “workly-notifications” and “workly-comment-notifications” both get the same comment event; one creates invite notifications, the other comment notifications. |
| **Partition key** | When publishing, we send a key (e.g. issue id). Kafka uses it to choose a partition. Same key → same partition → order preserved for that key. |

---

## 8. Where everything lives in the codebase

| Piece | Class / file |
|-------|-------------------|
| Write “event” to outbox (no Kafka yet) | `OutboxWriter.enqueueOrgEvent(...)` — used by `InviteService`, `CommentService` |
| Outbox table | Entity `OutboxEvent`; table `outbox_events` |
| Read outbox and send to Kafka | `OutboxPoller.pollAndPublish()` |
| Build envelope JSON | `OrgEventSerializer.toJsonEnvelope(...)` |
| Send to Kafka | `OrgEventProducer.publish(topic, key, message)` |
| Consume invite → notification | `OrgInviteNotificationConsumer` |
| Consume invite → email | `OrgInviteEmailConsumer` |
| Consume comment → notification | `IssueCommentNotificationConsumer` |
| Notifications stored | Entity `Notification`; table `notifications`; API `GET /notifications` |

---

## 9. How to “master” it from here

1. **Trace one event:** Add a comment in the app, then in the DB check `outbox_events` (PENDING then PUBLISHED), then check `notifications` for the new row. Watch logs for “Publishing outbox event” and consumer logs.
2. **Change something small:** e.g. add a new field to the comment event payload and use it in `IssueCommentNotificationConsumer` to set the notification message.
3. **Add a new reaction:** Add another consumer (new class, new group) that listens to `org.events` and does something else when it sees `ISSUE_COMMENTED` (e.g. log to a file or call an external API). No change to CommentService or OutboxPoller.
4. **Read:** Kafka docs on topics, consumer groups, and partitions; and “Transactional Outbox” pattern.

You now have the full path: **API → Outbox (DB) → Poller → Kafka → Consumers → Notifications (and email).** This is the core of your event-driven notification architecture.
