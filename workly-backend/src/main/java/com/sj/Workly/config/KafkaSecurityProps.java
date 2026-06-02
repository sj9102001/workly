package com.sj.Workly.config;

import org.apache.kafka.clients.CommonClientConfigs;
import org.apache.kafka.common.config.SaslConfigs;
import org.apache.kafka.common.config.SslConfigs;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.Map;

/**
 * Applies Kafka security settings (SASL/SSL) from environment variables onto a
 * client property map. Settings are only applied when explicitly provided, so
 * the default local PLAINTEXT setup (e.g. the bundled docker-compose broker)
 * keeps working without any extra configuration.
 *
 * <p>This is what lets users swap in a managed/cloud broker (Confluent Cloud,
 * Amazon MSK, Aiven, Redpanda Cloud, ...) without code changes — they just set
 * the relevant environment variables.
 *
 * <p>Supported variables:
 * <ul>
 *   <li>{@code KAFKA_SECURITY_PROTOCOL} — e.g. SASL_SSL, SSL, SASL_PLAINTEXT, PLAINTEXT</li>
 *   <li>{@code KAFKA_SASL_MECHANISM} — e.g. PLAIN, SCRAM-SHA-256, SCRAM-SHA-512</li>
 *   <li>{@code KAFKA_SASL_JAAS_CONFIG} — full JAAS line (contains the credentials)</li>
 *   <li>{@code KAFKA_SSL_TRUSTSTORE_LOCATION} / {@code KAFKA_SSL_TRUSTSTORE_PASSWORD} — optional custom truststore</li>
 * </ul>
 */
@Component
public class KafkaSecurityProps {

    @Value("${app.kafka.security.protocol:}")
    private String securityProtocol;

    @Value("${app.kafka.security.sasl-mechanism:}")
    private String saslMechanism;

    @Value("${app.kafka.security.sasl-jaas-config:}")
    private String saslJaasConfig;

    @Value("${app.kafka.security.ssl-truststore-location:}")
    private String sslTruststoreLocation;

    @Value("${app.kafka.security.ssl-truststore-password:}")
    private String sslTruststorePassword;

    /**
     * Mutates {@code props} in place, adding any security settings that have
     * been configured. No-op when nothing is set (local PLAINTEXT default).
     */
    public void apply(Map<String, Object> props) {
        if (StringUtils.hasText(securityProtocol)) {
            props.put(CommonClientConfigs.SECURITY_PROTOCOL_CONFIG, securityProtocol.trim());
        }
        if (StringUtils.hasText(saslMechanism)) {
            props.put(SaslConfigs.SASL_MECHANISM, saslMechanism.trim());
        }
        if (StringUtils.hasText(saslJaasConfig)) {
            props.put(SaslConfigs.SASL_JAAS_CONFIG, saslJaasConfig.trim());
        }
        if (StringUtils.hasText(sslTruststoreLocation)) {
            props.put(SslConfigs.SSL_TRUSTSTORE_LOCATION_CONFIG, sslTruststoreLocation.trim());
        }
        if (StringUtils.hasText(sslTruststorePassword)) {
            props.put(SslConfigs.SSL_TRUSTSTORE_PASSWORD_CONFIG, sslTruststorePassword.trim());
        }
    }
}
