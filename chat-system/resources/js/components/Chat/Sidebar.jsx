import React, { useState, useRef, useEffect, useMemo } from 'react';
import CreateGroupModal from './CreateGroupModal';

export default function Sidebar({ conversations, activeChat, onSelectUser, loading, onReload }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [showCreateGroup, setShowCreateGroup] = useState(false);
    const popupRef = useRef(null); 

    useEffect(() => {
        function handleClickOutside(event) {
            if (popupRef.current && !popupRef.current.contains(event.target)) {
                setShowCreateGroup(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [popupRef]);

    // --- LOGIC SẮP XẾP CHUẨN ---
    const sortedConversations = useMemo(() => {
        // Luôn sắp xếp tin nhắn mới nhất lên đầu
        return [...conversations].sort((a, b) => {
            const timeA = a.sort_time || 0;
            const timeB = b.sort_time || 0;
            return timeB - timeA;
        });
    }, [conversations]);

    // --- LOGIC TÌM KIẾM ---
    const displayConversations = useMemo(() => {
        if (!searchTerm.trim()) return sortedConversations;
        return sortedConversations.filter(conv => 
            (conv.name || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [sortedConversations, searchTerm]);

    const clearSearch = () => setSearchTerm('');

    return (
        <aside className="flex flex-col h-full relative bg-white">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2 shrink-0">
                <div className="relative flex-1">
                    <input
                        type="text"
                        placeholder="Tìm kiếm..."
                        className="w-full bg-[#f0f2f5] text-[15px] rounded-full px-4 py-2 pl-9 pr-8 focus:outline-none focus:ring-1 focus:ring-blue-300 transition-all placeholder-gray-500 text-gray-700"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <i className="fas fa-search absolute left-3 top-3 text-gray-400 text-xs"></i>
                    {searchTerm && (
                        <button onClick={clearSearch} className="absolute right-2 top-1/2 -translate-y-1/2 bg-gray-200 rounded-full w-5 h-5 flex items-center justify-center hover:bg-gray-300">
                            <i className="fas fa-times text-[10px] text-gray-600"></i>
                        </button>
                    )}
                </div>
                
                {!searchTerm && (
                    <div className="relative" ref={popupRef}> 
                        <button 
                            onClick={() => setShowCreateGroup(!showCreateGroup)}
                            className={`w-9 h-9 rounded-full flex items-center justify-center transition shadow-sm
                                ${showCreateGroup ? 'bg-blue-100 text-blue-600' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'}`}
                        >
                            <i className="fas fa-edit"></i>
                        </button>
                        {showCreateGroup && (
                            <div className="absolute top-11 right-0 z-50 drop-shadow-xl animate-fadeIn origin-top-right">
                                <div className="absolute -top-1.5 right-3 w-3 h-3 bg-white rotate-45 border-l border-t border-gray-200"></div>
                                <CreateGroupModal 
                                    onClose={() => setShowCreateGroup(false)} 
                                    onGroupCreated={() => { setShowCreateGroup(false); if(onReload) onReload(); }}
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* List Chat */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                {!loading && displayConversations.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-40 text-gray-400 text-sm">
                        {searchTerm ? 'Không tìm thấy kết quả' : 'Bạn chưa có tin nhắn nào'}
                        {!searchTerm && <p className="text-xs mt-1">Hãy tìm kiếm người dùng để bắt đầu chat</p>}
                    </div>
                )}

                {displayConversations.map(conv => {
                    const isActive = activeChat && activeChat.conversation_id === conv.conversation_id;
                    const isGroup = conv.type === 'group';

                    return (
                        <div
                            key={conv.conversation_id}
                            onClick={() => onSelectUser(conv)}
                            className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all duration-200 relative group
                                ${isActive ? 'bg-blue-50' : 'hover:bg-gray-100'}
                            `}
                        >
                            {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] bg-blue-600 rounded-r-full"></div>}
                            
                            <div className="relative shrink-0 ml-1.5">
                                <img src={conv.avatar} className={`w-12 h-12 border border-gray-100 object-cover ${isGroup ? 'rounded-xl' : 'rounded-full'}`} />
                                {conv.is_online && !isGroup && <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></span>}
                            </div>

                            <div className="flex-1 min-w-0 pr-1">
                                <div className="flex justify-between items-center mb-0.5">
                                    <h4 className={`font-semibold text-[15px] truncate ${isActive ? 'text-gray-900' : 'text-gray-900'}`}>{conv.name}</h4>
                                    <span className="text-[11px] text-gray-400 shrink-0">{conv.last_time}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <p className={`text-[13px] truncate flex-1 ${isActive ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                                        {isGroup && !conv.last_message.includes(':') && <span className="text-gray-400 text-[10px] mr-1 border px-1 rounded bg-gray-50">Nhóm</span>} 
                                        {conv.last_message}
                                    </p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </aside>
    );
}