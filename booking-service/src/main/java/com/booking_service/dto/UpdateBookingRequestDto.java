package com.booking_service.dto;

import java.sql.Date;
import com.uber.entity.models.BookingStatus;

import lombok.*;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UpdateBookingRequestDto {
  private BookingStatus bookingStatus;
  private Date pickupTime;
  private Date dropoffTime;
  private Double price;
  private Long driverId;
  private double pickupLatitude;
  private double pickupLongitude;
  private double dropoffLatitude;
  private double dropoffLongitude;
}
