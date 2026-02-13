import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

export default function CreateTaskModal({ customer, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        due_date: '',
        assigned_to: 1
    });

    const handleSubmit = async () => {
        if (!formData.title || !formData.due_date) return toast.warning("⚠️ Nhập thiếu thông tin!");
        try {
            await axios.post('/api/tasks', { ...formData, customer_id: customer.id });
            onSuccess();
            onClose();
        } catch (err) { toast.error("❌ Lỗi tạo nhắc việc"); }
    };

    return (
        // THAY ĐỔI 1: Bỏ nền đen, dùng fixed nhưng cho phép click xuyên qua (pointer-events-none)
        <div className="fixed inset-0 z-50 flex items-start justify-end pt-20 pr-[320px] pointer-events-none">

            {/* THAY ĐỔI 2: Hộp thoại chính (pointer-events-auto), thêm shadow đậm */}
            <div className="bg-white rounded-lg w-[350px] shadow-2xl border border-gray-300 overflow-hidden pointer-events-auto">

                {/* Header có thể kéo thả (nếu cài thư viện) */}
                <div className="p-3 bg-gray-100 border-b flex justify-between items-center cursor-move">
                    <h3 className="font-bold text-sm text-gray-700">Tạo nhắc việc</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-red-500 px-2">
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                <div className="p-4 space-y-3">
                    <input
                        className="w-full border rounded p-2 text-sm focus:border-blue-500 outline-none font-medium"
                        placeholder="Tiêu đề (VD: Gọi lại check đơn)"
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                        autoFocus
                    />
                    <textarea
                        className="w-full border rounded p-2 text-sm focus:border-blue-500 outline-none resize-none"
                        placeholder="Mô tả chi tiết..."
                        rows="3"
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                    ></textarea>

                    <div className="flex flex-col gap-1">
                        <span className="text-xs font-bold text-gray-500">Hạn hoàn thành</span>
                        <input
                            type="datetime-local"
                            className="border rounded p-1.5 text-sm w-full"
                            value={formData.due_date}
                            onChange={e => setFormData({ ...formData, due_date: e.target.value })}
                        />
                    </div>
                </div>

                <div className="p-3 border-t bg-gray-50 flex justify-end gap-2">
                    <button onClick={onClose} className="px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-200 rounded">Hủy</button>
                    <button
                        onClick={handleSubmit}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded text-xs font-bold shadow"
                    >
                        Lưu nhắc việc
                    </button>
                </div>
            </div>
        </div>
    );
}

