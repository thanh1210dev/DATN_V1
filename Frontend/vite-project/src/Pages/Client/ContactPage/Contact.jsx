import React from 'react';

const Contact = () => {

  return (
    <div className='max-w-3xl mx-auto p-4'>
      <h1 className='text-2xl font-semibold mb-6'>Liên Hệ</h1>
      <div className='bg-white p-5 rounded shadow mb-6'>
        <h2 className='font-medium mb-2'>Thông Tin Liên Lạc</h2>
        <ul className='text-sm space-y-1 text-gray-700'>
          <li><strong>Địa chỉ:</strong> 123 Đường PoloViet, Hà Nội</li>
          <li><strong>Email:</strong> support@poloviet.vn</li>
          <li><strong>Điện thoại:</strong> 0123 456 789</li>
          <li><strong>Thời gian:</strong> 08:00 - 21:00 (T2 - CN)</li>
        </ul>
      </div>
      <div className='bg-white p-5 rounded shadow'>
        <h2 className='font-medium mb-2'>Bản Đồ</h2>
        <iframe
          title='map'
            className='w-full h-80 rounded'
            src='https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3723.912541167911!2d105.81432331540201!3d21.03576179294439!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3135ab7b9a9f4b7f%3A0x2f8d0c6b9a!2zSG_DoG5nIEPhu5UgUXXhuqNuIFRo4buJIFBow7pj!5e0!3m2!1svi!2s!4v0000000000000'
            allowFullScreen
            loading='lazy'
            referrerPolicy='no-referrer-when-downgrade'
          />
      </div>
    </div>
  );
};

export default Contact;
