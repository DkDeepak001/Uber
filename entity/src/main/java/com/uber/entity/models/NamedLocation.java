package com.uber.entity.models;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import lombok.*;
@Entity
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class NamedLocation extends BaseModel {
  @OneToOne
  @JoinColumn(name = "location_id", nullable = true)
  private Location exactLocation;

  @Column(name = "name",nullable = false)
  private String name;

  @Column(name = "address",nullable = false)
  private String address;

  @Column(name = "city",nullable = false)
  private String city;

  @Column(name = "state",nullable = false)
  private String state;

  @Column(name = "country",nullable = false)
  private String country;

  @Column(name = "postal_code",nullable = false)
  private String postalCode;

}
