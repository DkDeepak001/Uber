package com.review_service.dto;

import lombok.*;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CreateReviewRequestDto {
    private Long bookingId;
    private Integer rating;
    private String comment;
}

