import { Route } from "react-router-dom";
import ImageAdmin from "../../Pages/Admin/QuanlySanPhamPage/ProductDetail/ImageAdmin";
import BranchAdmin from "../../Pages/Admin/QuanlySanPhamPage/ProductDetail/BranchAdmin";
import SizeAdmin from "../../Pages/Admin/QuanlySanPhamPage/ProductDetail/SizeAdmin";
import ColorAdmin from "../../Pages/Admin/QuanlySanPhamPage/ProductDetail/ColorAdmin";
import MaterialAdmin from "../../Pages/Admin/QuanlySanPhamPage/ProductDetail/MaterialAdmin";
import CategoryAdmin from "../../Pages/Admin/QuanlySanPhamPage/ProductDetail/CategoryAdmin";
import ProductAdmin from "../../Pages/Admin/QuanlySanPhamPage/Product/ProductAdmin";
import ProductDetail from "../../Pages/Admin/QuanlySanPhamPage/ProductDetail/ProductDetail";

const AdminQuanLySanPham = [
    <Route path="/chanel" element={<ImageAdmin />} />,
    <Route path="/thuong-hieu" element={<BranchAdmin />} />,
    <Route path="/size" element={<SizeAdmin />} />,
    <Route path="/mau-sac" element={<ColorAdmin />} />,
    <Route path="/materials" element={<MaterialAdmin />} />,
    <Route path="/quan-ly-san-pham/danh-sach" element={<ProductAdmin />} />,
    <Route path="/category" element={<CategoryAdmin />} />,
    <Route path="/detail-product/:id" element={<ProductDetail />} />
    
  ];
  
  export default AdminQuanLySanPham;