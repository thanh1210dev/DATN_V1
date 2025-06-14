package com.example.datnmainpolo.entity;



import com.example.datnmainpolo.enums.PromotionStatus;
import com.example.datnmainpolo.enums.VoucherType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
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
@Table(name = "voucher")
public class Voucher {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Integer id;

    @Column(name = "code", columnDefinition = "NVARCHAR(100)")
    private String code;

    @Column(name = "name", columnDefinition = "NVARCHAR(100)")
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", columnDefinition = "NVARCHAR(50)")
    private VoucherType type;

    @Column(name = "start_time")
    private Instant startTime;

    @Column(name = "end_time")
    private Instant endTime;

    @Column(name = "quantity")
    private Integer quantity;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", columnDefinition = "NVARCHAR(255)")
    private PromotionStatus status;

    @Column(name = "fixed_discount_value")
    private BigDecimal fixedDiscountValue; // Giá trị giảm cố định

    @Column(name = "percentage_discount_value")
    private BigDecimal percentageDiscountValue; // Giá trị giảm theo phần trăm (0-100)

    @Column(name = "max_discount_value")
    private BigDecimal maxDiscountValue; // Giá trị giảm tối đa

    @Column(name = "min_order_value") // New field for minimum order value
    private BigDecimal minOrderValue; // Giá trị đơn hàng tối thiểu để áp dụng voucher

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @ManyToOne
    @JoinColumn(name = "created_by", referencedColumnName = "id")
    private UserEntity createdByUser;

    @Column(name = "deleted")
    private Boolean deleted;
}