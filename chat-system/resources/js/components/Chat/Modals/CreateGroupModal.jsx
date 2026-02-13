import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

export default function CreateGroupModal({ onClose, onGroupCreated }) {
    const [groupName, setGroupName] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [users, setUsers] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        axios.get('/ajax/users/search').then(res => setUsers(res.data));
    }, []);

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const toggleUser = (user) => {
        if (selectedUsers.find(u => u.id === user.id)) {
            setSelectedUsers(prev => prev.filter(u => u.id !== user.id));
        } else {
            setSelectedUsers(prev => [...prev, user]);
        }
    };

    const handleSubmit = async () => {
        if (!groupName || selectedUsers.length === 0) return;
        setLoading(true);
        try {
            await axios.post('/ajax/conversations/create', {
                name: groupName,
                members: selectedUsers.map(u => u.id)
            });
            onGroupCreated();
            onClose(); // Đóng popup khi xong
        } catch (error) {
            toast.error("❌ Lỗi: " + (error.response?.data?.message || "Không thể tạo nhóm"));
        } finally {
            setLoading(false);
        }
    };

    return (
        // CARD: Kích thước cố định w-72 (288px), nền trắng, bo góc
        <div className="w-72 bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden">

            {/* Header nhỏ */}
            <div className="bg-gray-50 px-3 py-2 border-b flex justify-between items-center">
                <span className="font-bold text-xs text-gray-700 uppercase tracking-wide">Nhóm mới</span>
                <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition">
                    <i className="fas fa-times text-sm"></i>
                </button>
            </div>

            <div className="p-3">
                {/* Input Tên nhóm */}
                <input
                    type="text"
                    className="w-full bg-gray-100 border-none rounded-lg px-3 py-1.5 text-sm focus:ring-1 focus:ring-blue-400 mb-2 transition"
                    placeholder="Đặt tên nhóm..."
                    value={groupName}
                    onChange={e => setGroupName(e.target.value)}
                    autoFocus
                />

                {/* Danh sách đã chọn (Tags) */}
                {selectedUsers.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2 max-h-20 overflow-y-auto custom-scrollbar">
                        {selectedUsers.map(user => (
                            <div key={user.id} className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[11px] font-medium flex items-center gap-1 border border-blue-100 animate-scaleIn">
                                <span className="max-w-[80px] truncate">{user.name}</span>
                                <i onClick={() => toggleUser(user)} className="fas fa-times cursor-pointer hover:text-red-500"></i>
                            </div>
                        ))}
                    </div>
                )}

                {/* Ô tìm kiếm người dùng */}
                <div className="relative mb-2">
                    <i className="fas fa-search absolute left-2.5 top-2 text-gray-400 text-[10px]"></i>
                    <input
                        type="text"
                        className="w-full border border-gray-200 rounded-md pl-7 pr-2 py-1.5 text-xs focus:border-blue-400 outline-none"
                        placeholder="Thêm thành viên..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* List Users */}
                <div className="space-y-0.5 max-h-48 overflow-y-auto custom-scrollbar">
                    {filteredUsers.length === 0 && <p className="text-center text-xs text-gray-400 py-2">Không tìm thấy ai</p>}

                    {filteredUsers.map(user => {
                        const isSelected = selectedUsers.some(u => u.id === user.id);
                        return (
                            <div
                                key={user.id}
                                onClick={() => toggleUser(user)}
                                className={`flex items-center gap-2 p-1.5 rounded-md cursor-pointer transition select-none
                                    ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                            >
                                <img src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.name}`} className="w-6 h-6 rounded-full border border-gray-100" />
                                <div className="flex-1 min-w-0">
                                    <p className={`text-xs truncate ${isSelected ? 'font-bold text-blue-700' : 'text-gray-700'}`}>{user.name}</p>
                                </div>
                                {isSelected && <i className="fas fa-check-circle text-blue-500 text-xs"></i>}
                            </div>
                        );
                    })}
                </div>

                {/* Nút Tạo */}
                <button
                    onClick={handleSubmit}
                    disabled={!groupName || selectedUsers.length === 0 || loading}
                    className="w-full mt-3 bg-blue-600 text-white py-1.5 rounded-lg text-xs font-bold hover:bg-blue-700 transition disabled:opacity-50 shadow-sm"
                >
                    {loading ? <i className="fas fa-spinner fa-spin"></i> : 'Tạo nhóm'}
                </button>
            </div>
        </div>
    );
}