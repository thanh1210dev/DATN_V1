package com.example.datnmainpolo.dto.UserDTO;


import com.example.datnmainpolo.enums.Role;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class UserRequestDTO {

    private Integer id;

    @NotNull(message = "Vai trò không được để trống")
    private Role role;

    @Size(max = 50, message = "Mã người dùng không được vượt quá 50 ký tự")
    private String code; // Cho phép null -> sẽ tự sinh nếu thiếu

    @Size(max = 100, message = "Tên người dùng không được vượt quá 100 ký tự")
    private String name; // Cho phép null -> sẽ gán mặc định "Khách lẻ"

    @PastOrPresent(message = "Ngày sinh phải là ngày trong quá khứ hoặc hiện tại")
    private LocalDate birthDate;

    @Pattern(regexp = "^$|^\\d{10}$", message = "phoneNumber: Số điện thoại phải trống hoặc đủ 10 chữ số")
    private String phoneNumber; // Optional

    @Email(message = "Email không đúng định dạng")
    private String email; // Optional
    // Mật khẩu để trống khi UPDATE sẽ giữ nguyên (validate thêm trong service cho CREATE)
    // Mật khẩu OPTIONAL khi update: bỏ @Size để không fail validation khi để trống.
    // Length được kiểm tra thủ công trong service khi CREATE hoặc khi UPDATE có truyền giá trị.
    private String password;
    @Size(max = 255, message = "Đường dẫn ảnh đại diện không được vượt quá 255 ký tự")
    private String avatar;
}