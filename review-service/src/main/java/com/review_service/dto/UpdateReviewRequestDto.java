package com.review_service.dto;

import lombok.*;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UpdateReviewRequestDto {
    private Integer rating;
    private String comment;
}

