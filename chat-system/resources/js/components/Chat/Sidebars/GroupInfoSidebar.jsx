import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

export default function GroupInfoSidebar({ activeChat, currentUser }) {
    const [members, setMembers] = useState([]);
    const [isEditingName, setIsEditingName] = useState(false);
    const [groupName, setGroupName] = useState(activeChat.name);
    const [nameInput, setNameInput] = useState(activeChat.name);

    // Add Member States
    const [isAdding, setIsAdding] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);

    const sidebarRef = useRef(null);

    useEffect(() => {
        if (activeChat?.conversation_id) {
            setGroupName(activeChat.name);
            setNameInput(activeChat.name);
            fetchMembers();
            setIsAdding(false);
            setSearchTerm('');
            setSearchResults([]);
        }
    }, [activeChat]);

    const fetchMembers = async () => {
        try {
            const res = await axios.get(`/ajax/conversations/${activeChat.conversation_id}/members`);
            setMembers(res.data);
        } catch (error) {
            console.error("Failed to load members", error);
        }
    };

    const handleRename = async () => {
        if (!nameInput.trim() || nameInput === groupName) {
            setIsEditingName(false);
            return;
        }
        try {
            await axios.put(`/ajax/conversations/${activeChat.conversation_id}/name`, { name: nameInput });
            setGroupName(nameInput);
            setIsEditingName(false);
            // Optionally trigger a global refresh if needed, but local state update is fast
        } catch (error) {
            toast.error('❌ Lỗi đổi tên nhóm');
        }
    };

    const handleSearchUser = async (e) => {
        const query = e.target.value;
        setSearchTerm(query);
        if (query.length > 1) {
            try {
                const res = await axios.get(`/ajax/users/search?q=${query}`);
                // Filter out existing members
                const existingIds = new Set(members.map(m => m.id));
                const filtered = res.data.filter(u => !existingIds.has(u.id));
                setSearchResults(filtered);
            } catch (error) {
                console.error(error);
            }
        } else {
            setSearchResults([]);
        }
    };

    const handleAddMember = async (user) => {
        try {
            await axios.post(`/ajax/conversations/${activeChat.conversation_id}/members`, {
                members: [user.id]
            });
            fetchMembers();
            setSearchTerm('');
            setSearchResults([]);
            toast.success(`✅ Đã thêm ${user.name}`);
        } catch (error) {
            toast.error('❌ Lỗi thêm thành viên');
        }
    };

    const handleRemoveMember = async (userId) => {
        if (!confirm('Bạn có chắc muốn mời người này ra khỏi nhóm?')) return;
        try {
            await axios.delete(`/ajax/conversations/${activeChat.conversation_id}/members/${userId}`);
            setMembers(members.filter(m => m.id !== userId));
        } catch (error) {
            toast.error('❌ Lỗi xóa thành viên');
        }
    };

    const handleLeaveGroup = async () => {
        if (!confirm('Bạn có chắc muốn rời nhóm này?')) return;
        try {
            await axios.post(`/ajax/conversations/${activeChat.conversation_id}/leave`);
            window.location.reload(); // Simple way to reset state/view
        } catch (error) {
            toast.error(error.response?.data?.error || '❌ Lỗi rời nhóm');
        }
    };

    const isAdmin = members.find(m => m.id === currentUser.id)?.role === 'admin' || members.find(m => m.id === currentUser.id)?.is_owner;
    // Current user's ownership check might be safer against the activeChat.owner_id if available, but members list has is_owner source of truth.
    // Also check if currentUser is the owner to allow removing others.
    const isOwner = members.find(m => m.id === currentUser.id)?.is_owner;

    return (
        <div className="h-full flex flex-col bg-white dark:bg-[#2B2D31] text-gray-900 dark:text-gray-100">
            {/* HEADER */}
            <div className="p-4 border-b border-gray-200 dark:border-[#1E1F22] flex flex-col items-center">
                <div className="relative">
                    <img
                        src={activeChat.avatar}
                        className="w-20 h-20 rounded-full object-cover mb-2 border-4 border-gray-100 dark:border-[#1E1F22]"
                        onError={(e) => e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(groupName)}`}
                    />
                </div>

                {isEditingName ? (
                    <div className="flex items-center gap-2 mt-2 w-full">
                        <input
                            value={nameInput}
                            onChange={(e) => setNameInput(e.target.value)}
                            className="flex-1 bg-gray-100 dark:bg-[#1E1F22] px-2 py-1 rounded border border-transparent focus:border-blue-500 outline-none text-center"
                            autoFocus
                        />
                        <button onClick={handleRename} className="text-green-500 hover:bg-gray-100 p-1 rounded"><i className="fas fa-check"></i></button>
                        <button onClick={() => setIsEditingName(false)} className="text-red-500 hover:bg-gray-100 p-1 rounded"><i className="fas fa-times"></i></button>
                    </div>
                ) : (
                    <div className="mt-1 flex items-center gap-2 group">
                        <h2 className="text-lg font-bold">{groupName}</h2>
                        <button onClick={() => setIsEditingName(true)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 transition">
                            <i className="fas fa-pen text-xs"></i>
                        </button>
                    </div>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{members.length} thành viên</p>
            </div>

            {/* MEMBERS LIST */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3">

                {/* ADD MEMBERS SECTION */}
                <div className="mb-4">
                    {!isAdding ? (
                        <button
                            onClick={() => setIsAdding(true)}
                            className="w-full py-2 flex items-center justify-center gap-2 bg-[#F2F3F5] dark:bg-[#1E1F22] hover:bg-gray-200 dark:hover:bg-[#35373C] rounded text-sm transition font-medium"
                        >
                            <i className="fas fa-user-plus"></i> Thêm thành viên
                        </button>
                    ) : (
                        <div className="bg-[#F2F3F5] dark:bg-[#1E1F22] p-2 rounded">
                            <div className="flex items-center gap-2 mb-2">
                                <input
                                    className="flex-1 bg-transparent text-sm outline-none"
                                    placeholder="Tìm tên nhân viên..."
                                    value={searchTerm}
                                    onChange={handleSearchUser}
                                    autoFocus
                                />
                                <button onClick={() => setIsAdding(false)} className="text-gray-500 hover:text-red-500"><i className="fas fa-times"></i></button>
                            </div>
                            {/* Search Results */}
                            {searchResults.length > 0 && (
                                <div className="max-h-40 overflow-y-auto mt-1 space-y-1">
                                    {searchResults.map(u => (
                                        <div key={u.id} onClick={() => handleAddMember(u)} className="flex items-center gap-2 p-1 hover:bg-gray-300 dark:hover:bg-[#35373C] cursor-pointer rounded">
                                            <img src={u.avatar_url || `https://ui-avatars.com/api/?name=${u.name}`} className="w-5 h-5 rounded-full" />
                                            <span className="text-xs truncate">{u.name}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    {/* ADMINS */}
                    <div>
                        <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2 px-1">Quản trị viên</h3>
                        <div className="space-y-1">
                            {members.filter(m => m.role === 'admin' || m.is_owner).map(m => (
                                <div key={m.id} className="flex items-center justify-between p-1.5 rounded hover:bg-gray-100 dark:hover:bg-[#35373C] group">
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <img src={m.avatar} className="w-8 h-8 rounded-full" />
                                            {m.is_online && <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-[#2B2D31] rounded-full"></div>}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium flex items-center gap-1">
                                                {m.name}
                                                {m.is_owner && <i className="fas fa-crown text-yellow-500 text-[10px]" title="Owner"></i>}
                                            </span>
                                            <span className="text-[10px] text-gray-500">
                                                {m.id === currentUser.id ? 'Bạn' : (m.is_online ? 'Online' : 'Offline')}
                                            </span>
                                        </div>
                                    </div>
                                    {/* Only Owner can remove admins if implemented, but here Owner can remove anyone except themselves */}
                                    {isOwner && m.id !== currentUser.id && (
                                        <button onClick={() => handleRemoveMember(m.id)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500">
                                            <i className="fas fa-user-minus"></i>
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* MEMBERS */}
                    <div>
                        <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2 px-1">Thành viên — {members.filter(m => m.role !== 'admin' && !m.is_owner).length}</h3>
                        <div className="space-y-1">
                            {members.filter(m => m.role !== 'admin' && !m.is_owner).map(m => (
                                <div key={m.id} className="flex items-center justify-between p-1.5 rounded hover:bg-gray-100 dark:hover:bg-[#35373C] group">
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <img src={m.avatar} className="w-8 h-8 rounded-full" />
                                            {m.is_online && <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-[#2B2D31] rounded-full"></div>}
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium">{m.name}</div>
                                            <div className="text-[10px] text-gray-500">{m.is_online ? 'Online' : 'Offline'}</div>
                                        </div>
                                    </div>
                                    {isOwner && (
                                        <button onClick={() => handleRemoveMember(m.id)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500">
                                            <i className="fas fa-user-minus"></i>
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* FOOTER */}
            <div className="p-4 border-t border-gray-200 dark:border-[#1E1F22]">
                <button
                    onClick={handleLeaveGroup}
                    className="w-full py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition text-sm font-medium flex items-center justify-center gap-2"
                >
                    <i className="fas fa-sign-out-alt"></i> Rời nhóm
                </button>
            </div>
        </div>
    );
}
