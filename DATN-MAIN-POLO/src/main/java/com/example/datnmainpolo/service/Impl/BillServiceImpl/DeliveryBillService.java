package com.example.datnmainpolo.service.Impl.BillServiceImpl;

import com.example.datnmainpolo.dto.BillDTO.BillResponseDTO;
import com.example.datnmainpolo.dto.BillDTO.DeliveryBillAddressRequestDTO;
import com.example.datnmainpolo.entity.Bill;
import com.example.datnmainpolo.entity.CustomerInformation;
import com.example.datnmainpolo.entity.OrderHistory;
import com.example.datnmainpolo.entity.Transaction;
import com.example.datnmainpolo.enums.BillType;
import com.example.datnmainpolo.enums.OrderStatus;
import com.example.datnmainpolo.enums.TransactionStatus;
import com.example.datnmainpolo.enums.TransactionType;
import com.example.datnmainpolo.repository.BillRepository;
import com.example.datnmainpolo.repository.CustomerInformationRepository;
import com.example.datnmainpolo.repository.OrderHistoryRepository;
import com.example.datnmainpolo.repository.TransactionRepository;
import com.example.datnmainpolo.service.BillService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DeliveryBillService {
    private static final Logger LOGGER = LoggerFactory.getLogger(DeliveryBillService.class);
    private static final BigDecimal ZERO = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);

    private final BillRepository billRepository;
    private final CustomerInformationRepository customerInformationRepository;
    private final OrderHistoryRepository orderHistoryRepository;
    private final TransactionRepository transactionRepository;
    private final RestTemplate restTemplate;
    private final BillService billService;

    @Value("${ghn.api.token}")
    private String ghnToken;
    @Value("${ghn.api.base-url}")
    private String ghnBaseUrl;

    @Transactional
    public BillResponseDTO createDeliveryBill(DeliveryBillAddressRequestDTO request) {
        LOGGER.info("Creating delivery bill for bill ID: {}", request.getBillId());

        // Validate input
        if (request.getBillId() == null) {
            throw new RuntimeException("billId không được để trống");
        }
        if (request.getProvinceId() == null || request.getDistrictId() == null || request.getWardCode() == null) {
            throw new RuntimeException("Thông tin địa chỉ (provinceId, districtId, wardCode) không được để trống");
        }
        if (request.getCustomerName() == null || request.getPhoneNumber() == null || request.getAddressDetail() == null) {
            throw new RuntimeException("Thông tin khách hàng (customerName, phoneNumber, addressDetail) không được để trống");
        }

        // Find the bill and validate for delivery
        Bill bill = billRepository.findById(request.getBillId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hóa đơn"));
        billService.validateBillForDelivery(request.getBillId());

        // Create temporary CustomerInformation for GHN API calls
        CustomerInformation customerInfo = new CustomerInformation();
        customerInfo.setName(request.getCustomerName());
        customerInfo.setPhoneNumber(request.getPhoneNumber());
        customerInfo.setProvinceId(request.getProvinceId());
        customerInfo.setDistrictId(request.getDistrictId());
        customerInfo.setWardCode(request.getWardCode());
        customerInfo.setAddress(request.getAddressDetail());

        // Fetch address details from GHN API
        updateCustomerAddressFromGHN(customerInfo);

        // Calculate shipping fee
        BigDecimal shippingFee = calculateShippingFee(customerInfo);

        // Update bill with customer details and shipping fee
        bill.setCustomerName(customerInfo.getName());
        bill.setPhoneNumber(customerInfo.getPhoneNumber());
        bill.setAddress(String.format("%s, %s, %s, %s",
                customerInfo.getAddress(),
                customerInfo.getWardName() != null ? customerInfo.getWardName() : "",
                customerInfo.getDistrictName() != null ? customerInfo.getDistrictName() : "",
                customerInfo.getProvinceName() != null ? customerInfo.getProvinceName() : ""));
        bill.setMoneyShip(shippingFee);
        bill.setDesiredDate(request.getDesiredDate() != null ? request.getDesiredDate() : Instant.now());
        bill.setFinalAmount(bill.getTotalMoney().subtract(bill.getReductionAmount()).add(shippingFee));
        bill.setBillType(BillType.ONLINE);
        bill.setUpdatedAt(Instant.now());
        bill.setUpdatedBy("system");

        // Save the bill without linking to CustomerInformation
        Bill savedBill = billRepository.save(bill);

        // Update order history
        OrderHistory orderHistory = new OrderHistory();
        orderHistory.setBill(savedBill);
        orderHistory.setStatusOrder(OrderStatus.PENDING);
        orderHistory.setActionDescription("Cập nhật thông tin giao hàng và phí ship cho hóa đơn");
        orderHistory.setCreatedAt(Instant.now());
        orderHistory.setUpdatedAt(Instant.now());
        orderHistory.setCreatedBy("system");
        orderHistory.setUpdatedBy("system");
        orderHistory.setDeleted(false);
        orderHistoryRepository.save(orderHistory);

        // Update transaction
        Transaction transaction = transactionRepository.findByBillId(bill.getId())
                .orElseGet(() -> {
                    Transaction newTransaction = new Transaction();
                    newTransaction.setBill(savedBill);
                    newTransaction.setType(TransactionType.PAYMENT);
                    newTransaction.setStatus(TransactionStatus.PENDING);
                    newTransaction.setCreatedAt(Instant.now());
                    newTransaction.setDeleted(false);
                    return newTransaction;
                });
        transaction.setTotalMoney(savedBill.getFinalAmount());
        transaction.setNote("Cập nhật giao dịch với phí ship");
        transaction.setUpdatedAt(Instant.now());
        transactionRepository.save(transaction);

        // Apply best public voucher
        billService.applyBestPublicVoucher(savedBill);

        // Convert to DTO using BillService
        return billService.convertToBillResponseDTO(savedBill);
    }

    void updateCustomerAddressFromGHN(CustomerInformation customerInfo) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("Token", ghnToken);
            headers.set("Content-Type", "application/json");

            // Fetch ward details
            if (customerInfo.getDistrictId() != null && customerInfo.getWardCode() != null && !customerInfo.getWardCode().isEmpty()) {
                String wardUrl = ghnBaseUrl + "/master-data/ward?district_id=" + customerInfo.getDistrictId();
                HttpEntity<String> wardRequest = new HttpEntity<>(headers);
                ResponseEntity<Map> wardResponse = restTemplate.exchange(wardUrl, HttpMethod.GET, wardRequest, Map.class);
                Map<String, Object> wardResponseBody = wardResponse.getBody();

                if (wardResponseBody != null && wardResponseBody.containsKey("data")) {
                    List<Map<String, Object>> wardDataList = (List<Map<String, Object>>) wardResponseBody.get("data");
                    boolean wardFound = false;
                    for (Map<String, Object> wardData : wardDataList) {
                        String wardCode = (String) wardData.get("WardCode");
                        if (wardCode != null && wardCode.equals(customerInfo.getWardCode())) {
                            customerInfo.setWardName((String) wardData.get("WardName"));
                            wardFound = true;
                            break;
                        }
                    }
                    if (!wardFound) {
                        throw new RuntimeException("Mã ward_code " + customerInfo.getWardCode() + " không hợp lệ cho district_id " + customerInfo.getDistrictId() + ". Vui lòng kiểm tra lại ward_code bằng endpoint /api/ghn-address/wards?districtId=" + customerInfo.getDistrictId());
                    }
                } else {
                    throw new RuntimeException("Không tìm thấy dữ liệu xã/phường từ GHN API cho district_id " + customerInfo.getDistrictId());
                }
            } else {
                throw new RuntimeException("districtId hoặc wardCode không được để trống");
            }

            // Fetch district details
            if (customerInfo.getDistrictId() != null) {
                String districtUrl = ghnBaseUrl + "/master-data/district?district_id=" + customerInfo.getDistrictId();
                HttpEntity<String> districtRequest = new HttpEntity<>(headers);
                ResponseEntity<Map> districtResponse = restTemplate.exchange(districtUrl, HttpMethod.GET, districtRequest, Map.class);
                Map<String, Object> districtResponseBody = districtResponse.getBody();

                if (districtResponseBody != null && districtResponseBody.containsKey("data")) {
                    List<Map<String, Object>> districtDataList = (List<Map<String, Object>>) districtResponseBody.get("data");
                    if (!districtDataList.isEmpty()) {
                        Map<String, Object> districtData = districtDataList.get(0);
                        customerInfo.setDistrictName((String) districtData.get("DistrictName"));
                        Integer apiProvinceId = (Integer) districtData.get("ProvinceID");
                        if (!apiProvinceId.equals(customerInfo.getProvinceId())) {
                            LOGGER.warn("provinceId từ request ({}) không khớp với provinceId từ GHN API ({}) cho district_id {}. Cập nhật provinceId.",
                                    customerInfo.getProvinceId(), apiProvinceId, customerInfo.getDistrictId());
                            customerInfo.setProvinceId(apiProvinceId);
                        }
                    } else {
                        throw new RuntimeException("Danh sách huyện/quận rỗng từ GHN API cho district_id " + customerInfo.getDistrictId());
                    }
                } else {
                    throw new RuntimeException("Không tìm thấy dữ liệu huyện/quận từ GHN API cho district_id " + customerInfo.getDistrictId());
                }
            }

            // Fetch province details
            if (customerInfo.getProvinceId() != null) {
                String provinceUrl = ghnBaseUrl + "/master-data/province?province_id=" + customerInfo.getProvinceId();
                HttpEntity<String> provinceRequest = new HttpEntity<>(headers);
                ResponseEntity<Map> provinceResponse = restTemplate.exchange(provinceUrl, HttpMethod.GET, provinceRequest, Map.class);
                Map<String, Object> provinceResponseBody = provinceResponse.getBody();

                if (provinceResponseBody != null && provinceResponseBody.containsKey("data")) {
                    List<Map<String, Object>> provinceDataList = (List<Map<String, Object>>) provinceResponseBody.get("data");
                    if (!provinceDataList.isEmpty()) {
                        Map<String, Object> provinceData = provinceDataList.get(0);
                        customerInfo.setProvinceName((String) provinceData.get("ProvinceName"));
                    } else {
                        throw new RuntimeException("Danh sách tỉnh/thành phố rỗng từ GHN API cho province_id " + customerInfo.getProvinceId());
                    }
                } else {
                    throw new RuntimeException("Không tìm thấy dữ liệu tỉnh/thành phố từ GHN API cho province_id " + customerInfo.getProvinceId());
                }
            }
        } catch (Exception e) {
            LOGGER.error("Error fetching address from GHN API: {}", e.getMessage());
            throw new RuntimeException("Lỗi khi lấy thông tin địa chỉ từ GHN: " + e.getMessage());
        }
    }

    BigDecimal calculateShippingFee(CustomerInformation customerInfo) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("Token", ghnToken);
            headers.set("Content-Type", "application/json");

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("service_type_id", 2);
            requestBody.put("from_district_id", 1444);
            requestBody.put("to_district_id", customerInfo.getDistrictId());
            requestBody.put("to_ward_code", customerInfo.getWardCode());
            requestBody.put("height", 10);
            requestBody.put("length", 20);
            requestBody.put("weight", 1000);
            requestBody.put("width", 20);
            requestBody.put("insurance_value", 0);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
            String url = ghnBaseUrl + "/v2/shipping-order/fee";

            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.POST, request, Map.class);
            Map<String, Object> responseBody = response.getBody();

            if (responseBody != null && responseBody.containsKey("data")) {
                Map<String, Object> data = (Map<String, Object>) responseBody.get("data");
                Integer fee = (Integer) data.get("total");
                return new BigDecimal(fee).setScale(2, RoundingMode.HALF_UP);
            }
            throw new RuntimeException("Không thể tính phí vận chuyển");
        } catch (Exception e) {
            LOGGER.error("Error calculating shipping fee: {}", e.getMessage());
            throw new RuntimeException("Lỗi khi tính phí vận chuyển: " + e.getMessage());
        }
    }
}