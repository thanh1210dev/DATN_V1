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

//    @NotNull(message = "Vai trò không được để trống")
    private Role role;

//    @NotBlank(message = "Mã người dùng không được để trống")
//    @Size(max = 50, message = "Mã người dùng không được vượt quá 50 ký tự")
    private String code;

//    @NotBlank(message = "Tên người dùng không được để trống")
//    @Size(max = 100, message = "Tên người dùng không được vượt quá 100 ký tự")
    private String name;

//    @PastOrPresent(message = "Ngày sinh phải là ngày trong quá khứ hoặc hiện tại")
    private LocalDate birthDate;

//    @Pattern(regexp = "^\\d{10}$", message = "Số điện thoại phải có đúng 10 chữ số")
    private String phoneNumber;

//    @NotBlank(message = "Email không được để trống")
//    @Email(message = "Email không đúng định dạng")
    private String email;
//
//    @NotBlank(message = "Mật khẩu không được để trống")
//    @Size(min = 6, message = "Mật khẩu phải có ít nhất 6 ký tự")
    private String password;
//
//    @Size(max = 255, message = "Đường dẫn ảnh đại diện không được vượt quá 255 ký tự")
    private String avatar;
}