import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

export default function SalesSidebar({ activeChat, currentUser }) {
    const [mode, setMode] = useState('dashboard');
    const [loading, setLoading] = useState(false);

    // --- POS STATE ---
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loadingProducts, setLoadingProducts] = useState(false);

    // --- CRM STATE ---
    const [profile, setProfile] = useState({
        phone: '', email: '', address: '', notes: '',
        pipeline_stage: 'new', tags: []
    });
    const [stats, setStats] = useState({ order_count: 0, total_spent: 0, orders: [] });

    // --- LOAD DATA ---
    useEffect(() => {
        console.log("SalesSidebar: activeChat changed", activeChat); // DEBUG LOG

        if (activeChat && activeChat.target_id) {
            setLoading(true);
            console.log(`Fetching stats for customer ID: ${activeChat.target_id}`); // DEBUG LOG

            axios.get(`/ajax/sales/customer/${activeChat.target_id}`)
                .then(res => {
                    console.log("Stats received:", res.data); // DEBUG LOG
                    setStats(res.data);
                    if (res.data.profile) {
                        setProfile(prev => ({ ...prev, ...res.data.profile }));
                    }
                })
                .catch(err => {
                    console.error("Error fetching stats:", err);
                })
                .finally(() => setLoading(false));
        } else {
            console.log("No valid target_id in activeChat to fetch stats.");
        }
    }, [activeChat]);

    // --- POS SEARCH ---
    useEffect(() => {
        if (mode === 'create_order') {
            const timer = setTimeout(() => {
                setLoadingProducts(true);
                axios.get(`/ajax/sales/products?q=${searchTerm}`)
                    .then(res => {
                        setProducts(res.data);
                        setLoadingProducts(false);
                    })
                    .catch(() => setLoadingProducts(false));
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [searchTerm, mode]);

    // --- POS CART LOGIC ---
    const addToCart = (product) => {
        setCart(prev => {
            const exist = prev.find(p => p.id === product.id);
            if (exist) return prev.map(p => p.id === product.id ? { ...p, qty: p.qty + 1 } : p);
            return [...prev, { ...product, qty: 1 }];
        });
    };

    const removeFromCart = (id) => {
        setCart(prev => prev.filter(p => p.id !== id));
    };

    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

    const handleCreateOrder = async () => {
        if (cart.length === 0) return;
        if (!confirm('Xác nhận tạo đơn và gửi hóa đơn?')) return;

        try {
            await axios.post('/ajax/sales/orders', {
                conversation_id: activeChat.conversation_id,
                customer_id: activeChat.target_id,
                total_amount: totalAmount,
                items: cart
            });

            toast.success("✅ Đã tạo đơn thành công!");
            setCart([]);
            setMode('dashboard');

            // Refresh lại thông tin khách
            console.log("Refreshing stats after order...");
            axios.get(`/ajax/sales/customer/${activeChat.target_id}`)
                .then(res => {
                    setStats(res.data);
                    if (res.data.profile) setProfile(prev => ({ ...prev, ...res.data.profile }));
                });

        } catch (error) {
            console.error(error);
            toast.error("❌ Lỗi tạo đơn: " + (error.response?.data?.error || error.message));
        }
    };

    // --- CRM UPDATE ---
    const handleUpdate = (field, value) => {
        const newProfile = { ...profile, [field]: value };
        setProfile(newProfile);

        axios.post(`/ajax/sales/customer/${activeChat.target_id}/update`, {
            [field]: value
        }).catch(err => console.error("Lỗi lưu:", err));
    };

    // --- RENDER POS ---
    const renderCreateOrder = () => (
        <div className="flex flex-col h-full bg-white dark:bg-[#2B2D31] w-full custom-scrollbar transition-colors">
            {/* Header */}
            <div className="p-3 border-b border-gray-200 dark:border-[#1E1F22] flex items-center gap-2 bg-blue-50 dark:bg-[#313338]">
                <button onClick={() => setMode('dashboard')} className="text-gray-500 hover:text-blue-600 dark:text-gray-300">
                    <i className="fas fa-arrow-left"></i>
                </button>
                <h3 className="font-bold text-gray-800 dark:text-white">Tạo đơn mới</h3>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
                {/* Search */}
                <div className="relative mb-3">
                    <input
                        type="text"
                        placeholder="Tìm tên sản phẩm..."
                        className="w-full pl-8 pr-3 py-2 border rounded text-sm outline-none focus:border-blue-500 bg-white dark:bg-[#1E1F22] dark:border-gray-700 dark:text-white"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                    <i className="fas fa-search absolute left-2.5 top-2.5 text-gray-400 text-xs"></i>
                </div>

                {/* Products */}
                <div className="space-y-2 mb-4">
                    {loadingProducts && <div className="text-center text-xs text-gray-400">Đang tìm...</div>}

                    {products.map(p => (
                        <div key={p.id} onClick={() => addToCart(p)} className="flex items-center gap-2 p-2 border border-gray-100 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-[#35373C] cursor-pointer transition bg-white dark:bg-[#2B2D31]">
                            <img src={p.image_url} className="w-10 h-10 rounded object-cover bg-gray-200" />
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold truncate text-gray-800 dark:text-gray-200">{p.name}</p>
                                <div className="flex justify-between">
                                    <p className="text-xs text-blue-600 font-semibold">{parseInt(p.price).toLocaleString()}đ</p>
                                    <p className="text-[10px] text-gray-400">Kho: {p.stock}</p>
                                </div>
                            </div>
                            <i className="fas fa-plus-circle text-blue-500"></i>
                        </div>
                    ))}
                </div>

                {/* Cart */}
                {cart.length > 0 && (
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Đang chọn ({cart.length})</h4>
                        {cart.map(item => (
                            <div key={item.id} className="flex justify-between items-center text-sm mb-2 group">
                                <div className="flex items-center gap-1 overflow-hidden">
                                    <i onClick={() => removeFromCart(item.id)} className="fas fa-minus-circle text-red-400 cursor-pointer hover:text-red-600 mr-1"></i>
                                    <span className="truncate w-32 text-gray-800 dark:text-gray-300">{item.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-gray-800 dark:text-white">x{item.qty}</span>
                                    <span className="text-gray-600 dark:text-gray-400 w-20 text-right">{(item.price * item.qty).toLocaleString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-gray-200 dark:border-[#1E1F22] bg-gray-50 dark:bg-[#313338]">
                <div className="flex justify-between mb-2 font-bold text-gray-800 dark:text-white">
                    <span>Tổng cộng:</span>
                    <span className="text-red-500 text-lg">{totalAmount.toLocaleString()}đ</span>
                </div>
                <button
                    className="w-full bg-green-600 text-white py-2 rounded font-bold hover:bg-green-700 transition disabled:opacity-50"
                    onClick={handleCreateOrder}
                    disabled={cart.length === 0}
                >
                    Tạo & Gửi Hóa Đơn
                </button>
            </div>
        </div>
    );

    // --- RENDER DASHBOARD ---
    const renderDashboard = () => (
        <div className="flex flex-col h-full bg-white dark:bg-[#2B2D31] w-full overflow-y-auto custom-scrollbar">

            {/* 1. Header Avatar */}
            <div className="p-4 border-b border-gray-100 dark:border-[#1E1F22] text-center">
                <div className="relative inline-block">
                    <img src={activeChat.avatar} className="w-20 h-20 rounded-full object-cover border-4 border-white dark:border-[#313338] shadow-sm" />
                    <span className="absolute bottom-1 right-1 bg-white p-1 rounded-full shadow-sm">
                        <i className="fab fa-facebook text-blue-600"></i>
                    </span>
                </div>
                <h3 className="font-bold text-lg mt-2 text-gray-800 dark:text-white">{activeChat.name}</h3>
                <div className="text-xs text-gray-400 mt-1">ID: {activeChat.target_id}</div>

                {/* Dropdown Pipeline Status */}
                <div className="mt-2 flex justify-center">
                    <select
                        value={profile.pipeline_stage}
                        onChange={(e) => handleUpdate('pipeline_stage', e.target.value)}
                        className={`text-xs font-bold py-1 px-3 rounded-full border-none outline-none appearance-none cursor-pointer text-center
                            ${profile.pipeline_stage === 'won' ? 'bg-green-100 text-green-700' :
                                profile.pipeline_stage === 'lost' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}
                        `}
                    >
                        <option value="new">Mới tiếp cận</option>
                        <option value="potential">Tiềm năng</option>
                        <option value="negotiated">Đang thương lượng</option>
                        <option value="won">Đã chốt đơn</option>
                        <option value="lost">Đã hủy/Thất bại</option>
                    </select>
                </div>
            </div>

            {/* 2. Info */}
            <div className="p-4 border-b border-gray-100 dark:border-[#1E1F22]">
                <h4 className="font-bold text-xs text-gray-400 uppercase mb-3">Thông tin khách hàng</h4>

                <div className="group flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-[#383A40] flex items-center justify-center text-gray-500">
                        <i className="fas fa-phone"></i>
                    </div>
                    <div className="flex-1">
                        <p className="text-[10px] text-gray-400">Số điện thoại</p>
                        <input
                            type="text"
                            className="w-full bg-transparent border-b border-transparent focus:border-blue-500 outline-none text-sm font-medium text-gray-800 dark:text-gray-200 placeholder-gray-400"
                            placeholder="Nhập SĐT..."
                            value={profile.phone || ''}
                            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                            onBlur={(e) => handleUpdate('phone', e.target.value)}
                        />
                    </div>
                </div>

                <div className="group flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-[#383A40] flex items-center justify-center text-gray-500">
                        <i className="fas fa-envelope"></i>
                    </div>
                    <div className="flex-1">
                        <p className="text-[10px] text-gray-400">Email</p>
                        <input
                            type="text"
                            className="w-full bg-transparent border-b border-transparent focus:border-blue-500 outline-none text-sm font-medium text-gray-800 dark:text-gray-200 placeholder-gray-400"
                            placeholder="Nhập Email..."
                            value={profile.email || ''}
                            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                            onBlur={(e) => handleUpdate('email', e.target.value)}
                        />
                    </div>
                </div>

                <div className="group flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-[#383A40] flex items-center justify-center text-gray-500">
                        <i className="fas fa-map-marker-alt"></i>
                    </div>
                    <div className="flex-1">
                        <p className="text-[10px] text-gray-400">Địa chỉ giao hàng</p>
                        <textarea
                            rows="1"
                            className="w-full bg-transparent border-b border-transparent focus:border-blue-500 outline-none text-sm font-medium text-gray-800 dark:text-gray-200 placeholder-gray-400 resize-none overflow-hidden"
                            placeholder="Nhập địa chỉ..."
                            value={profile.address || ''}
                            onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                            onBlur={(e) => handleUpdate('address', e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* 3. Notes */}
            <div className="p-4 border-b border-gray-100 dark:border-[#1E1F22]">
                <h4 className="font-bold text-xs text-gray-400 uppercase mb-2">Ghi chú nội bộ</h4>
                <textarea
                    className="w-full bg-yellow-50 dark:bg-[#383A40] dark:text-gray-200 border border-yellow-200 dark:border-gray-600 rounded p-2 text-sm focus:ring-1 focus:ring-yellow-400 outline-none min-h-[80px]"
                    placeholder="Ghi chú về khách này..."
                    value={profile.notes || ''}
                    onChange={(e) => setProfile({ ...profile, notes: e.target.value })}
                    onBlur={(e) => handleUpdate('notes', e.target.value)}
                />
            </div>

            {/* 4. Stats & Orders */}
            <div className="p-4 flex-1 bg-gray-50 dark:bg-[#1E1F22]/50">
                <div className="flex justify-between items-center mb-4">
                    <h4 className="font-bold text-sm text-gray-700 dark:text-gray-300">Lịch sử đơn hàng</h4>
                    <span className="bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full font-bold">{stats.order_count}</span>
                </div>

                <button
                    onClick={() => {
                        setMode('create_order');
                        if (products.length === 0) axios.get(`/ajax/sales/products`).then(res => setProducts(res.data));
                    }}
                    className="w-full bg-white dark:bg-[#313338] border border-blue-200 dark:border-gray-600 text-blue-600 dark:text-blue-400 py-2 rounded-lg font-bold shadow-sm hover:bg-blue-50 dark:hover:bg-[#383A40] transition mb-4 flex items-center justify-center gap-2"
                >
                    <i className="fas fa-plus"></i> Tạo đơn hàng mới
                </button>

                <div className="space-y-3">
                    {stats.orders.length === 0 && (
                        <p className="text-gray-400 text-xs text-center italic">Không tìm thấy đơn hàng nào</p>
                    )}
                    {stats.orders.map(order => (
                        <div key={order.id} className="bg-white dark:bg-[#313338] p-3 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                            <div className="flex justify-between mb-1">
                                <span className="font-bold text-blue-600">#{order.id}</span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full ${order.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                                    }`}>
                                    {order.status === 'paid' ? 'Đã thanh toán' : 'Chờ xử lý'}
                                </span>
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                {new Date(order.created_at).toLocaleDateString()} • {order.items?.length} sản phẩm
                            </div>
                            <div className="font-bold text-gray-800 dark:text-gray-200 text-right">
                                {parseInt(order.total_amount).toLocaleString()}đ
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    return (
        <div className="h-full w-full">
            {mode === 'dashboard' ? renderDashboard() : renderCreateOrder()}
        </div>
    );
}