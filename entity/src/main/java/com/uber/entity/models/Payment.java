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
public class Payment extends BaseModel {

  @OneToOne
  @JoinColumn(name = "booking_id",nullable = false)
  private Booking booking;
  
  @ManyToOne
  @JoinColumn(name = "user_id",nullable = false)
  private Users user;

  @Column(name = "payment_id",nullable = false,unique = true)
  private String paymentId;

  @Column(name = "payment_status",nullable = false)
  @Builder.Default
  private PaymentStatus paymentStatus = PaymentStatus.PENDING;

  @Column(name = "payment_amount",nullable = false)
  private Double paymentAmount;

  @Column(name = "payment_date",nullable = false)
  private Date paymentDate;

  @Column(name = "payment_method",nullable = false)
  @Builder.Default
  private PaymentMethod paymentMethod = PaymentMethod.CREDIT_CARD;

  
}
