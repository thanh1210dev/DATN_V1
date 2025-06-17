package com.example.datnmainpolo.service.Impl.TransactionServiceImpl;

import com.example.datnmainpolo.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class TransactionServiceImpl {
    private final TransactionRepository transactionRepository;
    
}
