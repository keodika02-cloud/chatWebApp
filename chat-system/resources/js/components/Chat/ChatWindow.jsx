import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import axios from 'axios';
import { playSound, sendDesktopNotification } from '../../utils/notification'; // Thêm import

export default function ChatWindow({ activeChat, currentUser, onMessageSent, onBack }) { // Thêm prop onBack
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [attachment, setAttachment] = useState(null); // File đang chọn
    const [previewUrl, setPreviewUrl] = useState(null); // URL ảnh xem trước
    const [loading, setLoading] = useState(false);

    const messagesEndRef = useRef(null);
    const scrollContainerRef = useRef(null);
    const fileInputRef = useRef(null); // Ref cho input file ẩn

    // Initial Load
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
                console.error("Error fetching messages", error);
            } finally {
                setLoading(false);
            }
        };

        fetchMessages();

        // Real-time listener
        const channelName = `conversation.${activeChat.conversation_id}`;
        if (window.Echo) {
            window.Echo.private(channelName)
                .listen('MessageSent', (e) => {
                    console.log("New message:", e);
                    // Bỏ qua tin mình gửi
                    if ((e.user_id && e.user_id === currentUser.id) || (e.sender && e.sender.name === currentUser.name)) {
                        return;
                    }

                    // -> PHÁT ÂM THANH & THÔNG BÁO CHO ACTIVE CHAT <-
                    playSound();
                    if (document.visibilityState === 'hidden') {
                        sendDesktopNotification(e.sender.name, e.body || 'Đã gửi một file đính kèm', e.sender.avatar);
                    }

                    setMessages(prev => {
                        // Tránh duplicate
                        if (prev.some(m => m.id === e.id)) return prev;

                        const incoming = {
                            ...e,
                            is_me: false,
                        };
                        return [...prev, incoming];
                    });

                    onMessageSent();
                });
        }

        return () => {
            if (window.Echo) window.Echo.leave(channelName);
        };
    }, [activeChat?.conversation_id]);

    // Auto scroll bottom
    useLayoutEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, previewUrl]);

    // Xử lý chọn file
    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Giới hạn 10MB
        if (file.size > 10 * 1024 * 1024) {
            alert("File quá lớn! Vui lòng chọn file dưới 10MB.");
            return;
        }

        setAttachment(file);

        // Tạo preview nếu là ảnh
        if (file.type.startsWith('image/')) {
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        } else {
            setPreviewUrl(null);
        }
    };

    // Xóa file đang chọn
    const clearAttachment = () => {
        setAttachment(null);
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // Hàm render nội dung tin nhắn
    const renderMessageContent = (msg) => {
        return (
            <div>
                {/* 1. Ảnh */}
                {msg.attachment_type === 'image' && msg.attachment_path && (
                    <div className="mb-1">
                        <img
                            src={msg.attachment_path}
                            alt="Attachment"
                            className="max-w-[200px] max-h-[300px] rounded-lg cursor-pointer hover:opacity-90 transition"
                            onClick={() => window.open(msg.attachment_path, '_blank')}
                        />
                    </div>
                )}

                {/* 2. File */}
                {msg.attachment_type === 'file' && msg.attachment_path && (
                    <a href={msg.attachment_path} target="_blank" className="flex items-center gap-2 p-2 rounded-lg bg-black/5 hover:bg-black/10 transition mb-1">
                        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-blue-500">
                            <i className="fas fa-file-alt"></i>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-xs truncate max-w-[120px]">{msg.attachment_name || 'File'}</p>
                            <span className="text-[10px] opacity-70">Nhấn tải về</span>
                        </div>
                    </a>
                )}

                {/* 3. Text */}
                {msg.body && <p>{msg.body}</p>}

                {/* Trạng thái lỗi */}
                {msg.isError && <p className="text-[10px] text-red-500 mt-1">Lỗi gửi tin</p>}
            </div>
        );
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        // Sửa lỗi biến selectedFile -> attachment
        if ((!newMessage.trim() && !attachment) || !activeChat?.conversation_id) return;

        const content = newMessage.trim();
        const fileToSend = attachment;

        // Reset Input ngay lập tức
        setNewMessage('');
        clearAttachment();

        // Optimistic UI
        const tempId = Date.now();
        const optimisticMessage = {
            id: tempId,
            body: content,
            is_me: true,
            created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            sender: { name: currentUser.name },
            isOptimistic: true,
            attachment_type: fileToSend ? (fileToSend.type.startsWith('image/') ? 'image' : 'file') : null,
            attachment_path: fileToSend && fileToSend.type.startsWith('image/') ? URL.createObjectURL(fileToSend) : null,
            attachment_name: fileToSend ? fileToSend.name : null
        };

        setMessages(prev => [...prev, optimisticMessage]);

        try {
            const formData = new FormData();
            formData.append('body', content);
            if (fileToSend) formData.append('attachment', fileToSend);

            const res = await axios.post(`/ajax/conversations/${activeChat.conversation_id}/messages`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setMessages(prev => prev.map(m => {
                if (m.id === tempId) {
                    return { ...res.data.message, is_me: true, isOptimistic: false };
                }
                return m;
            }));
            onMessageSent();
        } catch (error) {
            console.error("Failed", error);
            setMessages(prev => prev.map(m => m.id === tempId ? { ...m, isError: true } : m));
        }
    };

    if (!activeChat) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-[#f0f2f5]">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                    <i className="fas fa-comments text-4xl text-blue-500"></i>
                </div>
                <h2 className="text-xl font-bold text-gray-700">QVC Chat System</h2>
                <p className="text-gray-500 text-sm mt-2">Chọn nhân viên để bắt đầu.</p>
            </div>
        );
    }

    return (
        <main className="flex-1 flex flex-col h-full bg-white relative">
            {/* Header: Giống Messenger */}
            <header className="h-[60px] border-b border-gray-200 flex items-center justify-between px-4 bg-white shadow-sm z-10 shrink-0">
                <div className="flex items-center gap-3">
                    {/* Nút Back (Chỉ hiện Mobile) */}
                    <button onClick={onBack} className="md:hidden mr-1 text-blue-600">
                        <i className="fas fa-chevron-left text-2xl"></i>
                    </button>

                    <div className="relative">
                        <img src={activeChat?.partner_avatar || activeChat?.avatar} className="w-10 h-10 rounded-full object-cover" />
                        {activeChat?.is_online && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>}
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 text-[15px] leading-tight">{activeChat?.partner_name || activeChat?.name}</h3>
                        <p className="text-xs text-gray-500">Đang hoạt động</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 text-blue-600 text-xl">
                    <i className="fas fa-phone-alt cursor-pointer hover:bg-gray-100 p-2 rounded-full"></i>
                    <i className="fas fa-video cursor-pointer hover:bg-gray-100 p-2 rounded-full"></i>
                    <i className="fas fa-info-circle cursor-pointer hover:bg-gray-100 p-2 rounded-full"></i>
                </div>
            </header>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1" ref={scrollContainerRef}>
                {messages.map((msg, index) => {
                    const isMe = msg.is_me;
                    // Logic bo góc (Giống Messenger: tin liên tiếp sẽ bo ít hơn)
                    const prevIsMe = messages[index - 1]?.is_me === isMe;
                    const nextIsMe = messages[index + 1]?.is_me === isMe;

                    const roundedClass = isMe
                        ? `${prevIsMe ? 'rounded-tr-md' : 'rounded-tr-2xl'} ${nextIsMe ? 'rounded-br-md' : 'rounded-br-2xl'} rounded-l-2xl`
                        : `${prevIsMe ? 'rounded-tl-md' : 'rounded-tl-2xl'} ${nextIsMe ? 'rounded-bl-md' : 'rounded-bl-2xl'} rounded-r-2xl`;

                    return (
                        <div key={msg.id || index} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group`}>
                            {/* Avatar nhỏ bên trái nếu là người khác */}
                            {!isMe && (
                                <div className="w-7 mr-2 flex items-end">
                                    {!nextIsMe ? (
                                        <img src={msg.sender.avatar || activeChat.avatar} className="w-7 h-7 rounded-full" />
                                    ) : <div className="w-7"></div>}
                                </div>
                            )}

                            {/* Bong bóng Chat */}
                            <div className={`px-3 py-2 text-[15px] max-w-[70%] break-words shadow-sm relative 
                                ${roundedClass}
                                ${isMe ? 'bg-[#0084ff] text-white' : 'bg-[#e4e6eb] text-gray-900'}
                            `}>
                                {/* Hiển thị nội dung (Text/File/Ảnh - Code cũ của bạn) */}
                                {renderMessageContent(msg)} {/* <-- Gọi hàm render cũ */}

                                {/* Tooltip ngày giờ (Hover mới hiện bên cạnh) */}
                                <span className={`absolute top-1/2 -translate-y-1/2 text-[10px] text-gray-400 opacity-0 group-hover:opacity-100 transition whitespace-nowrap
                                    ${isMe ? '-left-12' : '-right-12'}
                                `}>
                                    {msg.created_at}
                                </span>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area (Kiểu Viên Thuốc) */}
            <div className="p-3 bg-white flex items-end gap-2">
                {/* Các nút chức năng (Ảnh, Sticker, Gif) */}
                <div className="flex items-center gap-1 mb-2 text-blue-600">
                    <i className="fas fa-plus-circle text-2xl cursor-pointer hover:text-blue-700"></i>

                    <button type="button" onClick={() => fileInputRef.current.click()} className="p-2 hover:bg-gray-100 rounded-full transition">
                        <i className="fas fa-images text-xl"></i>
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-full transition hidden sm:block">
                        <i className="fas fa-sticky-note text-xl"></i>
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-full transition hidden sm:block">
                        <i className="fas fa-gift text-xl"></i>
                    </button>

                    {/* Input file ẩn */}
                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
                </div>

                {/* Ô Nhập liệu & Preview File */}
                <div className="flex-1 bg-[#f0f2f5] rounded-3xl flex flex-col px-4 py-2 relative">
                    {/* Preview file nếu có */}
                    {attachment && (
                        <div className="flex items-center gap-2 mb-2 p-1 bg-white rounded-lg w-fit shadow-sm">
                            <span className="text-xs text-blue-600 max-w-[150px] truncate">{attachment.name}</span>
                            <i onClick={clearAttachment} className="fas fa-times-circle text-gray-400 cursor-pointer hover:text-red-500"></i>
                        </div>
                    )}

                    <form onSubmit={handleSendMessage} className="flex items-center w-full">
                        <input
                            type="text"
                            className="w-full bg-transparent border-none focus:ring-0 text-gray-900 placeholder-gray-500 px-0 py-1 outline-none max-h-20 overflow-y-auto"
                            placeholder="Aa"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                        />
                        <button className="text-blue-600 hover:text-blue-700 ml-2">
                            <i className="fas fa-smile text-xl"></i>
                        </button>
                    </form>
                </div>

                {/* Nút Gửi (Chỉ hiện khi có text) */}
                <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() && !attachment}
                    className={`mb-2 p-2 transition ${(!newMessage.trim() && !attachment) ? 'text-blue-300' : 'text-blue-600 hover:scale-110'}`}
                >
                    <i className="fas fa-paper-plane text-2xl"></i>
                </button>
            </div>
        </main>
    );
}
