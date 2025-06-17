import { Route } from "react-router-dom";
import DotGiamGiaAdmin from "../../Pages/Admin/DotGiamGiaPage/DotGiamGiaAdmin";
import VoucherAdmin from "../../Pages/Admin/VoucherPage/VoucherAdmin";
import VoucherAdminDetail from "../../Pages/Admin/VoucherPage/VoucherAdminDetail";
import AccountAdmin from "../../Pages/Admin/UserPage/AccountAdmin";
import DotGiamGiaDetailAdmin from "../../Pages/Admin/DotGiamGiaPage/DotGiamGiaDetailAdmin";



const AdminQuanlyGiamGia = [
    <Route path="/quan-ly-giam-gia/dot-giam-gia" element={<DotGiamGiaAdmin />} />,
    <Route path="/quan-ly-giam-gia/phieu-giam-gia" element={<VoucherAdmin />} />,
    <Route path="/chi-tiet-voucher/:id" element={<VoucherAdminDetail />} />,

    <Route path="/quan-ly-tai-khoan" element={<AccountAdmin />} />,

    <Route path="/chi-tiet-dot-giam-gia/:id" element={<DotGiamGiaDetailAdmin />} />
    
  ];
  
  export default AdminQuanlyGiamGia;