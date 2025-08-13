import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../../Service/axiosInstance';

const BestSellers = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get('/products/best-seller');
        if (!active) return;
        setItems(res.data?.content || []);
      } catch (e) {
        setError(e?.response?.data || 'Không tải được sản phẩm bán chạy');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  if (loading) return <div className='p-6 text-gray-500'>Đang tải...</div>;
  if (error) return <div className='p-6 text-red-600 text-sm'>{String(error)}</div>;

  return (
    <div className='max-w-7xl mx-auto p-4'>
      <h1 className='text-2xl font-semibold mb-4'>Sản phẩm bán chạy</h1>
      {items.length === 0 && <div className='text-sm text-gray-500'>Chưa có dữ liệu.</div>}
      <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4'>
        {items.map(p => (
          <Link key={p.id} to={`/product/${p.id}`} className='border rounded-lg bg-white group hover:shadow-md transition overflow-hidden'>
            <div className='aspect-square bg-gray-100 flex items-center justify-center overflow-hidden'>
              {p.thumbnailUrl ? (
                <img src={p.thumbnailUrl} alt={p.name} className='w-full h-full object-cover group-hover:scale-105 transition' />
              ) : (
                <span className='text-xs text-gray-400'>No Image</span>
              )}
            </div>
            <div className='p-2 space-y-1'>
              <div className='text-sm font-medium line-clamp-2 min-h-[32px]'>{p.name}</div>
              <div className='text-purple-600 font-semibold text-sm'>{p.price?.toLocaleString()} ₫</div>
              {p.soldQuantity != null && (
                <div className='text-[11px] text-gray-500'>Đã bán: {p.soldQuantity}</div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default BestSellers;
