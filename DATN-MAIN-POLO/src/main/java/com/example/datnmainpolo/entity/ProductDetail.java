package com.example.datnmainpolo.entity;


import com.example.datnmainpolo.enums.ProductStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Entity
@Table(name = "product_detail")
public class ProductDetail {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    private Product product;

    @OneToMany(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_detail_id")
    private List<Image> images = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "size_id")
    private com.example.datnmainpolo.entity.Size size;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "color_id")
    private Color color;


    // importPrice & importHistories removed per new requirements (no warehouse tracking)



    @Column(name = "code", columnDefinition = "NVARCHAR(255)")
    private String code;

    @Column(name = "quantity")
    private Integer quantity;

    // Expanded precision (15,2) to allow prices up to 999 tỷ
    @Column(name = "price", precision = 15, scale = 2)
    private BigDecimal price;

    @Column(name = "promotional_price", precision = 15, scale = 2)
    private BigDecimal promotionalPrice;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 50)
    private ProductStatus status;

    @Column(name = "created_at")
    private Instant createdAt;
    @Column(name = "sold_quantity")
    private Integer soldQuantity = 0;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @Column(name = "deleted")
    private Boolean deleted;
}