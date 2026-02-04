package com.sj.Workly.messaging.consumer.handlers;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sj.Workly.entity.Notification;
import com.sj.Workly.entity.User;
import com.sj.Workly.entity.enums.OrgEventType;
import com.sj.Workly.messaging.consumer.NotificationEventHandler;
import com.sj.Workly.repository.ProjectMemberRepository;
import com.sj.Workly.repository.UserRepository;
import com.sj.Workly.service.NotificationFromEventService;
import org.springframework.stereotype.Component;

@Component
public class CommentNotificationHandler implements NotificationEventHandler {

    private final ObjectMapper objectMapper;
    private final UserRepository userRepository;
    private final NotificationFromEventService notificationFromEventService;
    private final ProjectMemberRepository projectMemberRepository;

    public CommentNotificationHandler(ObjectMapper objectMapper,
                                      UserRepository userRepository,
                                      NotificationFromEventService notificationFromEventService,
                                      ProjectMemberRepository projectMemberRepository) {
        this.objectMapper = objectMapper;
        this.userRepository = userRepository;
        this.notificationFromEventService = notificationFromEventService;
        this.projectMemberRepository = projectMemberRepository;
    }

    @Override
    public OrgEventType getEventType() {
        return OrgEventType.ISSUE_COMMENTED;
    }

    @Override
    public void handle(JsonNode payload) {
        if (payload == null || payload.isMissingNode() || payload.isNull()) return;

        long authorId = payload.path("author_id").asLong(-1);
        String authorName = payload.path("author_name").asText("Someone");
        long issueId = payload.path("issue_id").asLong(-1);
        long projectId = payload.path("project_id").asLong(-1);
        String issueTitle = payload.path("issue_title").asText("an issue");
        long commentId = payload.path("comment_id").asLong(-1);

        // Notify assignee (if any, not the author, and part of the project)
        if (payload.has("assignee_id")) {
            long assigneeId = payload.path("assignee_id").asLong(-1);
            if (assigneeId > 0 && assigneeId != authorId) {
                userRepository.findById(assigneeId).ifPresent(user -> {
                    if (isProjectMember(projectId, user.getId())) {
                        createNotification(user, authorName, issueId, projectId, issueTitle, commentId);
                    }
                });
            }
        }

        // Notify reporter (if not author, not same as assignee, and part of the project)
        if (payload.has("reporter_id")) {
            long reporterId = payload.path("reporter_id").asLong(-1);
            long assigneeId = payload.has("assignee_id") ? payload.path("assignee_id").asLong(-1) : -1;
            if (reporterId > 0 && reporterId != authorId && reporterId != assigneeId) {
                userRepository.findById(reporterId).ifPresent(user -> {
                    if (isProjectMember(projectId, user.getId())) {
                        createNotification(user, authorName, issueId, projectId, issueTitle, commentId);
                    }
                });
            }
        }
    }

    private boolean isProjectMember(long projectId, Long userId) {
        return projectId > 0 && userId != null && projectMemberRepository.existsByProjectIdAndUserId(projectId, userId);
    }

    private void createNotification(User user, String authorName,
                                    long issueId, long projectId, String issueTitle, long commentId) {
        String message = String.format("%s commented on issue: %s", authorName, issueTitle);
        String actionPayloadJson = null;
        try {
            var actionPayload = objectMapper.createObjectNode();
            actionPayload.put("issueId", issueId);
            actionPayload.put("projectId", projectId);
            actionPayload.put("commentId", commentId);
            actionPayload.put("issueTitle", issueTitle);
            actionPayload.put("issueUrl", "/issues/" + issueId);
            actionPayloadJson = objectMapper.writeValueAsString(actionPayload);
        } catch (Exception e) {
            // leave null
        }
        notificationFromEventService.createAndSave(
                user,
                Notification.Type.ISSUE_COMMENTED,
                message,
                "ISSUE_COMMENT",
                actionPayloadJson
        );
    }
}
