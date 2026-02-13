import React, { useState } from 'react';
import CreateGroupModal from '../Modals/CreateGroupModal';

export default function ServerRail({ conversations, activeChat, onSelectChat, onGoHome }) {
    const [showCreateGroup, setShowCreateGroup] = useState(false);

    const groups = conversations.filter(c => c.type === 'group');
    const isHomeActive = !activeChat || activeChat.type === 'direct' || activeChat.type === 'private';

    return (
        <nav className="w-[72px] bg-[#E3E5E8] dark:bg-[#1E1F22] flex flex-col items-center py-3 gap-2 h-full overflow-y-auto custom-scrollbar flex-shrink-0 transition-colors duration-200 z-30">

            {/* 1. NÚT HOME (LOGO) */}
            <div className="relative group">
                <div className={`absolute -left-4 top-1/2 -translate-y-1/2 w-2 h-10 bg-primary rounded-r-lg transition-all duration-200 
                    ${isHomeActive ? 'h-10 opacity-100' : 'h-2 opacity-0 group-hover:opacity-50 group-hover:h-5'}`}>
                </div>

                <button
                    onClick={onGoHome}
                    className="w-12 h-12 rounded-[24px] group-hover:rounded-[16px] flex items-center justify-center transition-all duration-200 overflow-hidden shadow-sm bg-white dark:bg-[#313338]"
                    title="Trang chủ / Tin nhắn"
                >
                    <img
                        src="/logo.png"
                        alt="Home"
                        className="w-8 h-8 object-contain"
                    />
                </button>
            </div>

            <div className="w-8 h-[2px] bg-gray-300 dark:bg-[#35363C] rounded-lg my-1"></div>

            {/* 2. DANH SÁCH NHÓM */}
            {groups.map(group => {
                const isActive = activeChat && activeChat.conversation_id === group.conversation_id;
                return (
                    <div key={group.conversation_id} className="relative group w-full flex justify-center mb-1">
                        <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 bg-primary rounded-r-lg transition-all duration-200 
                            ${isActive ? 'h-10 opacity-100' : 'h-2 opacity-0 group-hover:opacity-100 group-hover:h-5'}`}>
                        </div>

                        <button
                            onClick={() => onSelectChat(group)}
                            className={`w-12 h-12 flex items-center justify-center transition-all duration-200 cursor-pointer overflow-hidden bg-gray-200 dark:bg-[#313338]
                                ${isActive ? 'rounded-[16px]' : 'rounded-[24px] group-hover:rounded-[16px]'}
                            `}
                            title={group.name}
                        >
                            <img
                                src={group.avatar}
                                className="w-full h-full object-cover"
                                onError={(e) => e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(group.name)}`}
                            />
                        </button>
                    </div>
                );
            })}

            {/* 3. NÚT TẠO NHÓM (+) */}
            <div className="relative group mt-2">
                <button
                    onClick={() => setShowCreateGroup(true)}
                    className={`w-12 h-12 rounded-[24px] flex items-center justify-center transition-all duration-200
                        ${showCreateGroup
                            ? 'bg-primary text-white rounded-[16px]'
                            : 'bg-white dark:bg-[#313338] text-primary group-hover:bg-primary group-hover:text-white group-hover:rounded-[16px]'}
                    `}
                    title="Thêm nhóm mới"
                >
                    <i className="fas fa-plus text-xl"></i>
                </button>
            </div>

            {/* --- MODAL TẠO NHÓM --- */}
            {showCreateGroup && (
                <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4 animate-fadeIn">
                    <div className="relative">
                        <CreateGroupModal
                            onClose={() => setShowCreateGroup(false)}
                            onGroupCreated={() => {
                                setShowCreateGroup(false);
                                if (window.location.reload) window.location.reload();
                            }}
                        />
                    </div>
                </div>
            )}
        </nav>
    );
}