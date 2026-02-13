import React from 'react';

export default function ChatDetails({ activeChat }) {
    if (!activeChat) return null;

    return (
        <aside className="w-80 border-l border-gray-200 bg-white hidden lg:flex flex-col h-full overflow-y-auto">
            {/* Avatar to ở giữa */}
            <div className="flex flex-col items-center pt-8 pb-4">
                <div className="relative">
                    <img
                        src={activeChat.partner_avatar || activeChat.avatar}
                        className="w-24 h-24 rounded-full object-cover border border-gray-100 shadow-sm"
                    />
                    {activeChat.is_online && (
                        <span className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 border-4 border-white rounded-full"></span>
                    )}
                </div>
                <h2 className="mt-3 font-bold text-gray-900 text-xl">{activeChat.partner_name || activeChat.name}</h2>
                <p className="text-xs text-gray-500 mt-1">Đang hoạt động</p>

                {/* 3 Nút tròn chức năng */}
                <div className="flex gap-4 mt-6">
                    <button className="flex flex-col items-center gap-1 group">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-gray-200 transition">
                            <i className="fas fa-user text-gray-800"></i>
                        </div>
                        <span className="text-xs text-gray-500">Trang cá nhân</span>
                    </button>
                    <button className="flex flex-col items-center gap-1 group">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-gray-200 transition">
                            <i className="fas fa-bell text-gray-800"></i>
                        </div>
                        <span className="text-xs text-gray-500">Tắt thông báo</span>
                    </button>
                    <button className="flex flex-col items-center gap-1 group">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-gray-200 transition">
                            <i className="fas fa-search text-gray-800"></i>
                        </div>
                        <span className="text-xs text-gray-500">Tìm kiếm</span>
                    </button>
                </div>
            </div>

            {/* Các mục Accordion (Giả lập) */}
            <div className="px-2 mt-2">
                <div className="p-3 hover:bg-gray-50 rounded-lg cursor-pointer flex justify-between items-center group">
                    <span className="font-medium text-sm text-gray-700">Tuỳ chỉnh đoạn chat</span>
                    <i className="fas fa-chevron-down text-gray-400 group-hover:text-gray-600"></i>
                </div>
                <div className="p-3 hover:bg-gray-50 rounded-lg cursor-pointer flex justify-between items-center group">
                    <span className="font-medium text-sm text-gray-700">File phương tiện & file</span>
                    <i className="fas fa-chevron-down text-gray-400 group-hover:text-gray-600"></i>
                </div>
                <div className="p-3 hover:bg-gray-50 rounded-lg cursor-pointer flex justify-between items-center group">
                    <span className="font-medium text-sm text-gray-700">Quyền riêng tư & hỗ trợ</span>
                    <i className="fas fa-chevron-down text-gray-400 group-hover:text-gray-600"></i>
                </div>
            </div>
        </aside>
    );
}