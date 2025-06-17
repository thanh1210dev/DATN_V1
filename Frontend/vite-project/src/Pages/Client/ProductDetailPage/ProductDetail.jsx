import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ProductImageGallery from "./ProductImageGallery";
import ProductInfo from "./ProductInfo";
import ProductService from "../../../Service/AdminProductSevice/ProductService";
import ProductDetailService from "../../../Service/AdminProductSevice/ProductDetailService";


const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [productDetails, setProductDetails] = useState([]);
  const [selectedDetail, setSelectedDetail] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productResponse, detailsResponse] = await Promise.all([
          ProductService.getById(id),
          ProductDetailService.getAll(id, 0, 10),
        ]);
        setProduct(productResponse);
        setProductDetails(detailsResponse.content || []);
        setSelectedDetail(detailsResponse.content[0] || null);
      } catch (error) {
        toast.error(error, { position: "top-right", autoClose: 3000 });
      }
    };
    fetchData();
  }, [id]);

  if (!product || !selectedDetail) {
    return <div className="p-6 text-center text-gray-500">Đang tải...</div>;
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <ToastContainer />
      <div className="max-w-7xl mx-auto bg-white shadow-lg rounded-xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <ProductImageGallery images={selectedDetail.images} />
          <ProductInfo
            product={product}
            productDetail={selectedDetail}
            productDetails={productDetails}
            setSelectedDetail={setSelectedDetail}
          />
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;