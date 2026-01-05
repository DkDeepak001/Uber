package com.uber.entity.models;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import lombok.*;
@Entity
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Driver extends  BaseModel{

    @Column(name = "name",nullable = false)
    private String name;

    @Column(name = "email",nullable = false,unique = true)
    private String email;

    @Column(name = "phone_number",nullable = false,unique = true)
    private String phoneNumber;


    @Column(name = "rating")
    @DecimalMin(value = "0.00", message = "Rating must be grater than or equal to 0.00")
    @DecimalMax(value = "5.00" ,message = "Rating must be less than 5")
    private double rating;

    @ManyToOne
    @JoinColumn(name = "vehicle_id")
    private Vehicle vehicle;

    @Column(name = "is_available",nullable = false)
    private Boolean isAvailable;
}
