import React, { useState, useMemo } from 'react';
import UserBar from './UserBar';

export default function DMListSidebar({ conversations, activeChat, onSelectUser, currentUser, onLogout }) {
    const [searchTerm, setSearchTerm] = useState('');
    
    // --- LOGIC TÌM KIẾM ---
    // 1. Lấy tất cả chat Direct (Private)
    // 2. Lọc theo tên người dùng nhập
    // 3. Sắp xếp người nhắn gần nhất lên đầu
    const filteredConversations = useMemo(() => {
        return conversations
            .filter(c => 
                (c.type === 'direct' || c.type === 'private') && // Chỉ lấy chat riêng
                (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) // Tìm theo tên
            )
            .sort((a, b) => {
                const timeA = a.sort_time || 0;
                const timeB = b.sort_time || 0;
                return timeB - timeA; // Mới nhất lên đầu
            });
    }, [conversations, searchTerm]);

    return (
        <div className="w-[240px] bg-[#F2F3F5] dark:bg-[#2B2D31] flex flex-col h-full flex-shrink-0 transition-colors duration-200">
            
            {/* Header + Ô tìm kiếm */}
            <div className="h-12 shadow-sm flex items-center px-2.5 flex-shrink-0 border-b border-gray-200 dark:border-[#1E1F22]">
                <div className="relative w-full">
                    <input 
                        type="text"
                        placeholder="Tìm kiếm bạn bè..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white dark:bg-[#1E1F22] text-left text-gray-700 dark:text-gray-200 text-xs px-2 py-1.5 pl-7 rounded outline-none border border-gray-200 dark:border-transparent focus:border-blue-400 transition"
                    />
                    {/* Icon Search */}
                    <i className="fas fa-search absolute left-2 top-2 text-gray-400 text-xs"></i>
                    
                    {/* Nút X xóa tìm kiếm */}
                    {searchTerm && (
                        <i 
                            onClick={() => setSearchTerm('')}
                            className="fas fa-times absolute right-2 top-2 text-gray-400 hover:text-gray-600 cursor-pointer text-xs"
                        ></i>
                    )}
                </div>
            </div>

            {/* Danh sách Chat */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-2 pb-2 mt-2 space-y-[2px]">
                
                {/* Tiêu đề danh sách */}
                <div className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase px-2 mb-1 mt-2 flex justify-between">
                    <span>Tin nhắn trực tiếp</span>
                    <span className="text-xs bg-gray-200 dark:bg-black/20 px-1 rounded text-gray-500">
                        {filteredConversations.length}
                    </span>
                </div>
                
                {/* Loop danh sách */}
                {filteredConversations.length === 0 ? (
                    <div className="text-center text-xs text-gray-400 mt-4 italic">
                        Không tìm thấy ai
                    </div>
                ) : (
                    filteredConversations.map(conv => {
                        const isActive = activeChat && activeChat.conversation_id === conv.conversation_id;
                        
                        return (
                            <div
                                key={conv.conversation_id}
                                onClick={() => onSelectUser(conv)}
                                className={`flex items-center gap-3 px-2 py-2 rounded cursor-pointer group transition-all
                                    ${isActive 
                                        ? 'bg-gray-200 dark:bg-[#404249] text-black dark:text-white font-medium' 
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#35373C] hover:text-black dark:hover:text-gray-200'}
                                `}
                            >
                                {/* Avatar */}
                                <div className="relative">
                                    <img 
                                        src={conv.avatar} 
                                        className="w-8 h-8 rounded-full object-cover" 
                                        onError={(e) => e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(conv.name)}`}
                                    />
                                    {conv.is_online && (
                                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[#F2F3F5] dark:bg-[#2B2D31] rounded-full flex items-center justify-center">
                                            <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
                                        </div>
                                    )}
                                </div>
                                
                                {/* Tên + Tin nhắn cuối */}
                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                    <span className="text-sm truncate block leading-tight">
                                        {conv.name}
                                    </span>
                                    <span className={`text-[11px] truncate mt-0.5 ${conv.is_unread ? 'text-black dark:text-white font-bold' : 'text-gray-400'}`}>
                                        {conv.is_unread ? 'Tin nhắn mới' : conv.last_message}
                                    </span>
                                </div>

                                {/* Dấu Xóa (Ẩn hiện khi hover) - Optional */}
                                <div className="opacity-0 group-hover:opacity-100 transition">
                                    <i className="fas fa-times text-xs text-gray-400 hover:text-red-500"></i>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* UserBar ở đáy (Chứa nút Theme) */}
            <UserBar currentUser={currentUser} onLogout={onLogout} />
        </div>
    );
}