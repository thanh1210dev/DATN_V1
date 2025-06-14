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
@Table(name = "bill")
public class Bill {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) // Thêm để tự động tăng id
    @Column(name = "id", nullable = false)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    private UserEntity customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id")
    private UserEntity employee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_infor_id")
    private CustomerInformation customerInfor;

    @Size(max = 100)
    @Column(name = "code", length = 100)
    private String code;

    @Column(name = "confirmation_date")
    private Instant confirmationDate;

    @Column(name = "delivery_date")
    private Instant deliveryDate;

    @Column(name = "received_date")
    private Instant receivedDate;

    @Column(name = "completion_date")
    private Instant completionDate;

    @Column(name = "desired_date")
    private Instant desiredDate;

    @Size(max = 100)
    @Column(name = "type", length = 100)
    private String type;

    @Size(max = 100)
    @Column(name = "customer_name", length = 100)
    private String customerName;

    @Size(max = 20)
    @Column(name = "phone_number", length = 20)
    private String phoneNumber;

    @Size(max = 100)
    @Column(name = "address", length = 100)
    private String address;

    @Column(name = "money_ship", precision = 10, scale = 2)
    private BigDecimal moneyShip;

    @Column(name = "total_money", precision = 10, scale = 2)
    private BigDecimal totalMoney;

    @Column(name = "reduction_amount", precision = 10, scale = 2)
    private BigDecimal reductionAmount;

    @Column(name = "deposit", precision = 10, scale = 2)
    private BigDecimal deposit;

    @Size(max = 50)
    @Column(name = "status", length = 50)
    private String status;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @Size(max = 100)
    @Column(name = "created_by", length = 100)
    private String createdBy;

    @Size(max = 100)
    @Column(name = "updated_by", length = 100)
    private String updatedBy;

    @Column(name = "deleted")
    private Boolean deleted;

}