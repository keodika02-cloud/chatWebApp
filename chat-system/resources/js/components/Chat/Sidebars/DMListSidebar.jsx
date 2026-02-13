import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Avatar from '../Common/Avatar';

export default function DMListSidebar({ onSelectUser, activeChat, onlineUsers = new Set(), currentUser }) {
    // 1. STATE QUẢN LÝ
    const [mainTab, setMainTab] = useState('customer'); // 'customer' (Khách) | 'internal' (Nội bộ)
    const [customerFilter, setCustomerFilter] = useState('mine'); // 'mine' (Của tôi) | 'unassigned' (Chờ xử lý)
    const [searchTerm, setSearchTerm] = useState('');

    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(false);

    // 2. HÀM GỌI API (Sửa để nhận keyword)
    const fetchConversations = (keyword = '') => {
        // Logic chọn filter gửi lên Server
        let apiFilter = 'mine';

        if (mainTab === 'customer') {
            apiFilter = customerFilter;
        } else {
            apiFilter = 'mine';
        }

        axios.get(`/ajax/conversations?filter=${apiFilter}&search=${keyword}`)
            .then(res => setConversations(res.data))
            .catch(err => console.error(err));
    };

    // Xử lý Real-time và Tải dữ liệu lần đầu
    useEffect(() => {
        fetchConversations(searchTerm);

        if (window.Echo && currentUser) {
            // Lắng nghe kênh riêng của User để cập nhật danh sách chat
            window.Echo.private(`App.Models.User.${currentUser.id}`)
                .listen('MessageSent', (e) => {
                    console.log("Có tin mới, đang cập nhật danh sách...", e);
                    fetchConversations(searchTerm);
                });
        }

        return () => {
            if (window.Echo && currentUser) {
                window.Echo.leave(`App.Models.User.${currentUser.id}`);
            }
        };
    }, [mainTab, customerFilter, currentUser?.id]); // Thêm dependencies cần thiết

    // Debounce search vẫn giữ nguyên để tối ưu input
    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            fetchConversations(searchTerm);
        }, 500);
        return () => clearTimeout(delayDebounce);
    }, [searchTerm]);

    // 3. LỌC DỮ LIỆU HIỂN THỊ (Frontend Filter)
    let displayList = [];

    if (mainTab === 'internal') {
        // TAB NỘI BỘ: Chỉ lấy conversation KHÔNG PHẢI khách hàng
        displayList = conversations.filter(c => !c.is_customer);
    } else {
        // TAB KHÁCH HÀNG:
        if (customerFilter === 'unassigned') {
            // Nếu đang xem "Chờ xử lý" -> API đã trả về đúng list rồi, chỉ cần hiển thị
            displayList = conversations;
        } else {
            // Nếu đang xem "Của tôi" -> Lọc bỏ nội bộ, chỉ lấy khách
            displayList = conversations.filter(c => c.is_customer);
        }
    }

    // 4. XỬ LÝ CLICK
    const handleClick = (conv) => {
        // 1. Cập nhật giao diện ngay lập tức (để số đỏ biến mất liền - Optimistic UI)
        const updatedList = conversations.map(c => {
            if (c.conversation_id === conv.conversation_id) {
                return { ...c, unread_count: 0 }; // Reset về 0 trên giao diện
            }
            return c;
        });
        setConversations(updatedList);

        // 2. GỌI SERVER ĐỂ LƯU VÀO DB (Quan trọng)
        // Lưu ý: convert id cho đúng
        axios.post(`/api/conversations/${conv.conversation_id}/read`)
            .then(response => {
                console.log("Đã lưu trạng thái đã đọc");
            })
            .catch(error => {
                console.error("Lỗi không lưu được:", error);
            });

        // 3. Chuyển nội dung chat sang người này
        onSelectUser({ ...conv, unread_count: 0 });
    };

    // 5. RENDER ITEM
    // 5. RENDER ITEM
    const renderItem = (conv) => {
        const isActive = activeChat?.conversation_id === conv.conversation_id;
        const hasUnread = conv.unread_count > 0;
        const isOnline = !conv.is_customer && onlineUsers.has(conv.target_id);

        // LOGIC MỚI: Ưu tiên lấy Avatar từ Social Account
        const avatarSrc = conv.social_account?.avatar
            || conv.avatar
            || "https://ui-avatars.com/api/?background=random&name=" + (conv.name || 'Khách');

        return (
            <div
                key={conv.conversation_id}
                onClick={() => handleClick(conv)}
                className={`group flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer transition relative mb-1 border-b border-gray-100
                    ${isActive ? 'bg-blue-50' : 'hover:bg-gray-100'}
                `}
            >
                <div className="relative flex-shrink-0">
                    {/* SỬA LẠI SRC Ở ĐÂY */}
                    <img
                        src={avatarSrc}
                        className="w-10 h-10 rounded-full object-cover border border-gray-200"
                        alt={conv.name}
                        onError={(e) => { e.target.onerror = null; e.target.src = "https://ui-avatars.com/api/?name=" + (conv.name || '?', "UTF-8") }}
                    />

                    {/* Icon Platform */}
                    {conv.type === 'facebook' && <div className="absolute -bottom-1 -right-1 bg-white p-[2px] rounded-full shadow"><i className="fab fa-facebook text-[#1877F2] text-[12px]"></i></div>}
                    {conv.type === 'zalo' && <span className="absolute -bottom-1 -right-1 bg-blue-500 text-white text-[8px] px-1 rounded-full font-bold shadow">Z</span>}
                    {/* Online Status */}
                    {isOnline && <div className="absolute top-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                        <span className={`text-sm truncate ${hasUnread ? 'font-extrabold text-gray-900' : 'font-medium text-gray-700'}`}>
                            {conv.name}
                        </span>
                        <span className={`text-[10px] ${hasUnread ? 'text-blue-600 font-bold' : 'text-gray-400'}`}>
                            {conv.time ? new Date(conv.time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                    </div>

                    <div className="flex justify-between items-center">
                        <p className={`text-xs truncate max-w-[140px] ${hasUnread ? 'font-bold text-gray-900' : 'text-gray-500'}`}>
                            {conv.last_message || 'Chưa có tin nhắn'}
                        </p>
                        {hasUnread && (
                            <span className="flex items-center justify-center min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold px-1 rounded-full shadow-sm">
                                {conv.unread_count > 99 ? '99+' : conv.unread_count}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full bg-white w-[280px] border-r border-gray-200">
            {/* 0. Ô TÌM KIẾM */}
            <div className="p-3 border-b border-gray-100 bg-[#F0F2F5]">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Tìm kiếm..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white border-none rounded-md py-1.5 pl-8 pr-3 text-sm focus:ring-1 focus:ring-blue-500 outline-none shadow-sm"
                    />
                    <i className="fas fa-search absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            <i className="fas fa-times-circle text-xs"></i>
                        </button>
                    )}
                </div>
            </div>

            {/* 1. THANH TAB CHÍNH (KHÁCH HÀNG vs CÔNG TY) */}
            <div className="flex p-2 gap-1 bg-[#F0F2F5]">
                <button
                    onClick={() => setMainTab('customer')}
                    className={`flex-1 py-2 text-xs font-bold uppercase rounded shadow-sm transition flex items-center justify-center gap-2
                        ${mainTab === 'customer' ? 'bg-white text-blue-600 border border-gray-200' : 'text-gray-500 hover:bg-white/50'}
                    `}
                >
                    <i className="fas fa-users"></i> Khách hàng
                </button>
                <button
                    onClick={() => setMainTab('internal')}
                    className={`flex-1 py-2 text-xs font-bold uppercase rounded shadow-sm transition flex items-center justify-center gap-2
                        ${mainTab === 'internal' ? 'bg-white text-orange-600 border border-gray-200' : 'text-gray-500 hover:bg-white/50'}
                    `}
                >
                    <i className="fas fa-building"></i> Công ty
                </button>
            </div>

            {/* 2. SUB-HEADER (Chỉ hiện khi ở Tab Khách Hàng) */}
            {mainTab === 'customer' && (
                <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-white">
                    <div className="flex gap-2">
                        <button
                            onClick={() => setCustomerFilter('mine')}
                            className={`text-xs px-2 py-1 rounded-full font-bold transition ${customerFilter === 'mine' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'}`}
                        >
                            Của tôi
                        </button>
                        <button
                            onClick={() => setCustomerFilter('unassigned')}
                            className={`text-xs px-2 py-1 rounded-full font-bold transition ${customerFilter === 'unassigned' ? 'bg-red-100 text-red-600' : 'text-gray-500 hover:bg-gray-100'}`}
                        >
                            Chờ xử lý
                        </button>
                    </div>
                    {/* Số lượng */}
                    <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 rounded">{displayList.length}</span>
                </div>
            )}

            {/* Header cho Tab Nội Bộ */}
            {mainTab === 'internal' && (
                <div className="px-3 py-2 border-b border-gray-100 bg-white flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-500">ĐỒNG NGHIỆP</span>
                    <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 rounded">{displayList.length}</span>
                </div>
            )}

            {/* 3. DANH SÁCH */}
            <div className="flex-1 overflow-y-auto px-2 pt-1 custom-scrollbar">
                {displayList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-gray-400 gap-2">
                        <i className={`fas fa-inbox text-2xl ${mainTab === 'internal' ? 'text-orange-200' : 'text-blue-200'}`}></i>
                        <span className="text-xs">Không có hội thoại</span>
                    </div>
                ) : (
                    displayList.map(conv => renderItem(conv))
                )}
            </div>
        </div>
    );
}