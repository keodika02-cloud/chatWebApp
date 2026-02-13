
import React, { useState, useRef } from 'react';
import axios from 'axios';

export default function UserSettingsModal({ isOpen, onClose, currentUser, onUpdateUser }) {
    if (!isOpen) return null;

    const [formData, setFormData] = useState({
        name: currentUser.name || '',
        password: '',
        password_confirmation: '',
    });
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(currentUser.avatar_url);
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef(null);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const data = new FormData();
        data.append('name', formData.name);
        if (avatarFile) {
            data.append('avatar', avatarFile);
        }
        if (formData.password) {
            data.append('password', formData.password);
            data.append('password_confirmation', formData.password_confirmation);
        }

        try {
            const response = await axios.post('/api/user/update-profile', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response.data.status === 'success') {
                if (onUpdateUser) {
                    onUpdateUser(response.data.user);
                }
                onClose();
            }
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật hồ sơ.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-[#313338] w-full max-w-md rounded-lg shadow-2xl overflow-hidden animate-scaleIn">
                {/* Header */}
                <div className="bg-[#F2F3F5] dark:bg-[#2B2D31] px-4 py-3 flex justify-between items-center relative">
                    <h3 className="text-base font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wide">
                        Cài đặt tài khoản
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition"
                    >
                        <i className="fas fa-times text-lg"></i>
                    </button>
                    {/* Decorative bottom border */}
                    <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent opacity-50"></div>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-sm relative">
                            {error}
                        </div>
                    )}

                    {/* Avatar Upload */}
                    <div className="flex flex-col items-center gap-2 mb-2">
                        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current.click()}>
                            <img
                                src={avatarPreview || `https://ui-avatars.com/api/?name=${formData.name}`}
                                alt="Avatar"
                                className="w-20 h-20 rounded-full object-cover border-4 border-[#EBEDEF] dark:border-[#1E1F22] shadow-lg transition duration-300 group-hover:opacity-80"
                            />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded-full">
                                <i className="fas fa-camera text-white text-xl shadow-sm"></i>
                            </div>
                            {/* Status indicator (decorative) */}
                            <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-[#313338] rounded-full"></div>
                        </div>
                        <span className="text-xs text-blue-500 dark:text-blue-400 hover:underline cursor-pointer font-medium" onClick={() => fileInputRef.current.click()}>
                            Thay đổi ảnh đại diện
                        </span>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                            accept="image/*"
                        />
                    </div>

                    {/* Name Input */}
                    <div className="space-y-1">
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide pl-0.5">
                            Tên hiển thị
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full bg-[#E3E5E8] dark:bg-[#1E1F22] text-gray-800 dark:text-gray-200 text-sm p-2.5 rounded border-none focus:ring-0 focus:outline-none focus:bg-gray-200 dark:focus:bg-black/40 transition font-medium"
                                placeholder="Nhập tên của bạn"
                                required
                            />
                            <i className="fas fa-pen absolute right-3 top-3 text-gray-400 text-xs"></i>
                        </div>
                    </div>

                    <div className="h-[1px] bg-gray-200 dark:bg-[#3F4147] my-2"></div>

                    {/* Password Change Section (Optional) */}
                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide pl-0.5">
                            Đổi mật khẩu <span className="normal-case font-normal text-[10px] text-gray-400">(Bỏ trống nếu không đổi)</span>
                        </label>
                        <div className="grid grid-cols-1 gap-3">
                            <div className="relative">
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="w-full bg-[#E3E5E8] dark:bg-[#1E1F22] text-gray-800 dark:text-gray-200 text-sm p-2.5 rounded border-none focus:ring-0 focus:outline-none focus:bg-gray-200 dark:focus:bg-black/40 transition"
                                    placeholder="Mật khẩu mới"
                                />
                                <i className="fas fa-lock absolute right-3 top-3 text-gray-400 text-xs"></i>
                            </div>
                            <div className="relative">
                                <input
                                    type="password"
                                    name="password_confirmation"
                                    value={formData.password_confirmation}
                                    onChange={handleChange}
                                    className="w-full bg-[#E3E5E8] dark:bg-[#1E1F22] text-gray-800 dark:text-gray-200 text-sm p-2.5 rounded border-none focus:ring-0 focus:outline-none focus:bg-gray-200 dark:focus:bg-black/40 transition"
                                    placeholder="Xác nhận mật khẩu"
                                />
                                <i className="fas fa-check absolute right-3 top-3 text-gray-400 text-xs"></i>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-2 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-white hover:underline transition"
                        >
                            Hủy bỏ
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`px-5 py-2 text-sm font-bold text-white bg-[#5865F2] hover:bg-[#4752C4] rounded shadow-md transition-all active:scale-95 flex items-center gap-2
                                ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}
                            `}
                        >
                            {isLoading ? (
                                <><i className="fas fa-spinner fa-spin"></i> Đang lưu...</>
                            ) : (
                                <><i className="fas fa-save"></i> Lưu thay đổi</>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
