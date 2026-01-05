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
public class Review extends BaseModel {
  
  @OneToOne
  @JoinColumn(name = "booking_id",nullable = false)
  private Booking booking;

  @Column(name = "rating",nullable = false)
  private int rating;

  @Column(name = "comment",nullable = false)
  private String comment;
}
