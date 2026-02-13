import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

export default function InviteMemberModal({ isOpen, onClose, activeChat, onMemberAdded }) {
    if (!isOpen) return null;

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [adding, setAdding] = useState(null);

    // 1. Lấy danh sách nhân viên nội bộ
    useEffect(() => {
        const fetchInternalUsers = async () => {
            setLoading(true);
            try {
                // API này nên trả về danh sách toàn bộ nhân viên
                // Bạn có thể tái sử dụng endpoint tìm kiếm hoặc tạo endpoint mới /api/users/internal
                // Ở đây giả sử ta dùng /api/users/search với query rỗng để lấy list, hoặc endpoint riêng nếu bạn đã có
                // Theo prompt "Gọi API /users/internal mà ta đã làm ở các bước trước" -> có thể chưa có, ta dùng searchUsers hoặc getInternalUsers
                // Trong ChatApiController, có hàm getInternalUsers (line 181), nhưng chưa thấy route cho nó trong routes/api.php
                // Ta sẽ dùng searchUsers tạm thời hoặc giả định endpoint /users/internal tồn tại nếu User đã làm.
                // Tuy nhiên, để an toàn, ta dùng logic lấy danh sách staff từ DMListSidebar hoặc similar.
                // Nhưng prompt nói "gọi API /users/internal", let's try to fetch that or search.

                // Let's assume we fetch all users via a search/list endpoint.
                const res = await axios.get('/ajax/users/search?q=');
                setUsers(res.data);
            } catch (error) {
                console.error("Failed to fetch users", error);
            } finally {
                setLoading(false);
            }
        };

        fetchInternalUsers();
    }, []);

    // 2. Lọc bỏ những người ĐÃ có trong cuộc hội thoại
    const existingMemberIds = activeChat.staff_members?.map(m => m.id) || [];
    // Also include conversation participants if mixed
    // activeChat.users might be available? standardized to staff_members for this context.

    const availableUsers = users.filter(user => !existingMemberIds.includes(user.id));

    const handleInvite = async (userId) => {
        setAdding(userId);
        try {
            await axios.post(`/ajax/conversations/${activeChat.conversation_id}/add-member`, {
                user_id: userId
            });
            toast.success("✅ Đã thêm nhân viên thành công!");
            onMemberAdded();
            onClose();
            // Force reload to update UI (Header Staff List) since we don't have global state management here yet
            setTimeout(() => window.location.reload(), 500);
        } catch (error) {
            console.error("Invite failed", error);
            toast.error("❌ Mời thất bại! " + (error.response?.data?.message || ''));
        } finally {
            setAdding(null);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#313338] w-full max-w-sm rounded-lg shadow-xl overflow-hidden flex flex-col max-h-[80vh]">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <h3 className="font-bold text-lg dark:text-gray-100">Mời thêm hỗ trợ</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                    {loading ? (
                        <div className="text-center py-4 text-gray-500">Đang tải...</div>
                    ) : availableUsers.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">Không còn nhân viên nào để mời.</div>
                    ) : (
                        <div className="space-y-1">
                            {availableUsers.map(user => (
                                <div key={user.id} className="flex items-center justify-between p-2 hover:bg-gray-100 dark:hover:bg-[#2B2D31] rounded-lg transition">
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <img src={user.avatar || user.avatar_url || `https://ui-avatars.com/api/?name=${user.name}`} className="w-10 h-10 rounded-full object-cover" />
                                            {/* Online status indicator if available */}
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-900 dark:text-gray-100">{user.name}</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">{user.email || 'Nhân viên'}</div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleInvite(user.id)}
                                        disabled={adding === user.id}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium transition disabled:opacity-50"
                                    >
                                        {adding === user.id ? <i className="fas fa-spinner fa-spin"></i> : 'Mời'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
