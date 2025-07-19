import React, { useState, useEffect } from 'react';
import { HiOutlinePlus, HiOutlinePencilAlt, HiOutlineTrash } from 'react-icons/hi';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import CategoryService from '../../../../Service/AdminProductSevice/CategoryService';


const CategoryAdmin = () => {
  const [categories, setCategories] = useState([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ code: '', name: '', image: null });
  const [previewImage, setPreviewImage] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // Function to generate random 5-character code
  const generateRandomCode = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 5; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const data = await CategoryService.getAll(page, size);
      setCategories(data.content);
      setTotalPages(data.totalPages);
    } catch (error) {
      toast.error(error);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [page, size]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle image file change
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    // Thu hồi object URL cũ nếu có
    if (previewImage && previewImage.startsWith('blob:')) {
      URL.revokeObjectURL(previewImage);
    }
    setFormData((prev) => ({ ...prev, image: file }));
    setPreviewImage(file ? URL.createObjectURL(file) : null);
  };

  // Handle add new category
  const handleAdd = () => {
    setIsModalOpen(true);
    setIsEditing(false);
    setFormData({ code: generateRandomCode(), name: '', image: null });
    setPreviewImage(null);
  };

  // Handle update category
  const handleUpdate = (category) => {
    setIsModalOpen(true);
    setIsEditing(true);
    setEditingId(category.id);
    setFormData({ code: category.code, name: category.name, image: category.imageUrl || null });
    setPreviewImage(category.imageUrl ? `http://localhost:8080${category.imageUrl}` : null);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let data = new FormData();
      data.append(
        'category',
        new Blob([JSON.stringify({
          code: formData.code,
          name: formData.name
        })], { type: 'application/json' })
      );
      if (formData.image && typeof formData.image !== 'string') {
        data.append('image', formData.image);
      }
      if (isEditing) {
        await CategoryService.update(editingId, data);
        toast.success('Cập nhật danh mục thành công!');
      } else {
        await CategoryService.create(data);
        toast.success('Thêm danh mục thành công!');
      }
      setIsModalOpen(false);
      fetchCategories();
      setPreviewImage(null);
    } catch (error) {
      toast.error(error);
    }
  };

  // Handle delete category
  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await CategoryService.delete(deleteId);
      toast.success('Xóa danh mục thành công!');
      setIsDeleteModalOpen(false);
      fetchCategories();
    } catch (error) {
      toast.error(error);
    }
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setPreviewImage(null);
  };

  return (
    <div className="p-6">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnHover theme="light" />
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Quản lý danh mục</h2>
        <button
          onClick={handleAdd}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
        >
          <HiOutlinePlus className="mr-2" size={16} />
          Thêm mới
        </button>
      </div>

      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <table className="w-full text-sm text-left text-gray-700">
          <thead className="text-xs font-semibold uppercase bg-indigo-50 text-indigo-700">
            <tr>
              <th className="px-6 py-3 w-16 rounded-tl-lg">#</th>
              <th className="px-6 py-3 w-32">Mã</th>
              <th className="px-6 py-3">Tên</th>
              <th className="px-6 py-3 w-24">Ảnh</th>
              <th className="px-6 py-3 w-32 rounded-tr-lg">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-gray-500 text-sm">
                  Không có dữ liệu
                </td>
              </tr>
            ) : (
              categories.map((item, index) => (
                <tr
                  key={item.id}
                  className="border-b hover:bg-indigo-50 transition-colors"
                >
                  <td className="px-6 py-3 text-center">{page * size + index + 1}</td>
                  <td className="px-6 py-3">{item.code}</td>
                  <td className="px-6 py-3">{item.name}</td>
                  <td className="px-6 py-3 text-center">
                    {item.imageUrl ? (
                      <img
                        src={`http://localhost:8080${item.imageUrl}`}
                        alt="Ảnh danh mục"
                        className="h-12 w-12 object-cover rounded-md border border-gray-300 mx-auto"
                      />
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-center flex justify-center gap-2">
                    <button
                      onClick={() => handleUpdate(item)}
                      className="p-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                    >
                      <HiOutlinePencilAlt size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(item.id)}
                      className="p-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                    >
                      <HiOutlineTrash size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            disabled={page === 0}
          >
            ← Trước
          </button>
          <span className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 text-sm">
            Trang {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages - 1))}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            disabled={page + 1 >= totalPages}
          >
            Tiếp →
          </button>
        </div>
        <select
          className="bg-white text-gray-700 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={size}
          onChange={(e) => {
            setSize(parseInt(e.target.value));
            setPage(0);
          }}
        >
          <option value={5}>5 / trang</option>
          <option value={10}>10 / trang</option>
          <option value={20}>20 / trang</option>
          <option value={50}>50 / trang</option>
        </select>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 w-full max-w-md shadow-xl">
            <h3 className="text-xl font-semibold mb-6 text-gray-800">
              {isEditing ? 'Cập nhật danh mục' : 'Thêm danh mục mới'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-1">Mã danh mục</label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  className="block w-full rounded-lg border border-gray-300 shadow-sm px-4 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 bg-gray-50 transition-colors"
                  disabled={!isEditing}
                  required
                  maxLength={50}
                />
              </div>
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên danh mục</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="block w-full rounded-lg border border-gray-300 shadow-sm px-4 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 transition-colors"
                  required
                  maxLength={100}
                />
              </div>
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-1">Ảnh danh mục</label>
                <div className="flex gap-2 items-center mb-2">
                  <button
                    type="button"
                    onClick={() => document.getElementById('category-image-input').click()}
                    className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                  >
                    Chọn ảnh
                  </button>
                  <input
                    id="category-image-input"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  {previewImage && (
                    <img
                      src={previewImage}
                      alt="Preview"
                      className="h-16 w-16 object-cover rounded-md border border-gray-300"
                    />
                  )}
                </div>
                {previewImage && (
                  <button
                    type="button"
                    onClick={() => {
                      if (previewImage && previewImage.startsWith('blob:')) {
                        URL.revokeObjectURL(previewImage);
                      }
                      setFormData((prev) => ({ ...prev, image: null }));
                      setPreviewImage(null);
                    }}
                    className="text-xs text-red-500 hover:underline mt-1"
                  >
                    Xóa ảnh đã chọn
                  </button>
                )}
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 focus:outline-none transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                >
                  {isEditing ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-5 rounded-lg shadow-xl w-full max-w-sm transform transition-all duration-300">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Xác nhận xóa</h3>
            <p className="text-sm text-gray-600 mb-4">
              Bạn có chắc chắn muốn xóa danh mục này không?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-3 py-1.5 bg-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Hủy
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryAdmin;