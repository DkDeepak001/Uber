package com.uber.entity.models;

import java.sql.Date;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import lombok.*;

@Entity
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Booking extends  BaseModel{

    @ManyToOne
    @JoinColumn(name = "user_id")
    private Users user;

    @ManyToOne
    @JoinColumn(name = "vehicle_id")
    private Vehicle vehicle;

    @ManyToOne
    @JoinColumn(name = "pickup_location_id", nullable = false)
    private Location pickupLocation;

    @Column(name = "pickup_time",nullable = false)
    private Date pickupTime;

    @Column(name = "dropoff_time",nullable = false)
    private Date dropoffTime;

    @ManyToOne
    @JoinColumn(name = "dropoff_location_id", nullable = false)
    private Location dropoffLocation;

    @Column(name = "booking_status",nullable = false)
    @Builder.Default
    private BookingStatus bookingStatus = BookingStatus.SCHEDULED;

    @Column(name = "price",nullable = false)
    @Builder.Default
    private Double price = 0.0;

    @OneToOne(mappedBy = "booking")
    private Payment payment;

}
