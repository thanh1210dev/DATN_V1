package com.example.datnmainpolo.entity;

import com.example.datnmainpolo.enums.PromotionStatus;
import com.example.datnmainpolo.enums.DiscountType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "promotion")
public class Promotion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Integer id;

    @Size(max = 100)
    @Column(name = "code", columnDefinition = "NVARCHAR(100)")
    private String code;

    @Size(max = 100)
    @Column(name = "name", columnDefinition = "NVARCHAR(100)")
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "type_promotion", columnDefinition = "NVARCHAR(50)")
    private DiscountType typePromotion;

    @Column(name = "start_time")
    private Instant startTime;

    @Column(name = "end_time")
    private Instant endTime;

    @Column(name = "percentage_discount_value", precision = 5, scale = 2)
    private BigDecimal percentageDiscountValue; // Giá trị giảm theo phần trăm (0-100)

    @Lob
    @Column(name = "description", columnDefinition = "NVARCHAR(MAX)")
    private String description;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", columnDefinition = "NVARCHAR(255)")
    private PromotionStatus status;

    @ManyToOne
    @JoinColumn(name = "created_by", referencedColumnName = "id", insertable = false, updatable = false)
    private UserEntity createdByUser;

    @Column(name = "deleted")
    private Boolean deleted;
}