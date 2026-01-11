package com.uber.location_service.location_service.kafka.producer;

import com.uber.location_service.location_service.kafka.dto.DriverSearchResponseMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import java.util.concurrent.CompletableFuture;

@Component
@Slf4j
public class DriverSearchResponseProducer {

    private final KafkaTemplate<String, DriverSearchResponseMessage> kafkaTemplate;
    
    @Value("${kafka.topic.driver-search-response}")
    private String driverSearchResponseTopic;

    public DriverSearchResponseProducer(KafkaTemplate<String, DriverSearchResponseMessage> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public void sendDriverSearchResponse(DriverSearchResponseMessage message) {
        if (message.getBookingId() == null) {
            log.error("BookingId cannot be null when sending driver search response");
            throw new IllegalArgumentException("BookingId cannot be null when sending driver search response");
        }
        try {
            log.debug("Sending driver search response for bookingId: {}", message.getBookingId());
            kafkaTemplate.send(driverSearchResponseTopic, message.getBookingId().toString(), message)
                .whenComplete((result, ex) -> {
                    if (ex == null) {
                        log.debug("Successfully sent driver search response for bookingId: {}", message.getBookingId());
                    } else {
                        log.error("Failed to send driver search response for bookingId: {}", message.getBookingId(), ex);
                    }
                });
        } catch (Exception e) {
            log.error("Exception while sending driver search response for bookingId: {}", message.getBookingId(), e);
            throw new RuntimeException("Failed to send driver search response", e);
        }
    }
}
