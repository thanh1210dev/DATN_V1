import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  HiOutlineChartPie,
  HiOutlineShoppingCart,
  HiOutlineReply,
  HiOutlineCube,
  HiOutlineDocumentReport,
  HiOutlineTag,
  HiOutlineUser,
  HiOutlineViewList,
  HiOutlineCollection,
  HiOutlinePhotograph,
  HiOutlineBeaker,
  HiOutlineAdjustments,
  HiOutlineColorSwatch,
  HiChevronDown,
  HiChevronUp,
} from "react-icons/hi";
import Logo from "../assets/image/image copy.png";
import { getRoleFromToken } from "../utils/auth";

function SideBar({ isOpen }) {
  const location = useLocation();
  const [role, setRole] = useState(null);
  const [expandedItems, setExpandedItems] = useState({});

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const roleFromToken = getRoleFromToken(token);
      setRole(roleFromToken);
    }
  }, []);

  const iconClass = "text-xl";

  const menuItems = [
    {
      label: "Thống Kê",
      path: "/admin/dashboard",
      icon: <HiOutlineChartPie className="text-purple-600" />,
    },
    {
      label: "Bán Hàng Tại Quầy",
      path: "/admin/ban-hang-tai-quay",
      icon: <HiOutlineShoppingCart className="text-pink-600" />,
    },
    {
      label: "Trả hàng",
      path: "/admin/tra-hang",
      icon: <HiOutlineReply className="text-red-500" />,
    },
    {
      label: "Quản Lý Sản Phẩm",
      icon: <HiOutlineCube className="text-green-600" />,
      subItems: [
        {
          label: "Danh Sách Sản Phẩm",
          path: "/admin/quan-ly-san-pham/danh-sach",
          icon: <HiOutlineViewList className="text-blue-600" />,
        },
        {
          label: "Thương Hiệu",
          path: "/admin/thuong-hieu",
          icon: <HiOutlineCollection className="text-teal-600" />,
        },
        {
          label: "Ảnh Sản Phẩm",
          path: "/admin/chanel",
          icon: <HiOutlinePhotograph className="text-indigo-600" />,
        },
        {
          label: "Chất Liệu",
          path: "/admin/materials",
          icon: <HiOutlineBeaker className="text-orange-600" />,
        },
        {
          label: "Kích Cỡ",
          path: "/admin/size",
          icon: <HiOutlineAdjustments className="text-rose-600" />,
        },
        {
          label: "Màu Sắc",
          path: "/admin/mau-sac",
          icon: <HiOutlineColorSwatch className="text-yellow-600" />,
        },
        {
          label: "Loại",
          path: "/admin/category",
          icon: <HiOutlineColorSwatch className="text-yellow-600" />,
        },
      ],
    },
    {
      label: "Danh Sách Hóa Đơn",
      path: "/admin/danh-sach-hoa-don",
      icon: <HiOutlineDocumentReport className="text-sky-600" />,
    },
    {
      label: "Quản Lý Giảm Giá",
      icon: <HiOutlineTag className="text-red-600" />,
      subItems: [
        {
          label: "Đợt Giảm Giá",
          path: "/admin/quan-ly-giam-gia/dot-giam-gia",
          icon: <HiOutlineTag className="text-red-500" />,
        },
        {
          label: "Phiếu Giảm Giá",
          path: "/admin/quan-ly-giam-gia/phieu-giam-gia",
          icon: <HiOutlineTag className="text-red-400" />,
        },
      ],
    },
    {
      label: "Quản Lý Tài Khoản",
      path: "/admin/quan-ly-tai-khoan",
      icon: <HiOutlineUser className="text-cyan-600" />,
    },
  ];

  const handleToggle = (label) => {
    setExpandedItems((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  return (
    <aside
      className={`fixed top-0 left-0 z-[100] h-full bg-white shadow-xl rounded-r-2xl transform transition-transform duration-300 
      ${isOpen ? "translate-x-0" : "-translate-x-full"} w-64 md:w-80 overflow-y-auto`}
    >
      <div className="px-4 pt-6 pb-4 flex items-center justify-center">
        <img src={Logo} alt="Logo" className="w-14 h-14 mr-3" />
        <span className="text-2xl font-bold text-purple-800">PoloViet</span>
      </div>

      <nav className="mt-6 px-3 space-y-2">
        {menuItems.map((item) => (
          <div key={item.label}>
            <Link
              to={item.path || "#"}
              onClick={() => item.subItems && handleToggle(item.label)}
              className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 no-underline
              ${location.pathname === item.path
                ? "bg-purple-200 text-black font-semibold"
                : "text-black hover:bg-gradient-to-r hover:from-purple-300 hover:to-purple-100 hover:font-semibold hover:shadow-md"}`}
            >
              <span className={iconClass}>{item.icon}</span>
              <span>{item.label}</span>
              {item.subItems && (
                <span className="ml-auto text-black">
                  {expandedItems[item.label] ? (
                    <HiChevronUp size={16} />
                  ) : (
                    <HiChevronDown size={16} />
                  )}
                </span>
              )}
            </Link>

            {item.subItems && (
              <div
                className={`ml-6 mt-1 space-y-1 transition-all duration-300 ease-in-out overflow-hidden 
                ${expandedItems[item.label] ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}
              >
                {item.subItems.map((subItem) => (
                  <Link
                    key={subItem.path}
                    to={subItem.path}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm no-underline transition-all duration-200
                    ${location.pathname === subItem.path
                      ? "bg-purple-100 text-black font-medium"
                      : "text-black hover:bg-purple-200 hover:font-semibold hover:shadow-sm"}`}
                  >
                    <span className={iconClass}>{subItem.icon}</span>
                    <span>{subItem.label}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
}

export default SideBar;
