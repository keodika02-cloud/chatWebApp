import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import axios from 'axios';
import EmojiPicker from 'emoji-picker-react';
import { playSound, sendDesktopNotification } from '../../../utils/notification';
import InviteMemberModal from '../Modals/InviteMemberModal';
import MessageBubble from '../Common/MessageBubble';
import Avatar from '../Common/Avatar';

export default function ChatWindow({
    activeChat,
    currentUser,
    onMessageSent,
    onBack,
    onToggleDetails,
    showDetails
}) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [attachment, setAttachment] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showPicker, setShowPicker] = useState(false);
    const [showInviteModal, setShowInviteModal] = useState(false); // <--- State Modal

    const messagesEndRef = useRef(null);
    const scrollContainerRef = useRef(null);
    const fileInputRef = useRef(null);
    const inputRef = useRef(null);

    const isOnlyEmojis = (str) => {
        if (!str) return false;
        const emojiRegex = /^(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|\ud83c[\ude32-\ude3a]|\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])+\s*$/;
        return emojiRegex.test(str);
    };

    useEffect(() => {
        if (!activeChat || !activeChat.conversation_id) {
            setMessages([]);
            return;
        }

        const fetchMessages = async () => {
            setLoading(true);
            try {
                const res = await axios.get(`/ajax/conversations/${activeChat.conversation_id}/messages`);
                setMessages(res.data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchMessages();

        const channelName = `conversation.${activeChat.conversation_id}`;
        if (window.Echo) {
            window.Echo.private(channelName)
                .listen('MessageSent', (e) => {
                    if ((e.user_id && e.user_id === currentUser.id) || (e.sender && e.sender.name === currentUser.name)) return;
                    playSound();
                    if (document.visibilityState === 'hidden') {
                        sendDesktopNotification(e.sender.name, e.body || 'File đính kèm', e.sender.avatar);
                    }
                    setMessages(prev => {
                        if (prev.some(m => m.id === e.id)) return prev;
                        return [...prev, { ...e, is_me: false }];
                    });
                    onMessageSent();
                });
        }
        return () => { if (window.Echo) window.Echo.leave(channelName); };
    }, [activeChat?.conversation_id]);

    useLayoutEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    }, [messages, previewUrl]);

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setAttachment(file);
        if (file.type.startsWith('image/')) setPreviewUrl(URL.createObjectURL(file));
        else setPreviewUrl(null);
    };

    const clearAttachment = () => {
        setAttachment(null);
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const onEmojiClick = (emojiObject) => {
        setNewMessage(prev => prev + emojiObject.emoji);
        if (inputRef.current) inputRef.current.focus();
    };



    const handleSendMessage = async (e) => {
        if (e) e.preventDefault();
        const content = newMessage.trim();
        if ((!content && !attachment) || !activeChat?.conversation_id) return;

        setNewMessage('');
        clearAttachment();
        setShowPicker(false);

        const tempId = Date.now();
        const optimisticMsg = {
            id: tempId,
            user_id: currentUser.id, // <--- QUAN TRỌNG: Để MessageBubble nhận diện là "Me" ngay lập tức
            body: content,
            is_me: true,
            created_at: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
            sender: { name: currentUser.name, avatar: currentUser.avatar }, // Show avatar immediately
            attachment_type: attachment ? (attachment.type.startsWith('image/') ? 'image' : 'file') : null,
            attachment_path: attachment && attachment.type.startsWith('image/') ? URL.createObjectURL(attachment) : null,
            attachment_name: attachment ? attachment.name : null
        };

        setMessages(prev => [...prev, optimisticMsg]);

        try {
            const formData = new FormData();
            formData.append('body', content);
            if (attachment) formData.append('attachment', attachment);

            await axios.post(`/ajax/conversations/${activeChat.conversation_id}/messages`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            onMessageSent();
        } catch (error) {
            console.error("Failed", error);
        }
    };

    if (!activeChat) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-white dark:bg-[#313338] transition-colors">
                <div className="w-20 h-20 bg-gray-100 dark:bg-[#2B2D31] rounded-full flex items-center justify-center mb-4">
                    <i className="fab fa-discord text-4xl text-[#5865F2]"></i>
                </div>
                <h2 className="text-xl font-bold text-gray-700 dark:text-gray-200">Xin chào, {currentUser.name}!</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-2">Sẵn sàng trò chuyện cùng mọi người.</p>
            </div>
        );
    }

    return (
        <main className="flex-1 flex flex-col h-full bg-slate-50 relative overflow-hidden transition-colors duration-200">

            {/* Pattern chấm bi background */}
            <div className="absolute inset-0 opacity-5 pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
            </div>

            {/* --- HEADER --- */}
            {/* --- HEADER --- */}
            {/* --- HEADER --- */}
            <header className="h-12 border-b border-gray-200 dark:border-[#26272D] flex items-center justify-between px-4 bg-white dark:bg-[#313338] shadow-sm z-20 shrink-0">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="md:hidden text-gray-500 dark:text-gray-200">
                        <i className="fas fa-chevron-left text-xl"></i>
                    </button>

                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <img
                                src={activeChat?.social_account?.avatar || activeChat.partner_avatar || activeChat.avatar || "/default-avatar.png"}
                                className="w-10 h-10 rounded-full border border-gray-200 object-cover"
                                alt="Avatar"
                                onError={(e) => { e.target.onerror = null; e.target.src = "https://ui-avatars.com/api/?name=" + (activeChat.name || '?') }}
                            />
                            {activeChat.is_online && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-[#313338]"></div>}
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-gray-100 text-[15px] flex items-center gap-1">
                                {activeChat.type === 'group' ? <i className="fas fa-hashtag text-gray-400 text-xs"></i> : ''}
                                {activeChat.partner_name || activeChat.name}
                            </h3>
                        </div>
                    </div>
                </div>

                {/* Nút chức năng thay đổi theo đối tượng */}
                <div className="flex items-center gap-3 text-gray-500 dark:text-gray-300">

                    {/* Hiển thị avatar nhân viên đang support (CSKH) */}
                    {activeChat.staff_members && activeChat.staff_members.length > 0 && (
                        <div className="flex -space-x-2 mr-2 hidden sm:flex">
                            {activeChat.staff_members.map(staff => (
                                <Avatar
                                    key={staff.id}
                                    src={staff.avatar}
                                    name={staff.name}
                                    className="w-8 h-8 rounded-full border-2 border-white dark:border-[#313338] object-cover"
                                    title={staff.name}
                                />
                            ))}
                        </div>
                    )}

                    {/* Nút Invite Staff - CHỈ HIỆN KHI LÀ KHÁCH HÀNG HOẶC GROUP */}
                    <button
                        onClick={() => setShowInviteModal(true)}
                        className="bg-blue-100 hover:bg-blue-200 text-blue-600 dark:bg-blue-900 dark:text-blue-100 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 transition"
                        title="Mời thêm nhân viên hỗ trợ"
                    >
                        <i className="fas fa-user-plus"></i> <span className="hidden sm:inline">Mời</span>
                    </button>

                    <div className="h-4 w-[1px] bg-gray-300 dark:bg-gray-600 mx-1"></div>

                    {/* Nếu là ĐỒNG NGHIỆP (Internal) */}
                    {!activeChat.is_customer && (
                        <>
                            <button className="hover:text-gray-800 dark:hover:text-white transition" title="Gọi điện"><i className="fas fa-phone-alt"></i></button>
                            <button className="hover:text-gray-800 dark:hover:text-white transition" title="Video Call"><i className="fas fa-video"></i></button>
                        </>
                    )}

                    {/* Nếu là KHÁCH HÀNG (Customer) */}
                    {activeChat.is_customer && (
                        <>
                            <button title="Gắn thẻ" className="hover:text-gray-800 dark:hover:text-white transition"><i className="fas fa-tag"></i></button>
                            <button
                                onClick={onToggleDetails}
                                className={`flex items-center gap-1 transition ${showDetails ? 'text-blue-500 dark:text-blue-400' : 'hover:text-gray-800 dark:hover:text-white'}`}
                                title="Tạo đơn hàng / Xem CRM"
                            >
                                <i className="fas fa-shopping-cart"></i>
                                <span className="text-xs font-bold hidden sm:inline">Tạo đơn</span>
                            </button>
                        </>
                    )}
                </div>
            </header>

            {/* --- MESSAGES LIST --- */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar bg-white dark:bg-[#313338]" ref={scrollContainerRef}>
                {loading && <div className="text-center py-4"><i className="fas fa-spinner fa-spin text-blue-500"></i></div>}

                {messages.map((msg, index) => {
                    // Ép kiểu ID về số để so sánh chính xác
                    const msgUserId = msg.user_id ? parseInt(msg.user_id) : null;
                    const myId = currentUser ? parseInt(currentUser.id) : null;

                    // Message có user_id => Là nhân viên (Staff)
                    // Lưu ý: Dùng != null để bắt cả null và undefined
                    const isStaff = msg.user_id != null;

                    // Là tôi nếu: flag is_me có sẵn (từ optimistic) HOẶC user_id khớp
                    const isMe = msg.is_me || (isStaff && msgUserId === myId);

                    return (
                        <MessageBubble
                            key={msg.id || index}
                            message={msg}
                            isMe={isMe}
                            isStaff={isStaff}
                            currentUser={currentUser}
                        />
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* --- INPUT AREA --- */}
            <div className="p-4 bg-white border-t border-gray-200 z-30">
                {attachment && (
                    <div className="absolute bottom-full left-4 mb-2 bg-white p-2 rounded-lg shadow-lg flex items-center gap-2 border border-gray-200">
                        {previewUrl ? <img src={previewUrl} className="w-10 h-10 object-cover rounded" /> : <i className="fas fa-file text-blue-500 text-2xl"></i>}
                        <span className="text-xs text-gray-700 truncate max-w-[150px]">{attachment.name}</span>
                        <button onClick={clearAttachment} className="text-gray-400 hover:text-red-500"><i className="fas fa-times-circle"></i></button>
                    </div>
                )}

                {showPicker && (
                    <div className="absolute bottom-16 right-4 z-50 shadow-xl border border-gray-100 rounded-lg overflow-hidden">
                        <EmojiPicker onEmojiClick={onEmojiClick} theme="light" height={350} />
                    </div>
                )}

                <div className="flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2 border border-transparent focus-within:border-blue-400 focus-within:bg-white focus-within:shadow-md transition-all">
                    {/* Attachment Button */}
                    <button onClick={() => fileInputRef.current.click()} className="text-gray-400 hover:text-blue-500 transition">
                        <i className="fas fa-paperclip text-lg"></i>
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />

                    {/* Text Input */}
                    <form onSubmit={handleSendMessage} className="flex-1 flex items-center">
                        <input
                            ref={inputRef}
                            type="text"
                            className="flex-1 bg-transparent border-none outline-none text-sm px-2 py-1 text-gray-800 placeholder-gray-400"
                            placeholder="Nhập tin nhắn..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                        />
                    </form>

                    {/* Emoji Button */}
                    <button onClick={() => setShowPicker(!showPicker)} className="text-gray-400 hover:text-yellow-500 transition">
                        <i className="far fa-smile text-lg"></i>
                    </button>

                    {/* Send Button */}
                    <button
                        onClick={handleSendMessage}
                        className={`p-2 rounded-full transition ${newMessage || attachment ? 'text-blue-600 hover:bg-blue-50' : 'text-gray-300 cursor-not-allowed'}`}
                    >
                        <i className="fas fa-paper-plane text-lg"></i>
                    </button>
                </div>
            </div>

            {/* --- MODAL MỜI THÀNH VIÊN --- */}
            {showInviteModal && (
                <InviteMemberModal
                    isOpen={showInviteModal}
                    onClose={() => setShowInviteModal(false)}
                    activeChat={activeChat}
                    onMemberAdded={() => {
                        setShowInviteModal(false);
                    }}
                />
            )}
        </main>
    );
}