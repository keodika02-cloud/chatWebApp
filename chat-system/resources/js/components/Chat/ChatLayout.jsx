import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import Sidebar from './Sidebar';
import ChatWindow from './ChatWindow';
import ChatDetails from './ChatDetails';
import { requestNotificationPermission, playSound, sendDesktopNotification } from '../../utils/notification';

export default function ChatLayout() {
    const [conversations, setConversations] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [currentUser] = useState(window.Laravel.user);
    const [loading, setLoading] = useState(true);
    const isVisible = useRef(true);
    const lastCheckRef = useRef(Date.now()); // Dùng để check tin mới

    // Track visibility to optimize polling
    useEffect(() => {
        requestNotificationPermission(); // Xin quyền ngay khi load app

        const handleVisibilityChange = () => {
            isVisible.current = document.visibilityState === 'visible';
            if (isVisible.current) {
                // Khi quay lại tab thì load lại ngay
                loadConversations(false);
            }
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    }, []);

    const loadConversations = useCallback((showLoading = true) => {
        // Cho phép chạy ngầm để check thông báo (bỏ check isVisible)
        // if (!isVisible.current) return; 

        if (showLoading && conversations.length === 0) setLoading(true);
        axios.get('/ajax/conversations')
            .then(res => {
                const newData = res.data;

                // --- Logic check Notification ---
                // Tìm tin nhắn mới nhất trong list vừa tải về
                const latestConv = newData.length > 0 ? newData[0] : null;

                if (latestConv && conversations.length > 0) {
                    // Nếu thời gian tin nhắn mới nhất > thời gian check lần trước
                    // VÀ không phải activeChat (vì activeChat đã có tiếng riêng) -> À khoan, activeChat để ChatWindow lo
                    // Nhưng nếu tab ẩn thì activeChat cũng cần thông báo. 
                    // Để đơn giản: check timestamp > lastCheck

                    const latestTime = new Date(latestConv.last_time || 0).getTime(); // last_time trả về string, cần parse cẩn thận hoặc dùng biến sort_time nếu có
                    // Trong API getConversations: 'sort_time' => timestamp

                    if (latestConv.sort_time * 1000 > lastCheckRef.current) {
                        // Có tin mới!
                        // Kiểm tra xem có phải mình gửi không? (Nếu mình gửi thì thôi)
                        // API trả về 'last_message', k có sender id. Nhưng UI có logic "hasHistory".
                        // Tạm thời cứ báo nếu title khác "Bạn:..."
                        const isMe = latestConv.last_message.startsWith('Bạn:');
                        if (!isMe) {
                            playSound();
                            sendDesktopNotification(latestConv.name, latestConv.last_message, latestConv.avatar);
                        }
                    }
                }
                lastCheckRef.current = Date.now();
                // --------------------------------

                setConversations(newData);
                setLoading(false);
            })
            .catch(err => {
                console.error("Error loading conversations", err);
                setLoading(false);
            });
    }, []); // Chỉ khởi tạo 1 lần, không phụ thuộc state conversations để tránh loop

    // Initial Load (Chỉ chạy 1 lần)
    useEffect(() => {
        loadConversations(true);
        // Đã tắt Polling liên tục theo yêu cầu
    }, [loadConversations]);

    const handleSelectUser = useCallback(async (user) => {
        // Optimistic UI: Immediately set active chat
        const optimisticChat = {
            conversation_id: user.conversation_id,
            target_id: user.target_id,
            partner_name: user.name,
            partner_avatar: user.avatar,
            ...user
        };

        if (user.conversation_id) {
            setActiveChat(optimisticChat);
            return;
        }

        try {
            setActiveChat({ ...optimisticChat, isConnecting: true });
            const res = await axios.post('/ajax/conversations/check', { target_id: user.target_id });
            const conversationInfo = {
                ...optimisticChat,
                conversation_id: res.data.id,
                isConnecting: false
            };
            setActiveChat(conversationInfo);
            loadConversations(false);
        } catch (error) {
            console.error("Error creating chat", error);
            alert("Could not connect to user.");
        }
    }, [loadConversations]);

    const handleMessageSent = useCallback(() => {
        // Reload sidebar immediately after sending
        loadConversations(false);
    }, [loadConversations]);

    return (
        <div className="flex h-screen overflow-hidden bg-white relative">
            {/* CỘT 1: Sidebar */}
            {/* Mobile: Ẩn khi có Active Chat. Desktop: Luôn hiện */}
            <div className={`w-full md:w-[360px] flex-shrink-0 border-r border-gray-200 bg-white z-10 
                ${activeChat ? 'hidden md:flex' : 'flex'} flex-col h-full`}>
                <Sidebar
                    conversations={conversations}
                    activeChat={activeChat}
                    onSelectUser={handleSelectUser}
                    loading={loading}
                />
            </div>

            {/* CỘT 2: Chat Chính */}
            {/* Mobile: Hiện khi có Active Chat. Desktop: Luôn hiện (chiếm phần còn lại) */}
            <div className={`flex-1 min-w-0 bg-white h-full relative
                ${!activeChat ? 'hidden md:flex' : 'flex'} flex-col`}>
                <ChatWindow
                    activeChat={activeChat}
                    currentUser={currentUser}
                    onMessageSent={handleMessageSent}
                    onBack={() => setActiveChat(null)} // Nút Back cho mobile
                />
            </div>

            {/* CỘT 3: Chi tiết (Chỉ hiện ở Desktop rộng) */}
            {activeChat && (
                <div className="hidden xl:block h-full border-l border-gray-200">
                    <ChatDetails activeChat={activeChat} />
                </div>
            )}
        </div>
    );
}
