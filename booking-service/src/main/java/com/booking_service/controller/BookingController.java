package com.booking_service.controller;
import com.booking_service.service.BookingService;
import com.booking_service.dto.BookingResponseDto;
import com.booking_service.dto.BookingDetailResponseDto;
import com.booking_service.dto.CreateBookingRequestDto;
import com.booking_service.dto.CreateBookingResponseDto;
import com.booking_service.dto.UpdateBookingRequestDto;

import lombok.AllArgsConstructor;

import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/booking")
@AllArgsConstructor
public class BookingController {

    private BookingService bookingService;

    @GetMapping("/${:bookingId}")
    private  ResponseEntity<BookingResponseDto> getAllBooking(@PathVariable Long bookingId){
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

    @GetMapping("/${:id}")
    private  ResponseEntity<BookingDetailResponseDto> getBookingDetails(@PathVariable Long id){
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

    @PostMapping("/")
    private ResponseEntity<CreateBookingResponseDto> creatBooking(@RequestBody CreateBookingRequestDto createBookingRequestDto){
        try {
            CreateBookingResponseDto createBookingResponseDto = bookingService.createBooking(createBookingRequestDto);
            return new ResponseEntity<>(createBookingResponseDto, HttpStatus.CREATED);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PutMapping("/${:bookingId}")
    private  ResponseEntity<Boolean> updateBooking(@PathVariable Long bookingId, @RequestBody UpdateBookingRequestDto updateBookingRequestDto){
        Boolean updated = bookingService.updateBooking(bookingId, updateBookingRequestDto);
        if(updated){
            return new ResponseEntity<>(HttpStatus.OK);
        }
        return new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }
}
