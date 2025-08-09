package com.example.datnmainpolo.service.Impl.BillDetailServiceImpl;

import com.example.datnmainpolo.dto.BillDTO.BillResponseDTO;
import com.example.datnmainpolo.dto.BillDetailDTO.BillDetailResponseDTO;
import com.example.datnmainpolo.enums.BillDetailStatus;
import com.example.datnmainpolo.repository.BillDetailRepository;
import com.itextpdf.text.*;
import com.itextpdf.text.pdf.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.List;

@Service
public class InvoicePDFService {

    @Autowired
    private BillDetailRepository billDetailRepository;

    private static final BaseColor PRIMARY_COLOR = new BaseColor(33, 150, 243);
    private static final BaseColor GRAY_COLOR = new BaseColor(200, 200, 200);
    private static final BaseColor DARK_GRAY = new BaseColor(50, 50, 50);

    public String generateInvoicePDF(BillResponseDTO billDTO, List<BillDetailResponseDTO> billDetails) {
        try {
            Document document = new Document(PageSize.A4, 30, 30, 30, 30);
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            PdfWriter writer = PdfWriter.getInstance(document, baos);
            document.open();

            // Load font hỗ trợ tiếng Việt
            BaseFont baseFont;
            try {
                baseFont = BaseFont.createFont("c:/windows/fonts/times.ttf", BaseFont.IDENTITY_H, BaseFont.EMBEDDED);
            } catch (Exception e) {
                baseFont = BaseFont.createFont(BaseFont.HELVETICA, BaseFont.CP1252, BaseFont.EMBEDDED);
                System.err.println("Không thể tải font Times New Roman, sử dụng Helvetica: " + e.getMessage());
            }

            Font titleFont = new Font(baseFont, 22, Font.BOLD, PRIMARY_COLOR);
            Font headerFont = new Font(baseFont, 12, Font.BOLD, DARK_GRAY);
            Font normalFont = new Font(baseFont, 10, Font.NORMAL, DARK_GRAY);
            Font boldFont = new Font(baseFont, 10, Font.BOLD, DARK_GRAY);
            Font footerFont = new Font(baseFont, 9, Font.ITALIC, GRAY_COLOR);

            // Header Section
            PdfPTable headerTable = new PdfPTable(2);
            headerTable.setWidthPercentage(100);
            headerTable.setWidths(new float[]{1.5f, 3});
            headerTable.setSpacingAfter(10f);

            PdfPCell logoCell = new PdfPCell(new Phrase("POLO STORE", titleFont));
            logoCell.setBorder(Rectangle.NO_BORDER);
            logoCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
            logoCell.setPadding(10);
            headerTable.addCell(logoCell);

            PdfPCell infoCell = new PdfPCell();
            infoCell.setBorder(Rectangle.NO_BORDER);
            infoCell.setPadding(10);
            infoCell.addElement(new Phrase("CỬA HÀNG THỜI TRANG POLO", headerFont));
            infoCell.addElement(new Phrase("Địa chỉ: 123 Đường Láng, Đống Đa, Hà Nội", normalFont));
            infoCell.addElement(new Phrase("Hotline: 0123 456 789 | Email: contact@polostore.vn", normalFont));
            infoCell.addElement(new Phrase("Website: www.polostore.vn", normalFont));
            headerTable.addCell(infoCell);

            document.add(headerTable);

            // Invoice Title
            Paragraph title = new Paragraph("HÓA ĐƠN BÁN HÀNG", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingBefore(10);
            title.setSpacingAfter(10);
            document.add(title);

            // Invoice Information
            PdfPTable billInfoTable = new PdfPTable(2);
            billInfoTable.setWidthPercentage(100);
            billInfoTable.setWidths(new float[]{1, 2});
            billInfoTable.setSpacingAfter(15f);

            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss")
                    .withZone(ZoneId.of("Asia/Ho_Chi_Minh"));

            addInfoCell(billInfoTable, "Mã hóa đơn:", billDTO.getCode(), normalFont, boldFont);
            addInfoCell(billInfoTable, "Ngày tạo:", billDTO.getCreatedAt() != null ? formatter.format(billDTO.getCreatedAt()) : "N/A", normalFont, boldFont);
            addInfoCell(billInfoTable, "Khách hàng:", billDTO.getCustomerName() != null ? billDTO.getCustomerName() : "Khách lẻ", normalFont, boldFont);
            addInfoCell(billInfoTable, "SĐT:", billDTO.getPhoneNumber() != null ? billDTO.getPhoneNumber() : "N/A", normalFont, boldFont);
            addInfoCell(billInfoTable, "Địa chỉ:", billDTO.getAddress() != null ? billDTO.getAddress() : "N/A", normalFont, boldFont);
            addInfoCell(billInfoTable, "Nhân viên:", billDTO.getEmployeeName() != null ? billDTO.getEmployeeName() : "N/A", normalFont, boldFont);
            addInfoCell(billInfoTable, "Loại hóa đơn:", billDTO.getBillType() != null ? billDTO.getBillType().toString() : "N/A", normalFont, boldFont);
            addInfoCell(billInfoTable, "Phương thức TT:", billDTO.getType() != null ? billDTO.getType().toString() : "N/A", normalFont, boldFont);

            document.add(billInfoTable);

            // Product Details Table
            PdfPTable productTable = new PdfPTable(6);
            productTable.setWidthPercentage(100);
            productTable.setWidths(new float[]{0.5f, 3, 1.5f, 1, 1.5f, 1.5f});
            productTable.setHeaderRows(1);
            productTable.setSpacingBefore(10);
            productTable.setSpacingAfter(10);

            String[] headers = {"STT", "Sản phẩm", "Mã SP", "SL", "Đơn giá", "Thành tiền"};
            for (String header : headers) {
                PdfPCell headerCell = new PdfPCell(new Phrase(header, headerFont));
                headerCell.setBackgroundColor(PRIMARY_COLOR);
                headerCell.setHorizontalAlignment(Element.ALIGN_CENTER);
                headerCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
                headerCell.setPadding(8);
                headerCell.setBorderColor(GRAY_COLOR);
                productTable.addCell(headerCell);
            }

        // Filter out returned items and zero/non-positive quantities for invoice display
        List<BillDetailResponseDTO> activeDetails = billDetails == null ? java.util.Collections.emptyList() :
            billDetails.stream()
                .filter(d -> d != null)
                .filter(d -> d.getStatus() == null || d.getStatus() != BillDetailStatus.RETURNED)
                .filter(d -> d.getQuantity() != null && d.getQuantity() > 0)
                .collect(java.util.stream.Collectors.toList());

        int index = 1;
        for (BillDetailResponseDTO detail : activeDetails) {
                String productName = detail.getProductName() != null ? detail.getProductName() : "N/A";
                if (productName.length() > 40) {
                    productName = productName.substring(0, 37) + "...";
                }
                String sizeColor = "";
                if (detail.getProductSize() != null) {
                    sizeColor += " (" + detail.getProductSize() + ")";
                }
                if (detail.getProductColor() != null) {
                    sizeColor += (sizeColor.isEmpty() ? "" : " - ") + detail.getProductColor();
                }
                productName += sizeColor;

                String productCode = detail.getProductDetailCode() != null ? detail.getProductDetailCode() : "N/A";
        int qtyVal = detail.getQuantity() != null ? detail.getQuantity() : 0;
        String quantity = Integer.toString(qtyVal);
        BigDecimal price = detail.getPromotionalPrice() != null && detail.getPromotionalPrice().compareTo(BigDecimal.ZERO) > 0
            ? detail.getPromotionalPrice()
            : (detail.getPrice() != null ? detail.getPrice() : BigDecimal.ZERO);
        BigDecimal totalPrice = price.multiply(BigDecimal.valueOf(qtyVal));

                addProductCell(productTable, String.valueOf(index++), normalFont, Element.ALIGN_CENTER);
                addProductCell(productTable, productName, normalFont, Element.ALIGN_LEFT);
                addProductCell(productTable, productCode, normalFont, Element.ALIGN_LEFT);
                addProductCell(productTable, quantity, normalFont, Element.ALIGN_CENTER);
                addProductCell(productTable, String.format("%,.0f đ", price), normalFont, Element.ALIGN_RIGHT);
                addProductCell(productTable, String.format("%,.0f đ", totalPrice), normalFont, Element.ALIGN_RIGHT);
            }

            document.add(productTable);

        // Optional note: if some items were hidden due to returns, show a hint
        if (billDetails != null && activeDetails.size() < billDetails.size()) {
        Paragraph hiddenNote = new Paragraph(
            "Lưu ý: Một số sản phẩm đã được trả hàng và không hiển thị trên hóa đơn.",
            new Font(BaseFont.createFont(BaseFont.HELVETICA, BaseFont.CP1252, BaseFont.EMBEDDED), 9, Font.ITALIC, GRAY_COLOR)
        );
        hiddenNote.setSpacingBefore(5);
        document.add(hiddenNote);
        }

            // Summary Table
            PdfPTable totalTable = new PdfPTable(2);
            totalTable.setWidthPercentage(50);
            totalTable.setHorizontalAlignment(Element.ALIGN_RIGHT);
            totalTable.setSpacingBefore(10);

            addTotalRow(totalTable, "Tổng tiền hàng:", billDTO.getTotalMoney(), normalFont, boldFont);
            if (billDTO.getVoucherCode() != null) {
                String voucherLabel = "Voucher (" + billDTO.getVoucherCode() + "):";
                addTotalRow(totalTable, voucherLabel, billDTO.getReductionAmount().negate(), normalFont, boldFont);
            }
            addTotalRow(totalTable, "Phí vận chuyển:", billDTO.getMoneyShip(), normalFont, boldFont);
            addTotalRow(totalTable, "TỔNG CỘNG:", billDTO.getFinalAmount(), headerFont, headerFont);

            document.add(totalTable);

            // Footer
            PdfPTable footerTable = new PdfPTable(1);
            footerTable.setWidthPercentage(100);
            footerTable.setSpacingBefore(20);

            PdfPCell footerCell = new PdfPCell();
            footerCell.setBorder(Rectangle.NO_BORDER);
            footerCell.setHorizontalAlignment(Element.ALIGN_CENTER);
            footerCell.addElement(new Phrase("CẢM ƠN QUÝ KHÁCH - HẸN GẶP LẠI!", footerFont));
            footerCell.addElement(new Phrase("Vui lòng kiểm tra kỹ hóa đơn trước khi rời cửa hàng", footerFont));
            footerTable.addCell(footerCell);

            document.add(footerTable);

            document.close();
            return Base64.getEncoder().encodeToString(baos.toByteArray());

        } catch (DocumentException | java.io.IOException e) {
            throw new RuntimeException("Không thể tạo PDF hóa đơn: " + e.getMessage(), e);
        }
    }

    private void addInfoCell(PdfPTable table, String label, String value, Font labelFont, Font valueFont) {
        PdfPCell labelCell = new PdfPCell(new Phrase(label, labelFont));
        labelCell.setBorder(Rectangle.NO_BORDER);
        labelCell.setPadding(4);
        labelCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        table.addCell(labelCell);

        PdfPCell valueCell = new PdfPCell(new Phrase(value, valueFont));
        valueCell.setBorder(Rectangle.NO_BORDER);
        valueCell.setPadding(4);
        valueCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        table.addCell(valueCell);
    }

    private void addProductCell(PdfPTable table, String value, Font font, int alignment) {
        PdfPCell cell = new PdfPCell(new Phrase(value, font));
        cell.setPadding(6);
        cell.setHorizontalAlignment(alignment);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        cell.setBorderColor(GRAY_COLOR);
        table.addCell(cell);
    }

    private void addTotalRow(PdfPTable table, String label, BigDecimal amount, Font labelFont, Font amountFont) {
        PdfPCell labelCell = new PdfPCell(new Phrase(label, labelFont));
        labelCell.setBorder(Rectangle.NO_BORDER);
        labelCell.setPadding(5);
        table.addCell(labelCell);

        String amountStr = amount != null ? String.format("%,.0f đ", amount) : "0 đ";
        PdfPCell amountCell = new PdfPCell(new Phrase(amountStr, amountFont));
        amountCell.setBorder(Rectangle.NO_BORDER);
        amountCell.setPadding(5);
        amountCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        table.addCell(amountCell);
    }
}