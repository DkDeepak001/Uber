package com.booking_service.kafka.dto;

import lombok.*;

import java.util.List;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class DriverSearchResponseMessage {
    private Long bookingId;
    private String userId;
    private List<DriverLocationMessage> drivers;
}
