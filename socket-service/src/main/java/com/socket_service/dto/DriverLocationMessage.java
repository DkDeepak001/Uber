package com.socket_service.dto;

import lombok.*;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class DriverLocationMessage {
    private String driverId;
    private double latitude;
    private double longitude;
}
