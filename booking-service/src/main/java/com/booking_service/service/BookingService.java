package com.booking_service.service;

import java.util.Optional;

import com.booking_service.dto.BookingDetailResponseDto;
import com.booking_service.dto.BookingResponseDto;
import com.booking_service.dto.CreateBookingRequestDto;
import com.booking_service.dto.CreateBookingResponseDto;
import com.booking_service.dto.UpdateBookingRequestDto;

public interface BookingService {

    public CreateBookingResponseDto createBooking(CreateBookingRequestDto createBookingRequestDto);
    public Optional<BookingResponseDto> getBookingById(Long bookingId);
    public Optional<BookingDetailResponseDto> getBookingDetail(Long bookingId);
    public Boolean updateBooking(Long bookingId, UpdateBookingRequestDto updateBookingRequestDto);
}
