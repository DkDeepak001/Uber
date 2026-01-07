package com.booking_service.service;

import com.booking_service.dto.BookingDetailResponseDto;
import com.booking_service.dto.BookingResponseDto;
import com.booking_service.dto.CreateBookingRequestDto;
import com.booking_service.dto.CreateBookingResponseDto;
import com.booking_service.dto.UpdateBookingRequestDto;
import com.booking_service.repository.BookingRepository;
import com.booking_service.repository.DriverRepository;
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

import lombok.AllArgsConstructor;

@Service
@AllArgsConstructor
public class BookingServiceImpl implements BookingService {

    private BookingRepository bookingRepository;
    private UserRepository userRepository;
    private DriverRepository driverRepository;

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
    public CreateBookingResponseDto createBooking(CreateBookingRequestDto createBookingRequestDto) {
        Users user = userRepository.findById(Long.parseLong(createBookingRequestDto.getUserId())).orElseThrow(() -> new RuntimeException("User not found"));
        //TODO:fetch driver from location service
        Driver driver = driverRepository.findById(Long.parseLong("1")).orElseThrow(() -> new RuntimeException("Driver not found"));
        Location pickupLocation = Location.builder()
            .latitude(createBookingRequestDto.getPickupLatitude())
            .longitude(createBookingRequestDto.getPickupLongitude())
            .build();
        Location dropoffLocation = Location.builder()
            .latitude(createBookingRequestDto.getDropoffLatitude())
            .longitude(createBookingRequestDto.getDropoffLongitude())
            .build();

        double price = calculatePrice(pickupLocation, dropoffLocation);
        
        Booking booking = Booking.builder()
            .user(user)
            .driver(driver)
            .pickupLocation(pickupLocation)
            .dropoffLocation(dropoffLocation)
            .pickupTime(createBookingRequestDto.getPickupTime())
            .dropoffTime(calculateDropoffTime(createBookingRequestDto.getPickupTime()))
            .price(price)
            .bookingStatus(BookingStatus.SCHEDULED)
            .build();
        return CreateBookingResponseDto.from(bookingRepository.save(booking));
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
        //TODO: calculate dropoff time based on pickup time
        return Date.valueOf(pickupTime.toLocalDate().plus(1, ChronoUnit.HOURS));
    }
}

