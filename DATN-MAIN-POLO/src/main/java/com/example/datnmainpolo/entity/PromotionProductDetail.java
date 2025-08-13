package com.example.datnmainpolo.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
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
@Table(name = "promotion_product_detail")
public class PromotionProductDetail {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) // Thêm để tự động tăng id
    @Column(name = "id", nullable = false)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "detail_product_id")
    private ProductDetail detailProduct;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "promotion_id")
    private Promotion promotion;

    @Column(name = "price", precision = 15, scale = 2)
    private BigDecimal price;

    @Column(name = "price_after_promotion", precision = 15, scale = 2)
    private BigDecimal priceAfterPromotion;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;



    @Column(name = "deleted")
    private Boolean deleted;

}