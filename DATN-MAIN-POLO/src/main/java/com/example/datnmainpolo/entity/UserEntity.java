package com.example.datnmainpolo.entity;

import com.example.datnmainpolo.enums.Role;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.time.LocalDate;

@Getter
@Setter
@Entity
@Table(name = "account")
public class UserEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Integer id;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", columnDefinition = "NVARCHAR(255)")
    private Role role;

    @Column(name = "code", columnDefinition = "NVARCHAR(255)")
    private String code;

    @Column(name = "name", columnDefinition = "NVARCHAR(255)")
    private String name;

    @Column(name = "birth_date")
    private LocalDate birthDate;

    @Column(name = "address", columnDefinition = "NVARCHAR(255)")
    private String address;

    @Column(name = "phone_number", columnDefinition = "NVARCHAR(255)")
    private String phoneNumber;

    @Column(name = "email", columnDefinition = "NVARCHAR(255)")
    private String email;

    @Column(name = "password", columnDefinition = "NVARCHAR(255)")
    private String password;

    @Column(name = "avatar", columnDefinition = "NVARCHAR(255)")
    private String avatar;

    @Column(name = "loyalty_points")
    private Integer loyaltyPoints;

//    1 điểm = 10.000 VNĐ
//
//    Nếu khách mua hàng trị giá 350.000đ → nhận được 35 điểm.

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @Column(name = "deleted")
    private Boolean deleted;

    // Password reset token and expiry
    @Column(name = "reset_token", columnDefinition = "NVARCHAR(255)")
    private String resetToken;

    @Column(name = "reset_token_expiry")
    private Instant resetTokenExpiry;
}