package com.example.datnmainpolo.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "bill_return_attachment")
public class BillReturnAttachment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bill_return_id")
    private BillReturn billReturn;

    @Column(name = "url")
    private String url;

    @Column(name = "content_type")
    private String contentType; // image/*, video/*, etc.

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "deleted")
    private Boolean deleted = false;

    @PrePersist
    private void prePersist() {
        this.createdAt = Instant.now();
        if (this.deleted == null) this.deleted = false;
    }
}
