import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import UserSettingsModal from '../Modals/UserSettingsModal';

export default function UserBar({ currentUser, onLogout }) {
    const { theme, setTheme, primaryColor, setPrimaryColor, colors } = useTheme();
    const [showSettings, setShowSettings] = useState(false);

    // --- 1. STATE QUẢN LÝ TRẠNG THÁI ---
    // Mặc định là 'online'
    const [status, setStatus] = useState('online');
    const [showStatusMenu, setShowStatusMenu] = useState(false); // Menu con chọn trạng thái

    // State giả lập Mic/Loa
    const [micMuted, setMicMuted] = useState(false);
    const [soundMuted, setSoundMuted] = useState(false);

    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const settingsRef = useRef(null);

    const handleUpdateUser = (updatedUser) => {
        // Since user state is managed globally and we don't have easy context setter here,
        // reloading the page ensures all components (Sidebar, Header, etc.) get fresh data.
        window.location.reload();
    };

    // Đóng menu khi click ra ngoài
    useEffect(() => {
        function handleClickOutside(event) {
            if (settingsRef.current && !settingsRef.current.contains(event.target)) {
                setShowSettings(false);
                setShowStatusMenu(false); // Đóng luôn menu status nếu có
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // --- 2. CẤU HÌNH MÀU SẮC CHO TỪNG TRẠNG THÁI ---
    const statusConfig = {
        online: { color: 'bg-green-500', label: 'Trực tuyến', icon: 'fas fa-circle' },
        idle: { color: 'bg-yellow-500', label: 'Chờ', icon: 'fas fa-moon' }, // Discord dùng hình trăng khuyết cho Idle
        dnd: { color: 'bg-red-500', label: 'Không làm phiền', icon: 'fas fa-minus-circle' },
        invisible: { color: 'bg-gray-500', label: 'Ẩn', icon: 'fas fa-circle-notch' },
    };

    const handleStatusChange = (newStatus) => {
        setStatus(newStatus);
        setShowStatusMenu(false); // Đóng menu chọn status
        // TODO: Gọi API cập nhật trạng thái lên server tại đây
        // axios.post('/api/user/status', { status: newStatus });
    };

    return (
        <div className="h-[52px] bg-[#EBEDEF] dark:bg-[#232428] flex items-center px-2 flex-shrink-0 relative transition-colors duration-200 justify-between z-40">

            {/* --- USER INFO (AVATAR + STATUS) --- */}
            {/* Click vào đây sẽ mở menu chọn Status */}
            <div
                className="flex items-center gap-2 hover:bg-gray-200 dark:hover:bg-[#3F4147] py-1 px-1.5 rounded-md cursor-pointer transition min-w-0 group mr-1 relative"
                onClick={() => setShowStatusMenu(!showStatusMenu)}
            >
                <div className="relative flex-shrink-0">
                    <img src={currentUser.avatar_url || `https://ui-avatars.com/api/?name=${currentUser.name}`} className="w-8 h-8 rounded-full object-cover" />

                    {/* CHẤM TRẠNG THÁI (DYNAMIC COLOR) */}
                    <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-[2px] border-[#EBEDEF] dark:border-[#232428] flex items-center justify-center
                        ${statusConfig[status].color}
                    `}>
                        {/* Icon nhỏ bên trong chấm (nếu muốn giống Discord hơn) */}
                        {status === 'dnd' && <div className="w-1.5 h-0.5 bg-white rounded-full"></div>}
                        {status === 'idle' && <div className="w-1.5 h-1.5 bg-[#232428] rounded-full absolute -top-0.5 -left-0.5"></div>}
                    </div>
                </div>

                <div className="flex flex-col min-w-0">
                    <span className="text-gray-900 dark:text-white text-xs font-bold truncate max-w-[80px]">{currentUser.name}</span>
                    <span className="text-gray-500 dark:text-gray-400 text-[10px] truncate">
                        #{currentUser.id}
                    </span>
                </div>

                {/* --- MENU CHỌN TRẠNG THÁI (HIỆN KHI CLICK VÀO AVATAR) --- */}
                {showStatusMenu && (
                    <div className="absolute bottom-14 left-0 w-48 bg-white dark:bg-[#111214] rounded-lg shadow-2xl border border-gray-200 dark:border-[#1E1F22] p-1.5 z-[60] animate-fadeIn">
                        {Object.entries(statusConfig).map(([key, config]) => (
                            <button
                                key={key}
                                onClick={(e) => { e.stopPropagation(); handleStatusChange(key); }}
                                className={`w-full text-left px-2 py-1.5 rounded text-sm flex items-center gap-2 transition
                                    ${status === key ? 'bg-gray-100 dark:bg-[#404249]' : 'hover:bg-gray-100 dark:hover:bg-[#35373C]'}
                                    text-gray-700 dark:text-gray-300
                                `}
                            >
                                <div className={`w-2.5 h-2.5 rounded-full ${config.color}`}></div>
                                <span>{config.label}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* --- BUTTONS CONTROL (MIC - LOA - BÁNH RĂNG) --- */}
            <div className="flex items-center">

                {/* Mic */}
                <button
                    onClick={() => setMicMuted(!micMuted)}
                    className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-[#3F4147] text-gray-600 dark:text-gray-300 transition relative"
                    title={micMuted ? "Bật Mic" : "Tắt Mic"}
                >
                    <i className={`fas ${micMuted ? 'fa-microphone-slash text-red-500' : 'fa-microphone'}`}></i>
                </button>

                {/* Headphone */}
                <button
                    onClick={() => setSoundMuted(!soundMuted)}
                    className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-[#3F4147] text-gray-600 dark:text-gray-300 transition relative"
                    title={soundMuted ? "Bật tiếng" : "Tắt tiếng"}
                >
                    <i className={`fas ${soundMuted ? 'fa-headphones-alt text-red-500' : 'fa-headphones'}`}></i>
                    {soundMuted && <div className="absolute w-6 h-[1.5px] bg-red-500 rotate-45"></div>}
                </button>

                {/* Settings (Bánh răng) */}
                <div className="relative" ref={settingsRef}>
                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className={`w-8 h-8 flex items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-[#3F4147] transition
                            ${showSettings ? 'text-gray-900 dark:text-white rotate-90' : 'text-gray-600 dark:text-gray-300'}`}
                        title="Cài đặt người dùng"
                    >
                        <i className="fas fa-cog transition-transform duration-300"></i>
                    </button>

                    {/* --- MENU CÀI ĐẶT --- */}
                    {showSettings && (
                        <div className="absolute bottom-12 right-0 w-64 bg-white dark:bg-[#111214] rounded-lg shadow-2xl border border-gray-200 dark:border-[#1E1F22] p-2 z-50 animate-scaleIn origin-bottom-right">

                            <div className="px-2 py-1.5 mb-1 border-b border-gray-100 dark:border-[#2B2D31]">
                                <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Cài đặt</span>
                            </div>

                            {/* Giao diện */}
                            <div className="px-2 py-1">
                                <span className="text-xs text-gray-500 dark:text-gray-400 mb-1 block font-medium">Giao diện</span>
                                <div className="flex bg-gray-100 dark:bg-[#2B2D31] p-1 rounded-md mb-2">
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

                                <span className="text-xs text-gray-500 dark:text-gray-400 mb-1 block font-medium">Màu chủ đạo</span>
                                <div className="flex flex-wrap gap-2 px-1 mb-2">
                                    {colors && Object.entries(colors).map(([key, value]) => (
                                        <button
                                            key={key}
                                            onClick={() => setPrimaryColor(key)}
                                            className={`w-6 h-6 rounded-full border border-gray-200 dark:border-gray-600 flex items-center justify-center transition hover:scale-110 shadow-sm
                                                ${primaryColor === key ? 'ring-2 ring-offset-1 ring-blue-400 dark:ring-offset-[#111214]' : ''}
                                            `}
                                            style={{ backgroundColor: value.hex || value.primary }}
                                            title={key.charAt(0).toUpperCase() + key.slice(1)}
                                        >
                                            {primaryColor === key && <i className="fas fa-check text-[10px] text-white" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}></i>}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="h-[1px] bg-gray-200 dark:bg-[#2B2D31] my-2 mx-1"></div>

                            {/* Các nút chức năng */}
                            <button
                                onClick={() => { setShowSettings(false); setShowSettingsModal(true); }}
                                className="w-full text-left px-2 py-2 rounded text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#404249] flex items-center gap-3 transition"
                            >
                                <i className="fas fa-user-circle w-4"></i> Hồ sơ
                            </button>
                            <button
                                onClick={() => { setShowSettings(false); setShowSettingsModal(true); }}
                                className="w-full text-left px-2 py-2 rounded text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#404249] flex items-center gap-3 transition"
                            >
                                <i className="fas fa-lock w-4"></i> Đổi mật khẩu
                            </button>

                            <div className="h-[1px] bg-gray-200 dark:bg-[#2B2D31] my-2 mx-1"></div>

                            {/* Đăng xuất */}
                            <button
                                onClick={onLogout}
                                className="w-full text-left px-2 py-2 rounded text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 font-medium transition"
                            >
                                <i className="fas fa-sign-out-alt w-4"></i> Đăng xuất
                            </button>
                        </div>
                    )}
                </div>
            </div>
            {/* --- MODALS --- */}
            <UserSettingsModal
                isOpen={showSettingsModal}
                onClose={() => setShowSettingsModal(false)}
                currentUser={currentUser}
                onUpdateUser={handleUpdateUser}
            />
        </div>
    );
}