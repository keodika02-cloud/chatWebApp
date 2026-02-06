import React, { useState } from 'react';
import axios from 'axios';

export default function NavBar({ currentUser }) {
    // State: false = Thu gọn (chỉ hiện icon), true = Mở rộng (hiện chữ)
    const [isExpanded, setIsExpanded] = useState(false); 
    const [activeTab, setActiveTab] = useState('chats'); // Tab đang chọn

    // Danh sách menu chính
    const menuItems = [
        { id: 'chats', icon: 'fas fa-comment-dots', label: 'Đoạn chat' },
        { id: 'people', icon: 'fas fa-user-friends', label: 'Danh bạ' },
        { id: 'marketplace', icon: 'fas fa-store', label: 'Marketplace' },
        { id: 'requests', icon: 'fas fa-envelope-open-text', label: 'Tin nhắn chờ' },
    ];

    // Xử lý Đăng xuất
    const handleLogout = async () => {
        if (!confirm('Bạn chắc chắn muốn đăng xuất?')) return;
        try {
            await axios.post('/logout');
            window.location.href = '/'; // Quay về trang chủ/login
        } catch (error) {
            console.error("Lỗi đăng xuất", error);
            // Fallback: Tạo form ẩn để submit (cách truyền thống của Laravel nếu axios lỗi CSRF)
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = '/logout';
            const token = document.querySelector('meta[name="csrf-token"]')?.content;
            if (token) {
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = '_token';
                input.value = token;
                form.appendChild(input);
            }
            document.body.appendChild(form);
            form.submit();
        }
    };

    // Kiểm tra quyền Admin (Sửa logic này khớp với DB của bạn)
    const isAdmin = currentUser.role === 'admin' || currentUser.type === 'admin' || currentUser.is_admin === 1;

    return (
        <nav 
            className={`h-full bg-white border-r border-gray-200 flex flex-col justify-between transition-all duration-300 ease-in-out z-30 shadow-sm
            ${isExpanded ? 'w-[240px]' : 'w-[68px]'}`}
        >
            {/* --- PHẦN TRÊN: MENU --- */}
            <div className="flex flex-col gap-2 p-3">
                
                {/* 1. Nút Toggle (3 gạch) */}
                <div className="mb-2 flex items-center justify-center">
                    <button 
                        onClick={() => setIsExpanded(!isExpanded)}
                        className={`h-10 w-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-all text-gray-600
                        ${isExpanded ? 'ml-auto mr-0' : 'mx-auto'}`}
                        title={isExpanded ? "Thu gọn" : "Mở rộng"}
                    >
                        <i className={`fas ${isExpanded ? 'fa-indent' : 'fa-bars'} text-xl`}></i>
                    </button>
                </div>

                {/* 2. Danh sách Menu Items */}
                {menuItems.map(item => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`flex items-center h-11 rounded-lg transition-all overflow-hidden group relative
                            ${activeTab === item.id ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100 text-gray-600'}
                            ${isExpanded ? 'px-3 gap-3 w-full' : 'justify-center w-10 mx-auto'}
                        `}
                    >
                        {/* Icon */}
                        <div className={`flex items-center justify-center w-6 h-6 shrink-0`}>
                            <i className={`${item.icon} text-xl`}></i>
                        </div>

                        {/* Label (Chỉ hiện khi mở rộng) */}
                        <span className={`whitespace-nowrap font-medium text-[15px] transition-opacity duration-200 ml-3
                            ${isExpanded ? 'opacity-100 delay-75' : 'opacity-0 w-0 hidden'}
                        `}>
                            {item.label}
                        </span>

                        {/* Tooltip khi thu gọn */}
                        {!isExpanded && (
                            <div className="absolute left-12 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition pointer-events-none z-50 whitespace-nowrap shadow-lg">
                                {item.label}
                            </div>
                        )}
                    </button>
                ))}
            </div>

            {/* --- PHẦN DƯỚI: ADMIN & USER --- */}
            <div className="p-3 flex flex-col gap-1 border-t border-gray-100 bg-gray-50/50">
                
                {/* 3. Nút Admin Dashboard (Chỉ hiện nếu là Admin) */}
                {isAdmin && (
                    <a 
                        href="/admin" // Link tới trang Admin của bạn
                        className={`flex items-center h-10 rounded-lg transition-all hover:bg-red-50 text-red-600 mb-1 group relative
                            ${isExpanded ? 'px-3 gap-3 w-full' : 'justify-center w-10 mx-auto'}
                        `}
                    >
                        <i className="fas fa-user-shield text-lg shrink-0"></i>
                        <span className={`whitespace-nowrap font-bold text-[14px] ml-3 ${isExpanded ? 'block' : 'hidden'}`}>
                            Quản trị
                        </span>
                        {!isExpanded && (
                            <div className="absolute left-12 bg-red-600 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition z-50 whitespace-nowrap">
                                Vào trang Admin
                            </div>
                        )}
                    </a>
                )}

                {/* 4. Avatar User (Chỉ để hiển thị) */}
                <div className={`flex items-center h-12 rounded-lg transition-all overflow-hidden hover:bg-gray-200 cursor-pointer group relative
                        ${isExpanded ? 'px-2 gap-3 w-full' : 'justify-center w-10 mx-auto'}
                    `}
                >
                    <img 
                        src={currentUser.avatar_url || `https://ui-avatars.com/api/?name=${currentUser.name}`} 
                        alt="User" 
                        className="w-8 h-8 rounded-full object-cover border border-gray-300 shrink-0"
                    />
                    
                    <div className={`flex flex-col items-start transition-opacity duration-200 overflow-hidden ml-2
                        ${isExpanded ? 'opacity-100' : 'opacity-0 w-0 hidden'}
                    `}>
                        <span className="font-bold text-sm text-gray-800 truncate max-w-[140px]">{currentUser.name}</span>
                        <span className="text-[10px] text-green-600 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Online
                        </span>
                    </div>

                    {!isExpanded && (
                        <div className="absolute left-12 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition z-50 whitespace-nowrap">
                            {currentUser.name}
                        </div>
                    )}
                </div>

                {/* 5. Nút Đăng xuất */}
                <button 
                    onClick={handleLogout}
                    className={`flex items-center h-10 rounded-lg transition-all hover:bg-gray-200 text-gray-500 group relative
                        ${isExpanded ? 'px-3 gap-3 w-full' : 'justify-center w-10 mx-auto'}
                    `}
                >
                    <i className="fas fa-sign-out-alt text-lg shrink-0"></i>
                    <span className={`whitespace-nowrap font-medium text-[14px] ml-3 ${isExpanded ? 'block' : 'hidden'}`}>
                        Đăng xuất
                    </span>
                    {!isExpanded && (
                        <div className="absolute left-12 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition z-50 whitespace-nowrap">
                            Đăng xuất
                        </div>
                    )}
                </button>
            </div>
        </nav>
    );
}