package com.example.datnmainpolo.repository;

import com.example.datnmainpolo.entity.UserEntity;
import com.example.datnmainpolo.enums.Role;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Optional;

public interface UserRepository extends JpaRepository<UserEntity, Integer> {
    Optional<UserEntity> findByEmail(String email);
    Optional<UserEntity> findByPhoneNumber(String phoneNumber);

    boolean existsByEmail(String email);
    boolean existsByPhoneNumber(String phoneNumber);

    @Query("SELECT u FROM UserEntity u WHERE " +
            "(:code IS NULL OR u.code LIKE %:code%) " +
            "AND (:name IS NULL OR u.name LIKE %:name%) " +
            "AND u.deleted = false")
    Page<UserEntity> findByCodeAndName(
            @Param("code") String code,
            @Param("name") String name,
            Pageable pageable);


    @Query("SELECT u FROM UserEntity u WHERE " +
            "(:code IS NULL OR u.code LIKE %:code%) " +
            "AND (:name IS NULL OR u.name LIKE %:name%) " +
            "AND u.deleted = false " +
            "and u.role = 'CLIENT' "
              )
    Page<UserEntity> findByCodeAndNameAndRole(
            @Param("code") String code,
            @Param("name") String name,
            Pageable pageable);

    @Query("SELECT u FROM UserEntity u WHERE " +
            "u.role = :role " +
            "AND (:code IS NULL OR u.code LIKE %:code%) " +
            "AND (:name IS NULL OR u.name LIKE %:name%) " +
            "AND u.deleted = false")
    Page<UserEntity> findByRoleAndCodeAndName(
            @Param("role") Role role,
            @Param("code") String code,
            @Param("name") String name,
            Pageable pageable);

    Optional<UserEntity> findByIdAndDeletedFalse(Integer id);

    Optional<UserEntity> findByEmailAndDeletedFalse(String email);

    Optional<UserEntity> findByCodeAndDeletedFalse(String code);






    @Query("SELECT u FROM UserEntity u WHERE u.role = :role AND u.deleted = false " +
            "AND (:phoneNumber IS NULL OR u.phoneNumber LIKE %:phoneNumber%) " +
            "AND (:name IS NULL OR u.name LIKE %:name%) " +
            "AND (:email IS NULL OR u.email LIKE %:email%)")
    Page<UserEntity> findByPhoneNumberOrNameOrEmailAndRole(
            @Param("phoneNumber") String phoneNumber,
            @Param("name") String name,
            @Param("email") String email,
            @Param("role") Role role,
            Pageable pageable
    );


    @Query("SELECT u FROM UserEntity u WHERE " +
            "u.role = 'CLIENT' " +
            "AND (:code IS NULL OR u.code LIKE %:code%) " +
            "AND (:name IS NULL OR u.name LIKE %:name%) " +
            "AND (:phoneNumber IS NULL OR u.phoneNumber LIKE %:phoneNumber%) " +
            "AND (:email IS NULL OR u.email LIKE %:email%) " +
            "AND u.deleted = false " +
            "AND (:startDate IS NULL OR EXISTS (SELECT b FROM Bill b WHERE b.customer = u " +
            "AND b.status = 'PAID' AND b.completionDate >= :startDate)) " +
            "AND (:endDate IS NULL OR EXISTS (SELECT b FROM Bill b WHERE b.customer = u " +
            "AND b.status = 'PAID' AND b.completionDate <= :endDate)) " +
            "AND (:isBirthday IS NULL OR :isBirthday = false OR " +
            "(FUNCTION('DAY', u.birthDate) = FUNCTION('DAY', CURRENT_DATE) " +
            "AND FUNCTION('MONTH', u.birthDate) = FUNCTION('MONTH', CURRENT_DATE))) " +
            "AND (:minPoints IS NULL OR u.loyaltyPoints >= :minPoints) " +
            "AND (:maxPoints IS NULL OR u.loyaltyPoints <= :maxPoints) " +
            "AND (:memberTier IS NULL OR " +
            "(:memberTier = 'BRONZE' AND u.loyaltyPoints < 500) OR " +
            "(:memberTier = 'SILVER' AND u.loyaltyPoints BETWEEN 500 AND 999) OR " +
            "(:memberTier = 'GOLD' AND u.loyaltyPoints BETWEEN 1000 AND 1999) OR " +
            "(:memberTier = 'PLATINUM' AND u.loyaltyPoints >= 2000))")
    Page<UserEntity> findByCodeAndNameofClient(
            @Param("code") String code,
            @Param("name") String name,
            @Param("phoneNumber") String phoneNumber,
            @Param("email") String email,
            @Param("startDate") Instant startDate,
            @Param("endDate") Instant endDate,
            @Param("isBirthday") Boolean isBirthday,
            @Param("minPoints") Integer minPoints,
            @Param("maxPoints") Integer maxPoints,
            @Param("memberTier") String memberTier,
            Pageable pageable);
}