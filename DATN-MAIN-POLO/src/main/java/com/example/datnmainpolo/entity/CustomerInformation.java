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

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "customer_information")
public class CustomerInformation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) // Thêm để tự động tăng id
    @Column(name = "id", nullable = false)
    private Integer id;

    @Size(max = 100)
    @Column(name = "name",  columnDefinition = "NVARCHAR(255)")
    private String name;

    @Size(max = 20)
    @Column(name = "phone_number", length = 20)
    private String phoneNumber;

    @Size(max = 100)
    @Column(name = "address", columnDefinition = "NVARCHAR(255)")
    private String address;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @Size(max = 100)
    @Column(name = "province_name", columnDefinition = "NVARCHAR(255)")
    private String provinceName;

    @Column(name = "province_id")
    private Integer provinceId;

    @Size(max = 100)
    @Column(name = "district_name", columnDefinition = "NVARCHAR(255)")
    private String districtName;

    @Column(name = "district_id")
    private Integer districtId;

    @Size(max = 100)
    @Column(name = "ward_name", columnDefinition = "NVARCHAR(255)")
    private String wardName;

    @Size(max = 100)
    @Column(name = "ward_code", length = 100)
    private String wardCode;


    @Column(name = "deleted")
    private Boolean deleted;



    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    private UserEntity customer;

}