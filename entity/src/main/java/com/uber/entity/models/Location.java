package com.uber.entity.models;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.OneToOne;
import lombok.*;

@Entity
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Location extends BaseModel {

  @Column(name = "latitude",nullable = false)
  private Double latitude;

  @Column(name = "longitude",nullable = false)
  private Double longitude;

  @OneToOne(mappedBy = "exactLocation")
  private NamedLocation namedLocation;
}
