package com.booking_service.service;

import com.booking_service.dto.BookingDetailResponseDto;
import com.booking_service.dto.BookingResponseDto;
import com.booking_service.dto.CreateBookingRequestDto;
import com.booking_service.dto.CreateBookingResponseDto;
import com.booking_service.dto.UpdateBookingRequestDto;
import com.booking_service.kafka.dto.DriverSearchRequestMessage;
import com.booking_service.kafka.producer.DriverSearchProducer;
import com.booking_service.repository.BookingRepository;
import com.booking_service.repository.DriverRepository;
import com.booking_service.repository.LocationRepository;
import com.booking_service.repository.UserRepository;
import com.uber.entity.models.Booking;
import com.uber.entity.models.BookingStatus;
import com.uber.entity.models.Users;
import com.uber.entity.models.Driver;
import com.uber.entity.models.Location;

import java.sql.Date;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@AllArgsConstructor
@Slf4j
public class BookingServiceImpl implements BookingService {

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final DriverRepository driverRepository;
    private final LocationRepository locationRepository;
    private final DriverSearchProducer driverSearchProducer;

    @Override
    public Optional<BookingResponseDto> getBookingById(Long bookingId) {
        Optional<Booking> booking = bookingRepository.findById(bookingId);
        if(booking.isPresent()){
            return Optional.of(BookingResponseDto.from(booking.get()));
        }
        return Optional.empty();
    }

    @Override
    public Optional<BookingDetailResponseDto> getBookingDetail(Long bookingId) {
        Optional<Booking> booking = bookingRepository.findById(bookingId);
        if(booking.isPresent()){
            return Optional.of(BookingDetailResponseDto.from(booking.get()));
        }
        return Optional.empty();
    }

    @Override
    public List<BookingResponseDto> getAllBookingsByUserId(Long userId) {
        List<Booking> bookings = bookingRepository.findAllByUserId(userId);
        return bookings.stream()
                .map(BookingResponseDto::from)
                .collect(Collectors.toList());
    }

    @Override
    public List<BookingResponseDto> getAllBookingsByDriverId(Long driverId) {
        List<Booking> bookings = bookingRepository.findAllByDriverId(driverId);
        return bookings.stream()
                .map(BookingResponseDto::from)
                .collect(Collectors.toList());
    }
    @Override
    @Transactional
    public CreateBookingResponseDto createBooking(CreateBookingRequestDto createBookingRequestDto) {
        try {
            log.debug("Creating booking for userId: {}", createBookingRequestDto.getUserId());
            
            Users user = userRepository.findById(Long.parseLong(createBookingRequestDto.getUserId()))
                .orElseThrow(() -> new RuntimeException("User not found"));
            
            // Placeholder driver - will be updated by Kafka consumer when driver is found
            Driver driver = driverRepository.findById(Long.parseLong("1"))
                .orElseThrow(() -> new RuntimeException("Driver not found"));
            
            // Create and save Location entities first
            Location pickupLocation = Location.builder()
                .latitude(createBookingRequestDto.getPickupLatitude())
                .longitude(createBookingRequestDto.getPickupLongitude())
                .build();
            Location savedPickupLocation = locationRepository.save(pickupLocation);
            
            Location dropoffLocation = Location.builder()
                .latitude(createBookingRequestDto.getDropoffLatitude())
                .longitude(createBookingRequestDto.getDropoffLongitude())
                .build();
            Location savedDropoffLocation = locationRepository.save(dropoffLocation);

            double price = calculatePrice(savedPickupLocation, savedDropoffLocation);
            
            // Create and save booking with persisted locations
            Booking booking = Booking.builder()
                .user(user)
                .driver(driver)
                .pickupLocation(savedPickupLocation)
                .dropoffLocation(savedDropoffLocation)
                .pickupTime(createBookingRequestDto.getPickupTime())
                .dropoffTime(calculateDropoffTime(createBookingRequestDto.getPickupTime()))
                .price(price)
                .bookingStatus(BookingStatus.SCHEDULED)
                .build();
            
            Booking savedBooking = bookingRepository.save(booking);
            log.info("Booking created: id={}, userId={}", savedBooking.getId(), createBookingRequestDto.getUserId());
            
            // Note: Driver search is now handled separately via ride request endpoint
            // This createBooking method is only called after driver accepts
            log.info("Booking created after driver acceptance: bookingId={}, driverId={}", 
                    savedBooking.getId(), savedBooking.getDriver().getId());
            
            return CreateBookingResponseDto.from(savedBooking);
        } catch (Exception e) {
            log.error("Error creating booking for userId: {}", createBookingRequestDto.getUserId(), e);
            throw new RuntimeException("Failed to create booking: " + e.getMessage(), e);
        }
    }
    
    @Override
    @Transactional
    public CreateBookingResponseDto createBookingWithDriver(CreateBookingRequestDto createBookingRequestDto, Long driverId, double price) {
        try {
            log.info("Creating booking with pre-selected driver: userId={}, driverId={}", 
                    createBookingRequestDto.getUserId(), driverId);
            
            Users user = userRepository.findById(Long.parseLong(createBookingRequestDto.getUserId()))
                .orElseThrow(() -> new RuntimeException("User not found"));
            
            Driver driver = driverRepository.findById(driverId)
                .orElseThrow(() -> new RuntimeException("Driver not found"));
            
            // Create and save Location entities first
            Location pickupLocation = Location.builder()
                .latitude(createBookingRequestDto.getPickupLatitude())
                .longitude(createBookingRequestDto.getPickupLongitude())
                .build();
            Location savedPickupLocation = locationRepository.save(pickupLocation);
            
            Location dropoffLocation = Location.builder()
                .latitude(createBookingRequestDto.getDropoffLatitude())
                .longitude(createBookingRequestDto.getDropoffLongitude())
                .build();
            Location savedDropoffLocation = locationRepository.save(dropoffLocation);
            
            // Create and save booking with persisted locations and pre-selected driver
            Booking booking = Booking.builder()
                .user(user)
                .driver(driver)
                .pickupLocation(savedPickupLocation)
                .dropoffLocation(savedDropoffLocation)
                .pickupTime(createBookingRequestDto.getPickupTime() != null ? 
                    createBookingRequestDto.getPickupTime() : 
                    new Date(System.currentTimeMillis()))
                .dropoffTime(calculateDropoffTime(createBookingRequestDto.getPickupTime() != null ? 
                    createBookingRequestDto.getPickupTime() : 
                    new Date(System.currentTimeMillis())))
                .price(price)
                .bookingStatus(BookingStatus.ON_THE_WAY) // Driver accepted, so ON_THE_WAY
                .build();
            
            Booking savedBooking = bookingRepository.save(booking);
            log.info("Booking created with driver: bookingId={}, userId={}, driverId={}", 
                    savedBooking.getId(), createBookingRequestDto.getUserId(), driverId);
            
            return CreateBookingResponseDto.from(savedBooking);
        } catch (Exception e) {
            log.error("Error creating booking with driver for userId: {}, driverId: {}", 
                    createBookingRequestDto.getUserId(), driverId, e);
            throw new RuntimeException("Failed to create booking: " + e.getMessage(), e);
        }
    }
    
    @Override
    public Boolean updateBooking(Long bookingId, UpdateBookingRequestDto updateBookingRequestDto) {
        Booking booking = bookingRepository.findById(bookingId).orElseThrow(() -> new RuntimeException("Booking not found"));
        booking.setBookingStatus(updateBookingRequestDto.getBookingStatus());
        booking.setPickupTime(updateBookingRequestDto.getPickupTime());
        booking.setDropoffTime(updateBookingRequestDto.getDropoffTime());
        booking.setPrice(updateBookingRequestDto.getPrice());
        booking.setDriver(driverRepository.findById(updateBookingRequestDto.getDriverId()).orElseThrow(() -> new RuntimeException("Driver not found")));
        booking.setPickupLocation(Location.builder()
            .latitude(updateBookingRequestDto.getPickupLatitude())
            .longitude(updateBookingRequestDto.getPickupLongitude())
            .build());
        booking.setDropoffLocation(Location.builder()
            .latitude(updateBookingRequestDto.getDropoffLatitude())
            .longitude(updateBookingRequestDto.getDropoffLongitude())
            .build());
        bookingRepository.save(booking);
        return Boolean.TRUE;
    }   

    @Override
    public Boolean deleteBooking(Long bookingId) {
        if (bookingRepository.existsById(bookingId)) {
            bookingRepository.deleteById(bookingId);
            return Boolean.TRUE;
        }
        return Boolean.FALSE;
    }

    private double calculatePrice(Location pickupLocation, Location dropoffLocation) {
        //TODO: calculate price based on distance and time
        return 100.0;
    }

    private Date calculateDropoffTime(Date pickupTime) {
        //TODO: calculate dropoff time based on pickup time and estimated travel duration
        // Adding 1 day as default dropoff time for date-only field
        // Note: If you need time-based calculation, consider using java.sql.Timestamp or LocalDateTime
        return Date.valueOf(pickupTime.toLocalDate().plus(1, ChronoUnit.DAYS));
    }
}

