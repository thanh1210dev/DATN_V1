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
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "import_history")
@Getter
@Setter
public class ImportHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_detail_id")
    private ProductDetail productDetail;

    @Column(name = "import_quantity")
    private Integer importQuantity;
    @Column(name = "sold_quatity")
    private Integer soldQuantity;
    @Column(name = "public_import_price")
    private BigDecimal publicImportPrice;

    @Column(name = "import_price", precision = 15, scale = 2)
    private BigDecimal importPrice;

    @Column(name = "import_date")
    private Instant importDate;
}
