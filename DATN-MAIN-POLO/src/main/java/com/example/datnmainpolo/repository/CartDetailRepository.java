package com.example.datnmainpolo.repository;

import com.example.datnmainpolo.entity.CartDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CartDetailRepository extends JpaRepository<CartDetail, Integer> {
    List<CartDetail> findByCartId(Integer cartId);
    Optional<CartDetail> findByCartIdAndDetailProductId(Integer cartId, Integer productDetailId);
    List<CartDetail> findByCartIdAndIdIn(Integer cartId, List<Integer> ids);
}
