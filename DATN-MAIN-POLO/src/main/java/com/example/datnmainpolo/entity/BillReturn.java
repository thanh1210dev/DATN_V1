package com.example.datnmainpolo.entity;

import com.example.datnmainpolo.enums.ReturnStatus;
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
@Table(name = "bill_return")
public class BillReturn {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bill_id")
    private Bill bill;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 50)
    private ReturnStatus status = ReturnStatus.REQUESTED; // default: tiếp nhận yêu cầu trả

    @Column(name = "reason",columnDefinition = "NVARCHAR(500)")
    private String reason;

    @Column(name = "total_refund_amount", precision = 10, scale = 2)
    private BigDecimal totalRefundAmount = BigDecimal.ZERO;

    @Column(name = "is_full_return")
    private Boolean fullReturn = false;

    @OneToMany(mappedBy = "billReturn", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<BillReturnItem> items = new ArrayList<>();

    @OneToMany(mappedBy = "billReturn", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<BillReturnAttachment> attachments = new ArrayList<>();

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @Column(name = "deleted")
    private Boolean deleted = false;

    @PrePersist
    private void prePersist() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
        if (this.status == null) this.status = ReturnStatus.REQUESTED;
        if (this.totalRefundAmount == null) this.totalRefundAmount = BigDecimal.ZERO;
        if (this.fullReturn == null) this.fullReturn = false;
        if (this.deleted == null) this.deleted = false;
    }

    @PreUpdate
    private void preUpdate() {
        this.updatedAt = Instant.now();
    }
}
