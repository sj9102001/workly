package com.sj.Workly.config;

import org.apache.kafka.clients.admin.AdminClientConfig;
import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.core.KafkaAdmin;

import java.util.HashMap;
import java.util.Map;

@Configuration
@ConditionalOnProperty(name = "app.kafka.enabled", havingValue = "true")
public class KafkaTopicConfig {

    @Value("${spring.kafka.bootstrap-servers}")
    private String bootstrapServers;

    @Value("${app.kafka.topics.org-events:org.events}")
    private String orgEventsTopic;

    @Value("${app.kafka.topics.partitions:3}")
    private int partitions;

    @Value("${app.kafka.topics.replication-factor:1}")
    private short replicationFactor;

    @Bean
    public KafkaAdmin kafkaAdmin() {
        Map<String, Object> config = new HashMap<>();
        config.put(AdminClientConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        return new KafkaAdmin(config);
    }

    /**
     * Auto creates org.events topic if not exists.
     * Works only if broker allows topic creation.
     */
    @Bean
    public NewTopic orgEventsTopic() {
        return new NewTopic(orgEventsTopic, partitions, replicationFactor);
    }
}
