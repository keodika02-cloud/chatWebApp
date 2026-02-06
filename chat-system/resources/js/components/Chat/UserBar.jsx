import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

export default function UserBar({ currentUser, onLogout }) {
    const { theme, setTheme } = useTheme();
    const [showSettings, setShowSettings] = useState(false);
    
    // State giả lập Mic/Loa (để gạch chéo icon giống Discord)
    const [micMuted, setMicMuted] = useState(false);
    const [soundMuted, setSoundMuted] = useState(false);

    const settingsRef = useRef(null);

    // Đóng menu khi click ra ngoài
    useEffect(() => {
        function handleClickOutside(event) {
            if (settingsRef.current && !settingsRef.current.contains(event.target)) {
                setShowSettings(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="h-[52px] bg-[#EBEDEF] dark:bg-[#232428] flex items-center px-2 flex-shrink-0 relative transition-colors duration-200 justify-between">
            
            {/* 1. USER INFO (Bên trái) */}
            <div className="flex items-center gap-2 hover:bg-gray-200 dark:hover:bg-[#3F4147] py-1 px-1.5 rounded-md cursor-pointer transition min-w-0 group mr-1">
                <div className="relative flex-shrink-0">
                    <img src={currentUser.avatar_url || `https://ui-avatars.com/api/?name=${currentUser.name}`} className="w-8 h-8 rounded-full object-cover" />
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#EBEDEF] dark:border-[#232428]"></div>
                </div>
                <div className="flex flex-col min-w-0">
                    <span className="text-gray-900 dark:text-white text-xs font-bold truncate max-w-[80px]">{currentUser.name}</span>
                    <span className="text-gray-500 dark:text-gray-400 text-[10px] truncate">#{currentUser.id}</span>
                </div>
            </div>

            {/* 2. BUTTONS CONTROL (Bên phải: Mic - Loa - Bánh răng) */}
            <div className="flex items-center">
                
                {/* Nút Mic */}
                <button 
                    onClick={() => setMicMuted(!micMuted)}
                    className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-[#3F4147] text-gray-600 dark:text-gray-300 transition relative"
                    title={micMuted ? "Bật Mic" : "Tắt Mic"}
                >
                    <i className={`fas ${micMuted ? 'fa-microphone-slash text-red-500' : 'fa-microphone'}`}></i>
                </button>

                {/* Nút Loa/Headphone */}
                <button 
                    onClick={() => setSoundMuted(!soundMuted)}
                    className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-[#3F4147] text-gray-600 dark:text-gray-300 transition"
                    title={soundMuted ? "Bật tiếng" : "Tắt tiếng"}
                >
                    <i className={`fas ${soundMuted ? 'fa-headphones-alt text-red-500' : 'fa-headphones'}`}></i>
                    {/* Gạch chéo thủ công nếu cần visual icon headphone-slash */}
                    {soundMuted && <div className="absolute w-6 h-[2px] bg-red-500 rotate-45"></div>}
                </button>

                {/* Nút Cài đặt (Bánh răng) */}
                <div className="relative" ref={settingsRef}>
                    <button 
                        onClick={() => setShowSettings(!showSettings)}
                        className={`w-8 h-8 flex items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-[#3F4147] transition
                            ${showSettings ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}
                        title="Cài đặt người dùng"
                    >
                        <i className="fas fa-cog"></i>
                    </button>

                    {/* --- MENU CÀI ĐẶT (POPUP) --- */}
                    {showSettings && (
                        <div className="absolute bottom-12 right-0 w-56 bg-white dark:bg-[#111214] rounded-lg shadow-xl border border-gray-200 dark:border-[#1E1F22] p-1.5 z-50 animate-fadeIn origin-bottom-right">
                            
                            {/* Header Menu */}
                            <div className="px-2 py-1.5 mb-1 border-b border-gray-100 dark:border-[#2B2D31]">
                                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Cài đặt</span>
                            </div>

                            {/* Mục 1: Đổi Giao diện */}
                            <div className="px-2 py-1">
                                <span className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Giao diện</span>
                                <div className="flex bg-gray-100 dark:bg-[#2B2D31] p-1 rounded-md">
                                    {['light', 'dark', 'system'].map(mode => (
                                        <button
                                            key={mode}
                                            onClick={() => setTheme(mode)}
                                            className={`flex-1 py-1 rounded text-xs flex justify-center items-center transition-all
                                                ${theme === mode 
                                                    ? 'bg-white dark:bg-[#404249] text-black dark:text-white shadow-sm font-bold' 
                                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                                            title={mode === 'light' ? 'Sáng' : mode === 'dark' ? 'Tối' : 'Hệ thống'}
                                        >
                                            <i className={`fas ${mode === 'light' ? 'fa-sun' : mode === 'dark' ? 'fa-moon' : 'fa-desktop'}`}></i>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="h-[1px] bg-gray-200 dark:bg-[#2B2D31] my-1 mx-2"></div>

                            {/* Mục 2: Các menu khác (Giả lập) */}
                            <button className="w-full text-left px-2 py-1.5 rounded text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#404249] flex items-center gap-2">
                                <i className="fas fa-user-circle w-4"></i> Tài khoản của tôi
                            </button>
                            <button className="w-full text-left px-2 py-1.5 rounded text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#404249] flex items-center gap-2">
                                <i className="fas fa-shield-alt w-4"></i> Quyền riêng tư
                            </button>

                            <div className="h-[1px] bg-gray-200 dark:bg-[#2B2D31] my-1 mx-2"></div>

                            {/* Mục 3: Đăng xuất */}
                            <button 
                                onClick={onLogout}
                                className="w-full text-left px-2 py-1.5 rounded text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 font-medium"
                            >
                                <i className="fas fa-sign-out-alt w-4"></i> Đăng xuất
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}