package com.realty_app.recommendation_service.config;

import com.realty_app.recommendation_service.dto.ApplicationCreatedEvent;
import com.realty_app.recommendation_service.dto.ReviewEvent;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.core.DefaultKafkaConsumerFactory;
import org.springframework.kafka.support.serializer.JsonDeserializer;

import java.util.HashMap;
import java.util.Map;

@Configuration
public class KafkaConsumerConfig {

    @Value("${spring.kafka.bootstrap-servers}")
    private String bootstrapServers;

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, ApplicationCreatedEvent>
    applicationCreatedKafkaListenerContainerFactory() {

        JsonDeserializer<ApplicationCreatedEvent> deserializer =
                new JsonDeserializer<>(ApplicationCreatedEvent.class);

        deserializer.addTrustedPackages("*");
        deserializer.setUseTypeHeaders(false);

        Map<String, Object> props = baseConsumerProps();

        DefaultKafkaConsumerFactory<String, ApplicationCreatedEvent> consumerFactory =
                new DefaultKafkaConsumerFactory<>(
                        props,
                        new StringDeserializer(),
                        deserializer
                );

        ConcurrentKafkaListenerContainerFactory<String, ApplicationCreatedEvent> factory =
                new ConcurrentKafkaListenerContainerFactory<>();

        factory.setConsumerFactory(consumerFactory);

        return factory;
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, ReviewEvent>
    reviewEventKafkaListenerContainerFactory() {

        JsonDeserializer<ReviewEvent> deserializer =
                new JsonDeserializer<>(ReviewEvent.class);

        deserializer.addTrustedPackages("*");
        deserializer.setUseTypeHeaders(false);

        Map<String, Object> props = baseConsumerProps();

        DefaultKafkaConsumerFactory<String, ReviewEvent> consumerFactory =
                new DefaultKafkaConsumerFactory<>(
                        props,
                        new StringDeserializer(),
                        deserializer
                );

        ConcurrentKafkaListenerContainerFactory<String, ReviewEvent> factory =
                new ConcurrentKafkaListenerContainerFactory<>();

        factory.setConsumerFactory(consumerFactory);

        return factory;
    }

    private Map<String, Object> baseConsumerProps() {
        Map<String, Object> props = new HashMap<>();
        props.put("bootstrap.servers", bootstrapServers);
        props.put("group.id", "recommendation-service");
        props.put("auto.offset.reset", "earliest");
        return props;
    }
}
