package com.example.datnmainpolo.repository;


import com.example.datnmainpolo.entity.Image;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import org.springframework.data.jpa.repository.Query;

public interface ImageRepository extends JpaRepository<Image, Integer> {
    @Query("SELECT i FROM Image i WHERE i.deleted = false")
    List<Image> findAllActiveImages();




}