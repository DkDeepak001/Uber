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
        if (message.getBookingId() == null) {
            throw new IllegalArgumentException("BookingId cannot be null when sending driver search request");
        }
        try {
            log.info("Sending driver search request for bookingId: {} to topic: {}", message.getBookingId(), driverSearchRequestTopic);
            var future = kafkaTemplate.send(driverSearchRequestTopic, message.getBookingId().toString(), message);
            log.info("Kafka send initiated for bookingId: {}, waiting for result...", message.getBookingId());
            var result = future.get(10, TimeUnit.SECONDS); // Wait up to 10 seconds
            log.info("Successfully sent driver search request for bookingId: {} to partition: {}, offset: {}", 
                message.getBookingId(), result.getRecordMetadata().partition(), result.getRecordMetadata().offset());
        } catch (InterruptedException | ExecutionException | TimeoutException e) {
            log.error("Exception while sending driver search request for bookingId: {}", message.getBookingId(), e);
            throw new RuntimeException("Failed to send driver search request", e);
        } catch (Exception e) {
            log.error("Unexpected exception while sending driver search request for bookingId: {}", message.getBookingId(), e);
            throw e;
        }
    }
}
