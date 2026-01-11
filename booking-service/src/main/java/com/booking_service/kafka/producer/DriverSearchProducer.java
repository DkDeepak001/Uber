package com.booking_service.kafka.producer;

import com.booking_service.kafka.dto.DriverSearchRequestMessage;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

@Component
@Slf4j
public class DriverSearchProducer {

    private final KafkaTemplate<String, DriverSearchRequestMessage> kafkaTemplate;
    
    @Value("${kafka.topic.driver-search-request}")
    private String driverSearchRequestTopic;

    public DriverSearchProducer(KafkaTemplate<String, DriverSearchRequestMessage> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public void sendDriverSearchRequest(DriverSearchRequestMessage message) {
        // Allow either bookingId or requestId to be present
        if (message.getBookingId() == null && message.getRequestId() == null) {
            throw new IllegalArgumentException("Either bookingId or requestId must be provided when sending driver search request");
        }
        
        String identifier = message.getRequestId() != null ? message.getRequestId() : 
                           (message.getBookingId() != null ? "bookingId:" + message.getBookingId() : "unknown");
        String kafkaKey = message.getRequestId() != null ? message.getRequestId() : 
                         (message.getBookingId() != null ? message.getBookingId().toString() : "unknown");
        
        try {
            log.debug("Sending driver search request for {} to topic: {}", identifier, driverSearchRequestTopic);
            var future = kafkaTemplate.send(driverSearchRequestTopic, kafkaKey, message);
            var result = future.get(10, TimeUnit.SECONDS); // Wait up to 10 seconds
            log.debug("Successfully sent driver search request for {}", identifier);
        } catch (InterruptedException | ExecutionException | TimeoutException e) {
            log.error("Exception while sending driver search request for {}", identifier, e);
            throw new RuntimeException("Failed to send driver search request", e);
        } catch (Exception e) {
            log.error("Unexpected exception while sending driver search request for {}", identifier, e);
            throw e;
        }
    }
}
