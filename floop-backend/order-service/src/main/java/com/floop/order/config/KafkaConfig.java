package com.floop.order.config;

import com.floop.order.event.*;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.core.ConsumerFactory;
import org.springframework.kafka.core.DefaultKafkaConsumerFactory;
import org.springframework.kafka.support.serializer.JsonDeserializer;

import java.util.HashMap;
import java.util.Map;

@Configuration
public class KafkaConfig {

    @Value("${spring.kafka.bootstrap-servers}")
    private String bootstrapServers;

    private Map<String, Object> baseConfig() {
        Map<String, Object> props = new HashMap<>();
        props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        props.put(ConsumerConfig.GROUP_ID_CONFIG, "order-service-group");
        props.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");
        props.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        return props;
    }

    // --- PaymentResultEvent ---
    @Bean
    public ConsumerFactory<String, PaymentResultEvent> paymentConsumerFactory() {
        JsonDeserializer<PaymentResultEvent> deserializer =
                new JsonDeserializer<>(PaymentResultEvent.class, false);
        deserializer.addTrustedPackages("*");
        return new DefaultKafkaConsumerFactory<>(baseConfig(),
                new StringDeserializer(), deserializer);
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, PaymentResultEvent>
    paymentKafkaListenerContainerFactory() {
        ConcurrentKafkaListenerContainerFactory<String, PaymentResultEvent> factory =
                new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(paymentConsumerFactory());
        return factory;
    }

    // --- ProductCreatedEvent ---
    @Bean
    public ConsumerFactory<String, ProductCreatedEvent> productCreatedConsumerFactory() {
        JsonDeserializer<ProductCreatedEvent> deserializer =
                new JsonDeserializer<>(ProductCreatedEvent.class, false);
        deserializer.addTrustedPackages("*");
        return new DefaultKafkaConsumerFactory<>(baseConfig(),
                new StringDeserializer(), deserializer);
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, ProductCreatedEvent>
    productCreatedKafkaListenerContainerFactory() {
        ConcurrentKafkaListenerContainerFactory<String, ProductCreatedEvent> factory =
                new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(productCreatedConsumerFactory());
        return factory;
    }

    // --- ProductUpdatedEvent ---
    @Bean
    public ConsumerFactory<String, ProductUpdatedEvent> productUpdatedConsumerFactory() {
        JsonDeserializer<ProductUpdatedEvent> deserializer =
                new JsonDeserializer<>(ProductUpdatedEvent.class, false);
        deserializer.addTrustedPackages("*");
        return new DefaultKafkaConsumerFactory<>(baseConfig(),
                new StringDeserializer(), deserializer);
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, ProductUpdatedEvent>
    productUpdatedKafkaListenerContainerFactory() {
        ConcurrentKafkaListenerContainerFactory<String, ProductUpdatedEvent> factory =
                new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(productUpdatedConsumerFactory());
        return factory;
    }

    // --- ProductDeletedEvent ---
    @Bean
    public ConsumerFactory<String, ProductDeletedEvent> productDeletedConsumerFactory() {
        JsonDeserializer<ProductDeletedEvent> deserializer =
                new JsonDeserializer<>(ProductDeletedEvent.class, false);
        deserializer.addTrustedPackages("*");
        return new DefaultKafkaConsumerFactory<>(baseConfig(),
                new StringDeserializer(), deserializer);
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, ProductDeletedEvent>
    productDeletedKafkaListenerContainerFactory() {
        ConcurrentKafkaListenerContainerFactory<String, ProductDeletedEvent> factory =
                new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(productDeletedConsumerFactory());
        return factory;
    }
}