package com.booking_service.kafka.consumer;

import com.booking_service.kafka.dto.DriverLocationMessage;
import com.booking_service.kafka.dto.DriverSearchResponseMessage;
import com.booking_service.repository.BookingRepository;
import com.booking_service.repository.DriverRepository;
import com.uber.entity.models.Booking;
import com.uber.entity.models.BookingStatus;
import com.uber.entity.models.Driver;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
@AllArgsConstructor
@Slf4j
public class DriverSearchResponseConsumer {

    private final BookingRepository bookingRepository;
    private final DriverRepository driverRepository;

    @KafkaListener(topics = "${kafka.topic.driver-search-response}", groupId = "${spring.kafka.consumer.group-id}", containerFactory = "kafkaListenerContainerFactory")
    public void consumeDriverSearchResponse(DriverSearchResponseMessage message) {
        log.info("Received driver search response for bookingId: {}", message.getBookingId());
        
        Optional<Booking> bookingOptional = bookingRepository.findById(message.getBookingId());
        if (bookingOptional.isEmpty()) {
            log.error("Booking not found for bookingId: {}", message.getBookingId());
            return;
        }
        
        Booking booking = bookingOptional.get();
        List<DriverLocationMessage> drivers = message.getDrivers();
        
        if (drivers == null || drivers.isEmpty()) {
            log.warn("No drivers found for bookingId: {}", message.getBookingId());
            booking.setBookingStatus(BookingStatus.CANCELLED);
            bookingRepository.save(booking);
            return;
        }
        
        // Select the first available driver
        DriverLocationMessage selectedDriver = drivers.get(0);
        log.info("Selected driver {} for bookingId: {}", selectedDriver.getDriverId(), message.getBookingId());
        
        // Update booking with the selected driver
        Optional<Driver> driverOptional = driverRepository.findById(Long.parseLong(selectedDriver.getDriverId()));
        if (driverOptional.isEmpty()) {
            log.error("Driver not found in database: {}", selectedDriver.getDriverId());
            booking.setBookingStatus(BookingStatus.CANCELLED);
            bookingRepository.save(booking);
            return;
        }
        
        booking.setDriver(driverOptional.get());
        booking.setBookingStatus(BookingStatus.ON_THE_WAY);
        bookingRepository.save(booking);
        
        log.info("Booking {} confirmed with driver {}", message.getBookingId(), selectedDriver.getDriverId());
    }
}
