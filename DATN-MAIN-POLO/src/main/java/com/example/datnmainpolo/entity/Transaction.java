package com.example.datnmainpolo.entity;

import com.example.datnmainpolo.enums.TransactionStatus;
import com.example.datnmainpolo.enums.TransactionType;
import jakarta.persistence.*;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "transactions")
public class Transaction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) // Thêm để tự động tăng id
    @Column(name = "id", nullable = false)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bill_id")
    private Bill bill;


    @Enumerated(EnumType.STRING)
    @Column(name = "type", length = 50)
    private TransactionType type;

    @Column(name = "total_money", precision = 10, scale = 2)
    private BigDecimal totalMoney;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private TransactionStatus status;

    @Column(name = "note")
    private String note;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;


    @Column(name = "deleted")
    private Boolean deleted;

}