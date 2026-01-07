package com.booking_service.dto;

import com.uber.entity.models.Booking;
import com.uber.entity.models.BookingStatus;
import lombok.*;

import java.util.Date;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CreateBookingResponseDto {
  private Long bookingId;
  private Long userId;
  private Long driverId;
  private String dirverName;

  private double driverLatitude;
  private double driverLongitude;
  
  private Date pickupTime;
  
  
  private double price;

  private BookingStatus status;
  

  public static CreateBookingResponseDto from(Booking booking) {
    return CreateBookingResponseDto.builder()
        .bookingId(booking.getId())
        .userId(booking.getUser().getId())
        .driverId(booking.getDriver().getId())
        .dirverName(booking.getDriver().getName())
        .driverLatitude(booking.getDriver().getLocation().getLatitude())
        .driverLongitude(booking.getDriver().getLocation().getLongitude())
        .pickupTime(booking.getPickupTime())
        .price(booking.getPrice())
        .status(booking.getBookingStatus())
        .build();
  }
}

