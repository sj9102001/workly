package com.sj.Workly.messaging.producer;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name="app.kafka.enabled", havingValue="true")
public class OrgEventProducer {

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final String orgEventsTopic;

    public OrgEventProducer(KafkaTemplate<String, String> kafkaTemplate,
                            @Value("${app.kafka.topics.org-events}") String orgEventsTopic) {
        this.kafkaTemplate = kafkaTemplate;
        this.orgEventsTopic = orgEventsTopic;
    }

    public void publish(String key, String messageJson) {
        // kafkaTemplate.send(orgEventsTopic, key, messageJson);
    }
}

