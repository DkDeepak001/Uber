package com.booking_service.controller;

import com.booking_service.service.BookingService;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/booking")
@AllArgsConstructor
public class BookingController {

    private BookingService bookingService;

    @GetMapping("/")
    private  ResponseEntity<?> getAllBooking(){
        return new ResponseEntity<>("Booked", HttpStatus.OK);
    }

    @GetMapping("/${:id}")
    private  ResponseEntity<?> getBookingDetails(@PathVariable Integer id){
        System.out.println("id");
        return new ResponseEntity<>("Booked", HttpStatus.OK);
    }

    @PostMapping("/")
    private ResponseEntity<?> creatBooking(){
        return new ResponseEntity<>("Booked", HttpStatus.CREATED);
    }

    @PutMapping("/")
    private  ResponseEntity<?> updateBooking(){
        return new ResponseEntity<>("Updated", HttpStatus.OK);
    }

}
