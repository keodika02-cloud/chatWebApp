import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import CreateTaskModal from '../Modals/CreateTaskModal';
import CreateOrderModalV2 from '../Modals/CreateOrderModalV2';
import Avatar from '../Common/Avatar';

export default function CustomerRightSidebar({ activeChat }) {
    const customer = activeChat?.social_account?.customer;
    const social = activeChat?.social_account;

    // State cho hội thoại và dữ liệu
    const [history, setHistory] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);

    // State cho UI
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [pipeline, setPipeline] = useState('potential');
    const [note, setNote] = useState('');

    // Pagination cho lịch sử
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const LIMIT = 5;

    // Tải toàn bộ dữ liệu khi đổi khách
    useEffect(() => {
        if (customer) {
            setNote(customer.notes || '');
            setPipeline(customer.pipeline_stage || 'potential');
            loadHistory(true);
            loadOrders();
            loadTasks();
        }
    }, [customer?.id]);

    const loadTasks = () => {
        if (!customer) return;
        axios.get(`/ajax/customers/${customer.id}/tasks`)
            .then(res => setTasks(res.data))
            .catch(err => console.error(err));
    };

    const loadOrders = () => {
        if (!customer) return;
        axios.get(`/ajax/customers/${customer.id}/orders`)
            .then(res => setOrders(res.data))
            .catch(err => console.error(err));
    };

    const loadHistory = (isReset = false) => {
        if (!customer) return;
        setLoading(true);
        const currentOffset = isReset ? 0 : offset;

        axios.get(`/ajax/customers/${customer.id}/history?limit=${LIMIT}&offset=${currentOffset}`)
            .then(res => {
                if (isReset) {
                    setHistory(res.data);
                } else {
                    setHistory(prev => [...prev, ...res.data]);
                }
                if (res.data.length < LIMIT) setHasMore(false);
                setOffset(currentOffset + LIMIT);
            })
            .finally(() => setLoading(false));
    };

    const updatePipeline = (val) => {
        setPipeline(val);
        axios.put(`/ajax/customers/${customer.id}`, { pipeline_stage: val })
            .catch(() => toast.error("❌ Lỗi cập nhật trạng thái"));
    };

    const saveNote = () => {
        if (customer && note !== customer.notes) {
            axios.put(`/ajax/customers/${customer.id}`, { notes: note })
                .catch(() => toast.error('❌ Lỗi lưu ghi chú'));
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleString('vi-VN', {
            hour: '2-digit', minute: '2-digit',
            day: '2-digit', month: '2-digit'
        });
    };

    if (!activeChat?.is_customer || !customer) return null;

    return (
        <div className="w-[300px] border-l border-gray-200 bg-white flex flex-col h-full overflow-y-auto shadow-sm z-10 transition-colors duration-200 dark:bg-[#2B2D31] dark:border-[#1E1F22] custom-scrollbar">

            {/* 1. HEADER & PIPELINE */}
            <div className="p-4 border-b border-gray-100 dark:border-[#1F2023] bg-gray-50/30 dark:bg-[#2B2D31]">
                <div className="flex items-center gap-3 mb-4">
                    <div className="relative">
                        <Avatar src={social?.avatar} className="w-12 h-12 rounded-full border-2 border-white dark:border-[#3F4147] shadow-sm" />
                        <div className="absolute -bottom-1 -right-1 bg-white dark:bg-[#2B2D31] p-[2px] rounded-full shadow-sm">
                            {social?.platform === 'zalo' ?
                                <span className="bg-blue-500 text-white text-[8px] font-bold px-1 rounded-full">Z</span> :
                                <i className="fab fa-facebook text-[#1877F2] text-sm"></i>
                            }
                        </div>
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-gray-800 dark:text-gray-100 truncate text-base">{customer.full_name}</h3>
                        <div className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                            <i className="fas fa-phone-alt scale-75"></i> {customer.phone || 'Chưa có SĐT'}
                        </div>
                    </div>
                </div>

                {/* Pipeline Select */}
                <div className="relative">
                    <select
                        value={pipeline}
                        onChange={(e) => updatePipeline(e.target.value)}
                        className="w-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 text-[11px] font-black py-2 px-3 rounded-lg border border-blue-100 dark:border-blue-900/30 appearance-none cursor-pointer hover:bg-blue-100 transition shadow-sm uppercase tracking-wider"
                    >
                        <option value="potential">● TIỀM NĂNG</option>
                        <option value="lead">● ĐANG TƯ VẤN</option>
                        <option value="won">● THÀNH CÔNG</option>
                        <option value="lost">● THẤT BẠI</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-blue-400 text-[10px]">▼</div>
                </div>
            </div>

            {/* 2. ACTIONS: NHẮC VIỆC */}
            <div className="p-4 border-b border-gray-100 dark:border-[#1F2023]">
                <div className="flex justify-between items-center mb-3">
                    <span className="font-bold text-[13px] text-gray-800 dark:text-gray-200 uppercase tracking-tighter">Nhắc việc</span>
                    <button
                        onClick={() => setShowTaskModal(true)}
                        className="text-blue-600 dark:text-blue-400 text-xs font-bold hover:underline py-1 px-2 bg-blue-50 dark:bg-blue-900/10 rounded"
                    >
                        Tạo mới +
                    </button>
                </div>

                <div className="space-y-2">
                    {tasks.length > 0 ? (
                        tasks.slice(0, 3).map(task => (
                            <div key={task.id} className="text-[11px] p-2 bg-gray-50 dark:bg-[#35373C] rounded border dark:border-[#1F2023] group">
                                <div className="font-bold text-gray-700 dark:text-gray-200 truncate">{task.title}</div>
                                <div className="text-gray-400 mt-0.5 flex justify-between items-center font-medium">
                                    <span>Hạn: {formatDate(task.due_date)}</span>
                                    {task.status === 'pending' && <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse"></span>}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-[11px] text-gray-400 italic text-center py-2 flex items-center justify-center gap-2">
                            <i className="far fa-calendar-check opacity-50"></i> Chưa có nhắc việc nào
                        </div>
                    )}
                </div>
            </div>

            {/* 3. GHI CHÚ */}
            <div className="p-4 border-b border-gray-100 dark:border-[#1F2023]">
                <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-[13px] text-gray-800 dark:text-gray-200 uppercase tracking-tighter">Ghi chú nhanh</span>
                </div>
                <div className="relative">
                    <textarea
                        className="w-full text-[12px] bg-yellow-50/50 dark:bg-[#2B2D31] border border-yellow-100 dark:border-[#1F2023] rounded-lg p-3 focus:ring-1 focus:ring-yellow-400 outline-none min-h-[80px] text-gray-700 dark:text-gray-300 transition-all font-medium"
                        placeholder="Lưu ý về khách hàng này..."
                        rows="2"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        onBlur={saveNote}
                    ></textarea>
                    <div className="absolute bottom-2 right-2 flex gap-1">
                        <button onClick={saveNote} className="bg-yellow-500 hover:bg-yellow-600 text-white text-[10px] px-2.5 py-1 rounded shadow-sm opacity-80 hover:opacity-100 transition font-black">LƯU</button>
                    </div>
                </div>
            </div>

            {/* 4. ĐƠN HÀNG */}
            <div className="p-4 border-b border-gray-100 dark:border-[#1F2023]">
                <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-1.5">
                        <span className="font-bold text-[13px] text-gray-800 dark:text-gray-200 uppercase tracking-tighter">Đơn hàng</span>
                        <span className="bg-gray-100 dark:bg-[#1E1F22] text-gray-500 dark:text-gray-400 text-[10px] px-2 rounded-full font-bold">{orders.length}</span>
                    </div>
                    <button
                        onClick={() => setShowOrderModal(true)}
                        className="bg-green-500 hover:bg-green-600 text-white text-[11px] font-black px-3 py-1.5 rounded-lg transition shadow-sm active:scale-95"
                    >
                        TẠO ĐƠN
                    </button>
                </div>

                <div className="space-y-2">
                    {orders.slice(0, 2).map(order => (
                        <div key={order.id} className="p-2.5 border dark:border-[#1F2023] rounded-xl bg-gray-50 dark:bg-[#35373C] hover:border-blue-200 transition-colors">
                            <div className="flex justify-between items-center mb-1">
                                <span className="font-black text-[11px] text-gray-800 dark:text-gray-200">#{order.id}</span>
                                <span className="text-blue-600 dark:text-blue-400 font-black text-[11px]">{parseInt(order.total_amount).toLocaleString()}đ</span>
                            </div>
                            <div className="text-[10px] text-gray-400 font-medium capitalize">
                                {new Date(order.created_at).toLocaleDateString()} • {order.status}
                            </div>
                        </div>
                    ))}
                    {orders.length === 0 && (
                        <div className="text-center text-[11px] text-gray-400 italic py-2">Chưa có đơn hàng</div>
                    )}
                </div>
            </div>

            {/* 5. LỊCH SỬ HỘI THOẠI */}
            <div className="p-4 flex-1 bg-gray-50/50 dark:bg-[#2B2D31]">
                <div className="flex justify-between items-center mb-3">
                    <span className="font-bold text-[13px] text-gray-800 dark:text-gray-200 uppercase tracking-tighter">Hội thoại cũ</span>
                </div>
                <div className="space-y-2">
                    {history.map(conv => (
                        <div key={conv.id} className="bg-white dark:bg-[#313338] p-2.5 rounded-xl border border-blue-50 dark:border-[#1F2023] shadow-sm hover:shadow-md transition cursor-pointer">
                            <div className="text-[12px] text-gray-800 dark:text-gray-200 font-bold truncate">
                                {conv.messages?.[0]?.body || 'Bản tin lưu trữ'}
                            </div>
                            <div className="text-[10px] text-gray-400 mt-1 flex justify-between">
                                <span>{formatDate(conv.created_at)}</span>
                                <i className={`fab fa-${conv.type} text-[10px] opacity-30`}></i>
                            </div>
                        </div>
                    ))}
                    {hasMore && (
                        <button onClick={() => loadHistory()} className="w-full text-[11px] text-blue-500 font-bold py-2 hover:underline">Xem thêm...</button>
                    )}
                </div>
            </div>

            {/* MODALS */}
            {showTaskModal && (
                <CreateTaskModal
                    customer={customer}
                    onClose={() => setShowTaskModal(false)}
                    onSuccess={loadTasks}
                />
            )}

            {showOrderModal && (
                <CreateOrderModalV2
                    customer={customer}
                    onClose={() => setShowOrderModal(false)}
                    onSuccess={loadOrders}
                />
            )}
        </div>
    );
}
