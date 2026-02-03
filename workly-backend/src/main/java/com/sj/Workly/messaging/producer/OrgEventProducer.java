package com.sj.Workly.messaging.producer;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Component;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

@Component
@ConditionalOnProperty(name="app.kafka.enabled", havingValue="true")
public class OrgEventProducer {

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final String orgEventsTopic;

    @Value("${app.kafka.producer.send-timeout-seconds:30}")
    private int sendTimeoutSeconds;

    public OrgEventProducer(KafkaTemplate<String, String> kafkaTemplate,
                            @Value("${app.kafka.topics.org-events:org.events}") String orgEventsTopic) {
        this.kafkaTemplate = kafkaTemplate;
        this.orgEventsTopic = orgEventsTopic;
    }

    public void publish(String key, String messageJson) throws ExecutionException, InterruptedException, TimeoutException {
        // Send synchronously and wait for confirmation
        // This ensures we only mark events as PUBLISHED after Kafka confirms receipt
        CompletableFuture<SendResult<String, String>> future = kafkaTemplate.send(orgEventsTopic, key, messageJson);
        
        // Wait for the send to complete (with timeout)
        // This will throw an exception if the send fails, which will be caught by the poller
        future.get(sendTimeoutSeconds, TimeUnit.SECONDS);
    }
}

