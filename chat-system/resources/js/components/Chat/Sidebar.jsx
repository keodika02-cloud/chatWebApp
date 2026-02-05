import React, { useState } from 'react';

export default function Sidebar({ conversations, activeChat, onSelectUser, loading }) {
    const [searchTerm, setSearchTerm] = useState('');
    const filteredConversations = conversations.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Header: Chữ "Đoạn chat" to */}
            <div className="px-4 pt-4 pb-2">
                <div className="flex justify-between items-center mb-3">
                    <h1 className="text-2xl font-bold text-gray-900">Đoạn chat</h1>
                    <div className="flex gap-2">
                        <button className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition"><i className="fas fa-ellipsis-h"></i></button>
                        <button className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition"><i className="fas fa-edit"></i></button>
                    </div>
                </div>

                {/* Ô tìm kiếm kiểu Messenger (Viên thuốc xám) */}
                <div className="relative">
                    <i className="fas fa-search absolute left-3 top-2.5 text-gray-500"></i>
                    <input 
                        type="text" 
                        placeholder="Tìm kiếm trên Messenger"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-[#f0f2f5] text-gray-700 rounded-full py-2 pl-10 pr-4 outline-none focus:ring-0 border-none placeholder-gray-500"
                    />
                </div>
            </div>

            {/* Danh sách User */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-2 space-y-1 mt-2">
                {filteredConversations.map(user => {
                    const isActive = activeChat?.target_id === user.target_id;
                    return (
                        <div key={user.target_id} onClick={() => onSelectUser(user)}
                             className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition 
                                ${isActive ? 'bg-blue-50' : 'hover:bg-gray-100'}`}>
                            
                            <div className="relative">
                                <img src={user.avatar} className="w-12 h-12 rounded-full object-cover" />
                                {user.is_online && <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white"></div>}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between">
                                    <h4 className={`font-medium text-[15px] ${isActive ? 'text-gray-900' : 'text-gray-900'}`}>{user.name}</h4>
                                    <span className="text-xs text-gray-500">{user.last_time}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <p className={`text-[13px] truncate ${user.conversation_id ? 'text-gray-500' : 'text-blue-600 font-medium'}`}>
                                        {user.last_message}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    );
}