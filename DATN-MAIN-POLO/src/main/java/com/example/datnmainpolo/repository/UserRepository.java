package com.example.datnmainpolo.repository;

import com.example.datnmainpolo.entity.UserEntity;
import com.example.datnmainpolo.enums.Role;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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

    
}