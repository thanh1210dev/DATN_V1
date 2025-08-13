package com.example.datnmainpolo.entity;

import com.example.datnmainpolo.enums.BillDetailStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "bill_detail")
public class BillDetail {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) // Thêm để tự động tăng id
    @Column(name = "id", nullable = false)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "detail_product_id")
    private ProductDetail detailProduct;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bill_id")
    private Bill bill;

    @Column(name = "quantity")
    private Integer quantity;

    // Increased precision to (15,2) to avoid arithmetic overflow for large orders
    @Column(name = "price", precision = 15, scale = 2)
    private BigDecimal price;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 50)
    private BillDetailStatus status;

    // Removed deprecated per-line workflow status (typeOrder) to avoid duplication with bill status

    @Column(name = "promotional_price", precision = 15, scale = 2)
    private BigDecimal promotionalPrice;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @Size(max = 100)
    @Column(name = "created_by", columnDefinition = "NVARCHAR(100)")
    private String createdBy;

    @Size(max = 100)
    @Column(name = "updated_by", columnDefinition = "NVARCHAR(100)")
    private String updatedBy;

    @Column(name = "deleted")
    private Boolean deleted;

    // typeOrder removed
}