package com.example.datnmainpolo.controller;

import com.example.datnmainpolo.dto.ReturnDTO.CreateReturnRequest;
import com.example.datnmainpolo.dto.ReturnDTO.ReturnResponseDTO;
import com.example.datnmainpolo.service.ReturnService;
import com.example.datnmainpolo.service.Impl.ImageService.FileStorageService;
import org.springframework.web.multipart.MultipartFile;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/returns")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"}, allowedHeaders = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS}, allowCredentials = "true")
public class ReturnController {

    private final ReturnService returnService;
    private final FileStorageService fileStorageService;

    @PostMapping("/bills/{billId}")
    public ResponseEntity<ReturnResponseDTO> createReturn(@PathVariable Integer billId,
                                                          @RequestBody CreateReturnRequest request) {
        return ResponseEntity.ok(returnService.createReturn(billId, request));
    }

    // Multipart create with files (images/videos) uploaded together
    @PostMapping(value = "/bills/{billId}/with-files", consumes = {"multipart/form-data"})
    public ResponseEntity<ReturnResponseDTO> createReturnWithFiles(@PathVariable Integer billId,
                                                                   @RequestPart("payload") CreateReturnRequest request,
                                                                   @RequestPart(value = "files", required = false) MultipartFile[] files) throws Exception {
        if (files != null && files.length > 0) {
            for (MultipartFile f : files) {
                String url = fileStorageService.uploadFile(f);
                if (request.getAttachmentUrls() == null) request.setAttachmentUrls(new java.util.ArrayList<>());
                request.getAttachmentUrls().add(url);
            }
        }
        return ResponseEntity.ok(returnService.createReturn(billId, request));
    }

    @PostMapping("/{returnId}/approve")
    public ResponseEntity<ReturnResponseDTO> approve(@PathVariable Integer returnId) {
        return ResponseEntity.ok(returnService.approveReturn(returnId));
    }

    @PostMapping("/{returnId}/reject")
    public ResponseEntity<ReturnResponseDTO> reject(@PathVariable Integer returnId,
                                                    @RequestParam(required = false) String reason) {
        return ResponseEntity.ok(returnService.rejectReturn(returnId, reason));
    }

    @PostMapping("/{returnId}/complete")
    public ResponseEntity<ReturnResponseDTO> completeReturn(@PathVariable Integer returnId) {
        return ResponseEntity.ok(returnService.completeReturn(returnId));
    }

    @GetMapping("/bills/{billId}")
    public ResponseEntity<List<ReturnResponseDTO>> getReturnsByBill(@PathVariable Integer billId) {
        return ResponseEntity.ok(returnService.getReturnsByBill(billId));
    }
}
