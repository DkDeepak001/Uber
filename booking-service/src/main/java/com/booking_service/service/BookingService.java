package com.booking_service.service;

import java.util.List;
import java.util.Optional;

import com.booking_service.dto.BookingDetailResponseDto;
import com.booking_service.dto.BookingResponseDto;
import com.booking_service.dto.CreateBookingRequestDto;
import com.booking_service.dto.CreateBookingResponseDto;
import com.booking_service.dto.UpdateBookingRequestDto;

public interface BookingService {

    CreateBookingResponseDto createBooking(CreateBookingRequestDto createBookingRequestDto);
    Optional<BookingResponseDto> getBookingById(Long bookingId);
    Optional<BookingDetailResponseDto> getBookingDetail(Long bookingId);
    List<BookingResponseDto> getAllBookingsByUserId(Long userId);
    List<BookingResponseDto> getAllBookingsByDriverId(Long driverId);
    Boolean updateBooking(Long bookingId, UpdateBookingRequestDto updateBookingRequestDto);
    Boolean deleteBooking(Long bookingId);
}
