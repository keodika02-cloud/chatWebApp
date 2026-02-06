import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import axios from 'axios';
import EmojiPicker from 'emoji-picker-react';
import { playSound, sendDesktopNotification } from '../../utils/notification';

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
            body: content,
            is_me: true,
            created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            sender: { name: currentUser.name },
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
        <main className="flex-1 flex flex-col h-full bg-white dark:bg-[#313338] transition-colors duration-200 relative">
            
            {/* --- HEADER --- */}
            <header className="h-12 border-b border-gray-200 dark:border-[#26272D] flex items-center justify-between px-4 bg-white dark:bg-[#313338] shadow-sm z-20 shrink-0">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="md:hidden text-gray-500 dark:text-gray-200">
                        <i className="fas fa-chevron-left text-xl"></i>
                    </button>
                    
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <img src={activeChat.partner_avatar || activeChat.avatar} className="w-8 h-8 rounded-full bg-gray-300 object-cover" />
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

                <div className="flex items-center gap-4 text-gray-500 dark:text-gray-300">
                    <button className="hover:text-gray-800 dark:hover:text-white transition"><i className="fas fa-phone-alt"></i></button>
                    <button className="hover:text-gray-800 dark:hover:text-white transition"><i className="fas fa-video"></i></button>
                    <button onClick={onToggleDetails} className={`hover:text-gray-800 dark:hover:text-white transition ${showDetails ? 'text-blue-500 dark:text-blue-400' : ''}`}>
                        <i className="fas fa-user-friends"></i>
                    </button>
                </div>
            </header>

            {/* --- MESSAGES LIST --- */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar bg-white dark:bg-[#313338]" ref={scrollContainerRef}>
                {loading && <div className="text-center py-4"><i className="fas fa-spinner fa-spin text-blue-500"></i></div>}

                {messages.map((msg, index) => {
                    const isMe = msg.is_me;
                    const isEmojiOnly = isOnlyEmojis(msg.body);
                    const prevIsMe = messages[index - 1]?.is_me === isMe;
                    const showAvatar = !isMe && (!prevIsMe);

                    return (
                        <div key={msg.id || index} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group mb-1`}>
                            {!isMe && (
                                <div className="w-10 flex-shrink-0 flex items-start">
                                    {showAvatar ? (
                                        <img src={msg.sender?.avatar || activeChat.partner_avatar} className="w-8 h-8 rounded-full object-cover mt-1 cursor-pointer" />
                                    ) : <div className="w-8"></div>}
                                </div>
                            )}

                            <div className="max-w-[80%]">
                                {!isMe && showAvatar && activeChat.type === 'group' && (
                                    <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 ml-1 mb-0.5 block">
                                        {msg.sender?.name}
                                    </span>
                                )}

                                <div className={`px-3 py-2 text-[15px] break-words relative transition-colors
                                    ${isMe 
                                        ? 'bg-[#0084ff] text-white rounded-l-2xl rounded-tr-2xl rounded-br-md' 
                                        : 'bg-[#F2F3F5] dark:bg-[#2B2D31] text-gray-900 dark:text-gray-100 rounded-r-2xl rounded-tl-2xl rounded-bl-md'}
                                    ${isEmojiOnly ? '!bg-transparent !p-0 text-4xl' : ''}
                                `}>
                                    {msg.attachment_type === 'image' && msg.attachment_path && (
                                        <img src={msg.attachment_path} className="max-w-[240px] rounded-lg mb-1 cursor-pointer" onClick={() => window.open(msg.attachment_path)} />
                                    )}
                                    {msg.body}
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* --- INPUT AREA --- */}
            <div className="p-3 bg-white dark:bg-[#313338] border-t border-gray-200 dark:border-[#26272D] relative z-30">
                {attachment && (
                    <div className="absolute bottom-full left-4 mb-2 bg-[#F2F3F5] dark:bg-[#2B2D31] p-2 rounded-lg shadow-lg flex items-center gap-2 border border-gray-200 dark:border-gray-700">
                        {previewUrl ? <img src={previewUrl} className="w-10 h-10 object-cover rounded" /> : <i className="fas fa-file text-blue-500 text-2xl"></i>}
                        <span className="text-xs dark:text-gray-200 truncate max-w-[150px]">{attachment.name}</span>
                        <button onClick={clearAttachment} className="text-gray-500 hover:text-red-500"><i className="fas fa-times-circle"></i></button>
                    </div>
                )}

                {showPicker && (
                    <div className="absolute bottom-16 right-4 z-50">
                        <EmojiPicker onEmojiClick={onEmojiClick} theme="auto" height={350} />
                    </div>
                )}

                <div className="flex items-center bg-[#EBEDEF] dark:bg-[#383A40] rounded-lg px-2 py-2">
                    <button onClick={() => fileInputRef.current.click()} className="w-8 h-8 flex items-center justify-center text-gray-500 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition rounded-full">
                        <i className="fas fa-plus-circle text-xl"></i>
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />

                    <form onSubmit={handleSendMessage} className="flex-1 mx-2">
                        <input
                            ref={inputRef}
                            type="text"
                            className="w-full bg-transparent border-none focus:ring-0 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 px-0 py-1 outline-none"
                            placeholder={`Nhắn cho ${activeChat.partner_name || activeChat.name}`}
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                        />
                    </form>

                    <button onClick={() => setShowPicker(!showPicker)} className="w-8 h-8 flex items-center justify-center text-gray-500 dark:text-gray-300 hover:text-yellow-500 transition rounded-full">
                        <i className="fas fa-smile text-xl"></i>
                    </button>
                    
                    <button onClick={handleSendMessage} className={`w-8 h-8 flex items-center justify-center transition rounded-full ml-1 ${newMessage || attachment ? 'text-blue-500 hover:bg-blue-500/10' : 'text-gray-400 cursor-not-allowed'}`}>
                        <i className="fas fa-paper-plane"></i>
                    </button>
                </div>
            </div>
        </main>
    );
}