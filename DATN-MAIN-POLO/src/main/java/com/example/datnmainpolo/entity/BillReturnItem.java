package com.example.datnmainpolo.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@Entity
@Table(name = "bill_return_item")
public class BillReturnItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bill_return_id")
    private BillReturn billReturn;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bill_detail_id")
    private BillDetail billDetail;

    @Column(name = "quantity")
    private Integer quantity; // số lượng trả

    @Column(name = "unit_price", precision = 10, scale = 2)
    private BigDecimal unitPrice; // giá tại thời điểm mua (promotionalPrice nếu có)

    @Column(name = "refund_amount", precision = 10, scale = 2)
    private BigDecimal refundAmount; // quantity * unitPrice
}
