package com.booking_service.dto;

import com.uber.entity.models.Booking;
import com.uber.entity.models.BookingStatus;

import java.sql.Date;

import lombok.*;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class BookingDetailResponseDto {
  private Long bookingId;
  private Long userId;
  
  private BookingStatus bookingStatus;

  private Double driverLatitude;
  private Double driverLongitude;

  private Date pickupTime;
  private Double price;

  private Double pickupLatitude;
  private Double pickupLongitude;

  private Double dropoffLatitude;
  private Double dropoffLongitude;

  private Date dropoffTime;

  private String driverName;
  private String driverEmail;
  private String driverPhoneNumber;
  private double driverRating;
  private String driverVehicleRegNumber;



  public static BookingDetailResponseDto from(Booking booking){
    return BookingDetailResponseDto.builder()
    .bookingId(booking.getId())
    .userId(booking.getUser().getId())
    .bookingStatus(booking.getBookingStatus())
    .driverLatitude(booking.getDriver().getVehicle().getDriverLocation().getLatitude())
    .driverLongitude(booking.getDriver().getVehicle().getDriverLocation().getLongitude())
    .pickupTime(booking.getPickupTime())
    .price(booking.getPrice())
    .pickupLatitude(booking.getPickupLocation().getLatitude())
    .pickupLongitude(booking.getPickupLocation().getLongitude())
    .dropoffLatitude(booking.getDropoffLocation().getLatitude())
    .dropoffLongitude(booking.getDropoffLocation().getLongitude())
    .dropoffTime(booking.getDropoffTime())
    .driverName(booking.getDriver().getName())
    .driverEmail(booking.getDriver().getEmail())
    .driverPhoneNumber(booking.getDriver().getPhoneNumber())
    .driverRating(booking.getDriver().getRating())
    .driverVehicleRegNumber(booking.getDriver().getVehicle().getRegNumber())
    .build();
  }




}
