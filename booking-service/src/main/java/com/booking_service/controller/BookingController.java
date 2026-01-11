package com.booking_service.controller;
import com.booking_service.service.BookingService;
import com.booking_service.service.RideRequestService;
import com.booking_service.dto.BookingResponseDto;
import com.booking_service.dto.BookingDetailResponseDto;
import com.booking_service.dto.CreateBookingRequestDto;
import com.booking_service.dto.CreateBookingResponseDto;
import com.booking_service.dto.RideRequestResponseDto;
import com.booking_service.dto.UpdateBookingRequestDto;

import lombok.AllArgsConstructor;

import java.util.List;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/booking")
@AllArgsConstructor
public class BookingController {

    private BookingService bookingService;
    private RideRequestService rideRequestService;

    @GetMapping("/{bookingId}")
    public ResponseEntity<BookingResponseDto> getBookingById(@PathVariable Long bookingId){
        try {
            Optional<BookingResponseDto> booking = bookingService.getBookingById(bookingId);
            if(booking.isPresent()){
                return new ResponseEntity<>(booking.get(), HttpStatus.OK);
            }
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/{id}/details")
    public ResponseEntity<BookingDetailResponseDto> getBookingDetails(@PathVariable Long id){
        try {
        Optional<BookingDetailResponseDto> booking = bookingService.getBookingDetail(id);
        if(booking.isPresent()){
                return new ResponseEntity<>(booking.get(), HttpStatus.OK);
            }
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<BookingResponseDto>> getAllBookingsByUserId(@PathVariable Long userId) {
        try {
            List<BookingResponseDto> bookings = bookingService.getAllBookingsByUserId(userId);
            return new ResponseEntity<>(bookings, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/driver/{driverId}")
    public ResponseEntity<List<BookingResponseDto>> getAllBookingsByDriverId(@PathVariable Long driverId) {
        try {
            List<BookingResponseDto> bookings = bookingService.getAllBookingsByDriverId(driverId);
            return new ResponseEntity<>(bookings, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping("/")
    @Deprecated
    public ResponseEntity<?> createBooking(@RequestBody CreateBookingRequestDto createBookingRequestDto){
        // DEPRECATED: This endpoint creates booking directly with auto-selected driver
        // Use POST /api/v1/booking/ride-request instead for the new flow where drivers must accept
        // For backward compatibility, redirecting to new flow
        try {
            RideRequestResponseDto response = rideRequestService.initiateRideRequest(createBookingRequestDto);
            return ResponseEntity.status(HttpStatus.ACCEPTED)
                    .body("This endpoint is deprecated. Use POST /api/v1/booking/ride-request instead. " +
                          "Ride request initiated with requestId: " + response.getRequestId());
        } catch (Exception e) {
            return new ResponseEntity<>("Error: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping("/ride-request")
    public ResponseEntity<RideRequestResponseDto> requestRide(
            @RequestBody CreateBookingRequestDto createBookingRequestDto) {
        try {
            RideRequestResponseDto response = rideRequestService.initiateRideRequest(createBookingRequestDto);
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/ride-request/{requestId}")
    public ResponseEntity<RideRequestResponseDto> getRideRequestStatus(@PathVariable String requestId) {
        try {
            RideRequestResponseDto response = rideRequestService.getRideRequestStatus(requestId);
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PutMapping("/{bookingId}")
    public ResponseEntity<Boolean> updateBooking(@PathVariable Long bookingId, @RequestBody UpdateBookingRequestDto updateBookingRequestDto) {
        try {
            Boolean updated = bookingService.updateBooking(bookingId, updateBookingRequestDto);
            if (updated) {
                return new ResponseEntity<>(HttpStatus.OK);
            }
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @DeleteMapping("/{bookingId}")
    public ResponseEntity<Boolean> deleteBooking(@PathVariable Long bookingId) {
        try {
            Boolean deleted = bookingService.deleteBooking(bookingId);
            if (deleted) {
                return new ResponseEntity<>(HttpStatus.OK);
            }
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
