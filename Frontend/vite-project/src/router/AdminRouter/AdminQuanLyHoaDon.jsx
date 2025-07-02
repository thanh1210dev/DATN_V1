import { Route } from "react-router-dom";
import BillAdmin from "../../Pages/Admin/HoaDonPage/BillAdmin";
import BillDetail from "../../Pages/Admin/HoaDonPage/BillDetail";

const AdminQuanLyHoaDon = [
    <Route path="/danh-sach-hoa-don" element={<BillAdmin />} />,
    <Route path="/bills/:id" element={<BillDetail />} />
    
  ];
  
  export default AdminQuanLyHoaDon;