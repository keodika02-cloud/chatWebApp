import React from 'react';
import Avatar from './Avatar';

export default function MessageBubble({ message, isMe, isStaff }) {
    // 1. Căn lề
    const alignClass = isStaff ? 'justify-end' : 'justify-start';

    // 2. Style bong bóng
    // - Nếu là ME (Tôi): Màu Gradient Xanh-Tím, bo tròn, góc dưới phải nhọn.
    // - Nếu là KHÁCH: Màu Xám nhạt, bo tròn, góc dưới trái nhọn.
    // - Nếu là ĐỒNG NGHIỆP: Màu Xanh nhạt.
    let bubbleStyle = '';
    let textStyle = '';

    if (isMe) {
        bubbleStyle = 'bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl rounded-br-none shadow-md';
        textStyle = 'text-white';
    } else if (isStaff) {
        bubbleStyle = 'bg-blue-50 border border-blue-100 rounded-2xl rounded-br-none';
        textStyle = 'text-blue-900';
    } else {
        // Khách hàng
        bubbleStyle = 'bg-white border border-gray-100 rounded-2xl rounded-bl-none shadow-sm';
        textStyle = 'text-gray-800';
    }

    // Fallback cho sender info
    const senderName = message.sender?.name || message.user?.name || 'Người dùng';

    // LOGIC AVATAR KHÁCH HÀNG: Ưu tiên lấy từ message.sender.avatar (được backend trả về)
    const senderAvatar = message.sender?.avatar || message.user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(senderName)}`;

    return (
        <div className={`flex w-full mt-4 gap-3 ${alignClass} group`}>

            {/* Avatar Khách (Bên trái) */}
            {!isStaff && (
                <div className="flex flex-col justify-end">
                    <img
                        src={senderAvatar}
                        className="w-8 h-8 rounded-full border border-gray-200 shadow-sm object-cover"
                        alt={senderName}
                        onError={(e) => { e.target.onerror = null; e.target.src = "https://ui-avatars.com/api/?name=Khách" }}
                    />
                </div>
            )}

            <div className={`flex flex-col max-w-[75%] ${isStaff ? 'items-end' : 'items-start'}`}>

                {/* Tên người nhắn (Chỉ hiện khi hover hoặc là nhóm) */}
                {isStaff && !isMe && (
                    <span className="text-[10px] text-gray-400 mb-1 mr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {senderName}
                    </span>
                )}

                {/* BONG BÓNG CHAT CHÍNH */}
                <div className={`px-4 py-2.5 text-[14px] leading-relaxed break-words ${bubbleStyle} ${textStyle}`}>
                    {/* Attachments Logic Preserved */}
                    {message.attachment_type === 'image' && message.attachment_path && (
                        <div className="mb-2 -mx-2 -mt-2">
                            <img
                                src={message.attachment_path}
                                alt="attachment"
                                className="max-w-full rounded-t-xl cursor-pointer hover:opacity-90 transition"
                                onClick={() => window.open(message.attachment_path, '_blank')}
                                style={{ maxHeight: '200px', width: '100%', objectFit: 'cover' }}
                            />
                        </div>
                    )}
                    {message.attachment_type === 'file' && message.attachment_path && (
                        <div className={`flex items-center gap-2 mb-2 p-2 rounded-lg cursor-pointer ${isMe ? 'bg-white/20' : 'bg-black/5'} hover:bg-black/10`} onClick={() => window.open(message.attachment_path, '_blank')}>
                            <i className="fas fa-file text-xl"></i>
                            <span className="truncate text-xs underline">{message.attachment_name || 'File đính kèm'}</span>
                        </div>
                    )}

                    {message.body}
                </div>

                {/* Thời gian (Hiện nhỏ xíu bên dưới) */}
                <span className="text-[10px] text-gray-300 mt-1 ml-1 select-none opacity-0 group-hover:opacity-100 transition-opacity">
                    {message.created_at ? (message.created_at.includes(':') ? message.created_at : new Date(message.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })) : ''}
                </span>
            </div>

            {/* Avatar Nhân viên (Bên phải) */}
            {isStaff && (
                <div className="flex flex-col justify-end">
                    <img src={senderAvatar} className="w-8 h-8 rounded-full border border-indigo-100 shadow-sm object-cover" />
                </div>
            )}
        </div>
    );
}
