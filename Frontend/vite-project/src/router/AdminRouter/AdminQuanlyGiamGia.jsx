import { Route } from "react-router-dom";

import VoucherAdmin from "../../Pages/Admin/VoucherPage/VoucherAdmin";
import VoucherAdminDetail from "../../Pages/Admin/VoucherPage/VoucherAdminDetail";
import AccountAdmin from "../../Pages/Admin/UserPage/AccountAdmin";
import DotGiamGiaDetailAdmin from "../../Pages/Admin/DotGiamGiaPage/DotGiamGiaDetailAdmin";
import TaiQuayAdmin from "../../Pages/Admin/TaiQuayPage/TaiQuayAdmin";
import ZeroPromotionProductDetails from "../../Pages/Admin/DotGiamGiaPage/ZeroPromotionProductDetails";
import DotGiamGiaAdmin from "../../Pages/Admin/DotGiamGiaPage/DotGiamGiaAdmin";



const AdminQuanlyGiamGia = [
    <Route path="/quan-ly-giam-gia/dot-giam-gia" element={<DotGiamGiaAdmin />} />,
    <Route path="/quan-ly-giam-gia/phieu-giam-gia" element={<VoucherAdmin />} />,
    <Route path="/chi-tiet-voucher/:id" element={<VoucherAdminDetail />} />,

    <Route path="/quan-ly-tai-khoan" element={<AccountAdmin />} />,

    <Route path="/chi-tiet-dot-giam-gia/:id" element={<DotGiamGiaDetailAdmin />} />,
    
    <Route path="/ban-hang-tai-quay" element={<TaiQuayAdmin />} />,
    <Route path="/chi-tiet-dot-giam-gia/:id" element={<ZeroPromotionProductDetails />} />
  ];
  
  export default AdminQuanlyGiamGia;