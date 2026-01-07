package com.booking_service.dto;

import java.sql.Date;

import com.uber.entity.models.Booking;
import com.uber.entity.models.BookingStatus;

import lombok.*;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class BookingResponseDto {
  private Long bookingId;
  private Long userId;

  private BookingStatus bookingStatus;

  private Double driverLatitude;
  private Double driverLongitude;

  private Date pickupTime;

  private Double price;

  public static BookingResponseDto from(Booking booking){
    return BookingResponseDto.builder()
    .bookingId(booking.getId())
    .userId(booking.getUser().getId())
    .bookingStatus(booking.getBookingStatus())
    .driverLatitude(booking.getDriver().getVehicle().getDriverLocation().getLatitude())
    .driverLongitude(booking.getDriver().getVehicle().getDriverLocation().getLongitude())
    .pickupTime(booking.getPickupTime())
    .price(booking.getPrice())
    .build();
  }
}
