import React, { useState, useEffect } from 'react';

export default function Avatar({ src, alt, className }) {
    // Ảnh mặc định nếu link gốc bị lỗi (Bạn nhớ copy 1 file ảnh vào public/images/default-avatar.png nhé)
    // Ảnh mặc định nếu link gốc bị lỗi (Bạn nhớ copy 1 file ảnh vào public/images/default-avatar.png nhé)
    // Sửa thành link online để tránh lỗi 404
    const fallbackImage = 'https://ui-avatars.com/api/?name=User&background=random';
    const [imgSrc, setImgSrc] = useState(src);

    useEffect(() => {
        setImgSrc(src); // Cập nhật lại nếu props thay đổi
    }, [src]);

    const handleError = () => {
        setImgSrc(fallbackImage);
    };

    return (
        <img
            src={imgSrc || fallbackImage}
            alt={alt || 'Avatar'}
            className={className}
            onError={handleError}
            // Thêm loading lazy để giảm tải
            loading="lazy"
        />
    );
}
