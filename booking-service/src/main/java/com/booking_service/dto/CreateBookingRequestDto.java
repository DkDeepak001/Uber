package com.booking_service.dto;

import java.sql.Date;

import lombok.*;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CreateBookingRequestDto {
  private String userId;
  //pickupLocation
  private double pickupLatitude;
  private double pickupLongitude;
  //dropoffLocation
  private double dropoffLatitude;
  private double dropoffLongitude;

  private Date pickupTime;
}
