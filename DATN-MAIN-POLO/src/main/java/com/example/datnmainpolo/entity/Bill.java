package com.example.datnmainpolo.entity;

import com.example.datnmainpolo.enums.BillType;
import com.example.datnmainpolo.enums.OrderStatus;
import com.example.datnmainpolo.enums.PaymentType;
import jakarta.persistence.*;
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

    @Size(max = 100)
    @Column(name = "code", length = 100)
    private String code;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 50)
    private OrderStatus status;


    @Size(max = 100)
    @Column(name = "customer_name", length = 100)
    private String customerName;

    @Size(max = 20)
    @Column(name = "phone_number", length = 20)
    private String phoneNumber;

    @Size(max = 100)
    @Column(name = "address", length = 100)
    private String address;


    @Column(name = "confirmation_date")
    private Instant confirmationDate;   //ngay xac nhan don hang

    @Column(name = "delivery_date")
    private Instant deliveryDate;       //ngay giao hang

    @Column(name = "received_date")
    private Instant receivedDate;       //ngay nhan hang

    @Column(name = "completion_date")   //ngay hoan thanh don hang
    private Instant completionDate;

    @Column(name = "desired_date")      // ngay mong muon giao hang
    private Instant desiredDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", length = 100) //online , cash
    private PaymentType type;

    @Column(name = "bill_type")
    @Enumerated(EnumType.STRING)
    private BillType billType; //ONLINE, OFLINE

    @Column(name = "total_money", nullable = false)
    private BigDecimal totalMoney = BigDecimal.ZERO;

    @Column(name = "reduction_amount", nullable = false)
    private BigDecimal reductionAmount = BigDecimal.ZERO;

    @Column(name = "money_ship", nullable = false)
    private BigDecimal moneyShip = BigDecimal.ZERO;

    @Column(name = "final_amount", nullable = false)
    private BigDecimal finalAmount = BigDecimal.ZERO;
    // ... getters and setters ...

    @Size(max = 100)
    @Column(name = "voucher_code", length = 100)
    private String voucherCode;
    @Size(max = 100)
    @Column(name = "voucher_name", length = 100)
    private String voucherName;


    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    private UserEntity customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id")
    private UserEntity employee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_infor_id")
    private CustomerInformation customerInfor;


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