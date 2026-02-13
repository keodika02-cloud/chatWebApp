import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function EmployeeDirectory({ onSelectUser, onlineUsers }) {
    const [activeTab, setActiveTab] = useState('online'); // 'online', 'all', 'blocked'
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setLoading(true);
        // Fetch internal users (staff)
        axios.get('/ajax/users/internal')
            .then(res => {
                setUsers(res.data);
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    const filteredUsers = users
        .map(user => ({
            ...user,
            is_online: onlineUsers ? onlineUsers.has(user.id) : user.is_online
        }))
        .filter(user => {
            if (activeTab === 'online') return user.is_online;
            return true; // 'all'
        });

    return (
        <div className="flex flex-col h-full bg-white dark:bg-[#313338] text-gray-900 dark:text-gray-100">
            {/* Header */}
            <div className="h-12 border-b border-gray-200 dark:border-[#26272D] flex items-center px-4 shadow-sm shrink-0">
                <div className="flex items-center gap-2 mr-4">
                    <i className="fas fa-user-friends text-gray-500 text-lg"></i>
                    <span className="font-bold text-base">Bạn bè</span>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setActiveTab('online')}
                        className={`px-2 py-0.5 rounded hover:bg-gray-100 dark:hover:bg-[#393C43] transition ${activeTab === 'online' ? 'text-gray-900 dark:text-white font-bold bg-gray-200 dark:bg-[#393C43]' : 'text-gray-500'}`}
                    >
                        Trực tuyến
                    </button>
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`px-2 py-0.5 rounded hover:bg-gray-100 dark:hover:bg-[#393C43] transition ${activeTab === 'all' ? 'text-gray-900 dark:text-white font-bold bg-gray-200 dark:bg-[#393C43]' : 'text-gray-500'}`}
                    >
                        Tất cả
                    </button>
                    <button className="px-2 py-0.5 rounded text-gray-500 hover:bg-gray-100 dark:hover:bg-[#393C43] transition">
                        Đã chặn
                    </button>
                    <button className="px-2 py-0.5 rounded text-green-600 bg-green-50 dark:bg-green-900/20 font-bold text-xs">
                        Thêm bạn
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* List */}
                <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
                    <div className="text-xs font-bold text-gray-500 uppercase mb-3">
                        {activeTab === 'online' ? `Trực tuyến — ${filteredUsers.length}` : `Tất cả — ${filteredUsers.length}`}
                    </div>

                    {loading ? (
                        <div className="text-center py-4 text-gray-400">Đang tải...</div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 opacity-50">
                            <i className="fas fa-beer text-4xl mb-4 text-gray-300"></i>
                            <p>Không có ai {activeTab === 'online' ? 'online' : ''} cả.</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredUsers.map(user => (
                                <div
                                    key={user.id}
                                    onClick={() => onSelectUser({ target_id: user.id, name: user.name, avatar: user.avatar, is_customer: false })}
                                    className="flex items-center justify-between p-2 rounded hover:bg-gray-100 dark:hover:bg-[#393C43] cursor-pointer group border-t border-gray-100 dark:border-[#2B2D31]"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <img src={user.avatar} className="w-9 h-9 rounded-full object-cover bg-gray-300" />
                                            <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-[#313338] ${user.is_online ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                                        </div>
                                        <div>
                                            <div className="font-bold flex items-center gap-2">
                                                {user.name}
                                                <span className="hidden group-hover:inline text-[10px] text-gray-400">#{user.id}</span>
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                {user.custom_status || (user.is_online ? 'Đang online' : 'Offline')}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button className="w-8 h-8 rounded-full bg-gray-200 dark:bg-[#2B2D31] flex items-center justify-center hover:text-gray-900 dark:hover:text-white text-gray-500 transition">
                                            <i className="fas fa-comment"></i>
                                        </button>
                                        <button className="w-8 h-8 rounded-full bg-gray-200 dark:bg-[#2B2D31] flex items-center justify-center hover:text-gray-900 dark:hover:text-white text-gray-500 transition">
                                            <i className="fas fa-ellipsis-v"></i>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right Side (Active Now - Placeholder) */}
                <div className="hidden lg:block w-[360px] border-l border-gray-200 dark:border-[#26272D] p-4">
                    <h3 className="font-bold text-xl mb-4">Hoạt động mới</h3>
                    <div className="text-center mt-10">
                        <p className="font-bold mb-1">Chưa có gì mới</p>
                        <p className="text-sm text-gray-500 text-balance px-4">
                            Khi bạn bè bắt đầu hoạt động, chơi game hoặc chat, chúng sẽ hiện ở đây!
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
