import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { ThemeProvider } from '../../contexts/ThemeContext';
import ServerRail from './ServerRail';
import DMListSidebar from './DMListSidebar';
import ChatWindow from './ChatWindow';
import ChatDetails from './ChatDetails';
import { requestNotificationPermission, playSound, sendDesktopNotification } from '../../utils/notification';

function ChatLayoutContent() {
    const [conversations, setConversations] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [currentUser] = useState(window.Laravel.user);
    const [loading, setLoading] = useState(true);
    const [showDetails, setShowDetails] = useState(false);
    const lastCheckRef = useRef(Date.now());

    // --- LOGIC LOAD DỮ LIỆU (GIỮ NGUYÊN) ---
    const loadConversations = useCallback((showLoading = true) => {
        if (showLoading && conversations.length === 0) setLoading(true);
        axios.get('/ajax/conversations')
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
                setConversations(newData);
                setLoading(false);
            })
            .catch(err => setLoading(false));
    }, []);

    useEffect(() => {
        requestNotificationPermission();
        loadConversations(true);
        const interval = setInterval(() => loadConversations(false), 5000); // Polling 5s
        return () => clearInterval(interval);
    }, [loadConversations]);

    const handleSelectChat = useCallback(async (user) => {
        const optimisticChat = { ...user, partner_name: user.name, partner_avatar: user.avatar };
        if (user.conversation_id) { setActiveChat(optimisticChat); return; }

        try {
            setActiveChat({ ...optimisticChat, isConnecting: true });
            const res = await axios.post('/ajax/conversations/check', { target_id: user.target_id });
            setActiveChat({ ...optimisticChat, conversation_id: res.data.id, isConnecting: false });
            loadConversations(false);
        } catch (error) { console.error(error); }
    }, [loadConversations]);

    // HÀM MỚI: Xử lý khi bấm vào Logo (Về trang chủ)
    const handleGoHome = useCallback(() => {
        // Nếu đang ở Group thì thoát ra, về màn hình chờ hoặc giữ nguyên DM
        // Ở đây ta set null để về màn hình "Chào mừng" hoặc giữ nguyên state tùy ý
        // Nhưng Discord thường là bấm Home -> Hiện danh sách bạn bè
        setActiveChat(null);
    }, []);

    const handleMessageSent = useCallback(() => { loadConversations(false); }, [loadConversations]);

    const handleLogout = async () => {
        if (!confirm('Đăng xuất?')) return;
        try { await axios.post('/logout'); window.location.href = '/'; } catch (e) { window.location.reload(); }
    };

    const handleToggleDetails = () => setShowDetails(prev => !prev);

    return (
        <div className="flex h-screen overflow-hidden bg-white dark:bg-[#313338] text-gray-900 dark:text-gray-100 font-sans transition-colors duration-200">

            {/* 1. SERVER RAIL (Trái cùng) */}
            <ServerRail
                conversations={conversations}
                activeChat={activeChat}
                onSelectChat={handleSelectChat}
                onGoHome={handleGoHome} // <--- Truyền hàm này xuống
            />

            {/* 2. DM LIST (Giữa) - Ẩn trên mobile khi đang chat */}
            <div className={`w-full md:w-[240px] lg:w-[280px] flex-shrink-0 flex-col h-full 
                ${activeChat ? 'hidden md:flex' : 'flex'}`}>
                <DMListSidebar
                    conversations={conversations}
                    activeChat={activeChat}
                    onSelectUser={handleSelectChat}
                    currentUser={currentUser}
                    onLogout={handleLogout}
                />
            </div>

            {/* 3. CHAT WINDOW (Phải) */}
            <div className={`flex-1 min-w-0 bg-white dark:bg-[#313338] relative flex flex-col 
                ${!activeChat ? 'hidden md:flex' : 'flex'}`}>
                <ChatWindow
                    activeChat={activeChat}
                    currentUser={currentUser}
                    onMessageSent={handleMessageSent}
                    onBack={() => setActiveChat(null)}
                    onToggleDetails={handleToggleDetails}
                    showDetails={showDetails}
                />
            </div>

            {/* 4. DETAILS (Nếu cần) */}
            {activeChat && showDetails && (
                <div className="hidden 2xl:block w-[300px] bg-white dark:bg-[#2B2D31] border-l border-gray-200 dark:border-[#1E1F22] transition-colors">
                    <ChatDetails activeChat={activeChat} />
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