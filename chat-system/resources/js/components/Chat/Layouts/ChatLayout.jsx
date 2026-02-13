import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { ThemeProvider } from '../../../contexts/ThemeContext';

import DMListSidebar from '../Sidebars/DMListSidebar';
import ChatWindow from './ChatWindow';
import ChatDetails from './ChatDetails';
import CustomerRightSidebar from '../Sidebars/CustomerRightSidebar';
import GroupInfoSidebar from '../Sidebars/GroupInfoSidebar';
import EmployeeDirectory from '../Sidebars/EmployeeDirectory';
import { requestNotificationPermission, playSound, sendDesktopNotification } from '../../../utils/notification';

function ChatLayoutContent() {
    const [conversations, setConversations] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [currentUser] = useState(window.Laravel.user);
    const [loading, setLoading] = useState(true);
    const [showDetails, setShowDetails] = useState(false);
    const lastCheckRef = useRef(Date.now());

    const [onlineUsers, setOnlineUsers] = useState(new Set());

    const [filter, setFilter] = useState('mine'); // Tab state: 'mine' | 'unassigned'

    // --- LOGIC PRESENCE (NEW) ---
    useEffect(() => {
        // 1. Tham gia kênh 'online'
        window.Echo.join('online')
            .here((users) => {
                // Danh sách những người ĐANG online khi mình vừa vào
                const ids = new Set(users.map(u => u.id));
                setOnlineUsers(ids);
            })
            .joining((user) => {
                // Ai đó vừa Online
                setOnlineUsers(prev => new Set(prev).add(user.id));
                console.log(user.name + ' vừa online');
            })
            .leaving((user) => {
                // Ai đó vừa Offline
                setOnlineUsers(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(user.id);
                    return newSet;
                });
            });

        // Cleanup khi thoát trang
        return () => {
            window.Echo.leave('online');
        };
    }, []);

    // --- LOGIC LOAD DỮ LIỆU (GIỮ NGUYÊN) ---
    const loadConversations = useCallback((showLoading = true) => {
        if (showLoading && conversations.length === 0) setLoading(true);
        axios.get('/ajax/conversations', { params: { filter } }) // Send filter param
            .then(res => {
                const newData = res.data;
                // Check tin nhắn mới để thông báo
                if (newData.length > 0) {
                    const latest = newData[0];
                    if (latest.sort_time * 1000 > lastCheckRef.current) {
                        const isMe = latest.last_message.startsWith('Bạn:');
                        if (!isMe) {
                            playSound();
                            sendDesktopNotification(latest.name, latest.last_message, latest.avatar);
                        }
                    }
                }
                lastCheckRef.current = Date.now();

                // TỰ ĐỘNG ĐÁNH DẤU ĐÃ ĐỌC NẾU ĐANG Ở TRONG CHAT ĐÓ
                if (activeChat && activeChat.conversation_id) {
                    const currentActive = newData.find(c => c.conversation_id === activeChat.conversation_id);
                    if (currentActive && currentActive.unread_count > 0) {
                        axios.post(`/ajax/conversations/${activeChat.conversation_id}/read`).catch(() => { });
                        currentActive.unread_count = 0; // Xóa số đỏ ngay trong dữ liệu vừa nhận
                    }
                }

                setConversations(newData);
                setLoading(false);
            })
            .catch(err => setLoading(false));
    }, [filter]); // Re-create if filter changes

    useEffect(() => {
        requestNotificationPermission();
        loadConversations(true);

        // Lắng nghe real-time để load lại danh sách
        if (window.Echo && currentUser) {
            window.Echo.private(`App.Models.User.${currentUser.id}`)
                .listen('MessageSent', (e) => {
                    console.log("Layout: Có tin mới!", e);
                    loadConversations(false);
                });
        }

        return () => {
            if (window.Echo && currentUser) {
                window.Echo.leave(`App.Models.User.${currentUser.id}`);
            }
        };
    }, [loadConversations, currentUser?.id]);

    const handleSelectChat = useCallback(async (chatOrUser) => {
        // 1. Nếu bấm vào nút "Bạn bè" (Special ID)
        if (chatOrUser.conversation_id === 'FRIENDS_HUB') {
            setActiveChat({ conversation_id: 'FRIENDS_HUB', name: 'Nhân viên / Bạn bè' });
            setShowDetails(false);
            return;
        }

        const optimisticChat = {
            ...chatOrUser,
            unread_count: 0, // Reset ngay lập tức
            partner_name: chatOrUser.name,
            partner_avatar: chatOrUser.avatar
        };

        // 2. Nếu đã có cuộc hội thoại (Đã chat rồi)
        if (chatOrUser.conversation_id) {
            setActiveChat(optimisticChat);
            setShowDetails(true);

            // Reset số đỏ ở Frontend ngay lập tức cho mượt
            if (chatOrUser.unread_count > 0) {
                setConversations(prev => prev.map(c =>
                    c.conversation_id === chatOrUser.conversation_id
                        ? { ...c, unread_count: 0 }
                        : c
                ));
                // Gọi API báo cho Server biết (dùng endpoint /ajax/... cho web)
                axios.post(`/ajax/conversations/${chatOrUser.conversation_id}/read`).catch(e => console.error(e));
            }
            return;
        }

        // 3. Nếu là cuộc hội thoại mới (Bắt đầu chat lần đầu)
        try {
            setActiveChat({ ...optimisticChat, isConnecting: true });
            const res = await axios.post('/ajax/conversations/check', { target_id: chatOrUser.target_id });
            const newChat = { ...optimisticChat, conversation_id: res.data.id, isConnecting: false };

            setActiveChat(newChat);
            setShowDetails(true);
            loadConversations(false); // Reload để list có chat mới

            // Đánh dấu đã đọc cho chat mới
            axios.post(`/ajax/conversations/${res.data.id}/read`).catch(() => { });
        } catch (error) { console.error(error); }
    }, [loadConversations]);



    const handleMessageSent = useCallback(() => { loadConversations(false); }, [loadConversations]);

    const handleLogout = async () => {
        if (!confirm('Đăng xuất?')) return;
        try { await axios.post('/logout'); window.location.href = '/'; } catch (e) { window.location.reload(); }
    };

    const handleToggleDetails = () => setShowDetails(prev => !prev);

    return (
        <div className="flex h-screen overflow-hidden bg-white dark:bg-[#313338] text-gray-900 dark:text-gray-100 font-sans transition-colors duration-200">



            {/* 2. DM LIST (Giữa) - Ẩn trên mobile khi đang chat */}
            <div className={`w-full md:w-[240px] lg:w-[280px] flex-shrink-0 flex-col h-full 
                ${activeChat ? 'hidden md:flex' : 'flex'}`}>
                <DMListSidebar
                    conversations={conversations}
                    activeChat={activeChat}
                    onSelectUser={handleSelectChat}
                    currentUser={currentUser}
                    onLogout={handleLogout}
                    onlineUsers={onlineUsers} // <--- Pass onlineUsers
                    filter={filter}
                    setFilter={setFilter}
                />
            </div>

            {/* 3. CHAT WINDOW (Phải) */}
            <div className={`flex-1 min-w-0 bg-white dark:bg-[#313338] relative flex flex-col 
                ${!activeChat ? 'hidden md:flex' : 'flex'}`}>

                {activeChat && activeChat.conversation_id === 'FRIENDS_HUB' ? (
                    <EmployeeDirectory onSelectUser={handleSelectChat} onlineUsers={onlineUsers} /> // <--- Pass onlineUsers
                ) : (
                    <ChatWindow
                        activeChat={activeChat ? {
                            ...activeChat,
                            is_online: activeChat.target_id ? onlineUsers.has(Number(activeChat.target_id)) : false
                        } : null}
                        currentUser={currentUser}
                        onMessageSent={handleMessageSent}
                        onBack={() => setActiveChat(null)}
                        onToggleDetails={handleToggleDetails}
                        showDetails={showDetails}
                    />
                )}
            </div>

            {/* 4. CỘT PHẢI CRM & CHI TIẾT */}
            {activeChat && showDetails && (
                <div className="hidden lg:block w-[300px] bg-white dark:bg-[#2B2D31] border-l border-gray-200 dark:border-[#1E1F22] transition-colors shadow-xl z-20 flex-shrink-0">
                    {activeChat.is_customer ? (
                        <CustomerRightSidebar activeChat={activeChat} currentUser={currentUser} />
                    ) : activeChat.type === 'group' ? (
                        <GroupInfoSidebar activeChat={activeChat} currentUser={currentUser} />
                    ) : (
                        // CASE 2: NHÂN VIÊN -> HIỆN PROFILE
                        <div className="p-6 text-center h-full flex flex-col items-center">
                            <div className="relative mb-4">
                                <img
                                    src={activeChat.avatar || `https://ui-avatars.com/api/?name=${activeChat.name}`}
                                    className="w-24 h-24 rounded-full object-cover border-4 border-gray-100 dark:border-[#3F4147] shadow-sm"
                                    onError={(e) => e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(activeChat.name)}`}
                                />
                                {onlineUsers.has(Number(activeChat.target_id || activeChat.id)) && (
                                    <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 border-4 border-white dark:border-[#2B2D31] rounded-full"></div>
                                )}
                            </div>

                            <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-1">{activeChat.name}</h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Nhân viên / Đồng nghiệp</p>

                            <div className="flex gap-4 mb-8">
                                <button className="w-10 h-10 rounded-full bg-gray-100 dark:bg-[#3F4147] hover:bg-gray-200 dark:hover:bg-[#35373C] flex items-center justify-center transition text-gray-700 dark:text-gray-200 shadow-sm" title="Gọi điện">
                                    <i className="fas fa-phone"></i>
                                </button>
                                <button className="w-10 h-10 rounded-full bg-gray-100 dark:bg-[#3F4147] hover:bg-gray-200 dark:hover:bg-[#35373C] flex items-center justify-center transition text-gray-700 dark:text-gray-200 shadow-sm" title="Video Call">
                                    <i className="fas fa-video"></i>
                                </button>
                                <button className="w-10 h-10 rounded-full bg-gray-100 dark:bg-[#3F4147] hover:bg-gray-200 dark:hover:bg-[#35373C] flex items-center justify-center transition text-gray-700 dark:text-gray-200 shadow-sm" title="Gửi mail">
                                    <i className="fas fa-envelope"></i>
                                </button>
                            </div>

                            <div className="w-full text-left space-y-3">
                                <div className="p-3 rounded bg-gray-50 dark:bg-[#1E1F22]">
                                    <span className="text-xs text-gray-500 uppercase font-bold block mb-1">Email</span>
                                    <span className="text-sm text-gray-800 dark:text-gray-200">user@{activeChat.target_id}.com</span> {/* Placeholder if email not in activeChat */}
                                </div>
                                <div className="p-3 rounded bg-gray-50 dark:bg-[#1E1F22]">
                                    <span className="text-xs text-gray-500 uppercase font-bold block mb-1">Phòng ban</span>
                                    <span className="text-sm text-gray-800 dark:text-gray-200">Kỹ thuật</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default function ChatLayout() {
    return (
        <ThemeProvider>
            <ChatLayoutContent />
        </ThemeProvider>
    );
}