package com.uber.entity.models;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.*;

@Entity
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Vehicle extends BaseModel{

    @Column(name = "reg_number",nullable = false,unique = true)
    private String regNumber;

    @Enumerated(EnumType.ORDINAL)
    private CarBrand brand;

    @Column(name = "model",nullable = false)
    private String model;

    @Column(name = "make_year",nullable = false)
    private String makeYear;

    @Enumerated(EnumType.ORDINAL)
    private CarColor Color;

    @Enumerated(EnumType.ORDINAL)
    private CarType carType;

    @Column(name = "is_available",nullable = false)
    private Boolean isAvailable;
}
