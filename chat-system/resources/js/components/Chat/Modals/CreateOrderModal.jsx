import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

export default function CreateOrderModal({ customer, conversationId, onClose, onSuccess }) {
    // Giả lập danh sách sản phẩm (Sau này lấy từ API Products)
    const [products] = useState([
        { id: 1, name: 'Áo Thun Basic', price: 150000 },
        { id: 2, name: 'Quần Jean Slim', price: 350000 },
        { id: 3, name: 'Giày Sneaker', price: 800000 },
    ]);

    const [cart, setCart] = useState([]);

    // Thêm sản phẩm vào giỏ tạm
    const addToCart = (product) => {
        // Kiểm tra xem sản phẩm đã có trong giỏ chưa
        const existing = cart.find(item => item.id === product.id);
        if (existing) {
            setCart(prev => prev.map(item =>
                item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
            ));
        } else {
            setCart(prev => [...prev, { ...product, quantity: 1 }]);
        }
    };

    // Xóa sản phẩm khỏi giỏ
    const removeFromCart = (index) => {
        setCart(prev => prev.filter((_, i) => i !== index));
    };

    // Xử lý Lưu đơn
    const handleSubmit = async () => {
        if (cart.length === 0) {
            toast.warning("⚠️ Giỏ hàng đang trống!");
            return;
        }

        try {
            await axios.post('/api/orders', {
                customer_id: customer.id,
                conversation_id: conversationId, // Gửi ID hội thoại kèm theo
                items: cart.map(item => ({
                    product_name: item.name,
                    quantity: item.quantity,
                    price: item.price
                }))
            });
            toast.success("✅ Tạo đơn thành công!");
            if (onSuccess) onSuccess(); // Refresh lại list đơn hàng bên ngoài
            onClose();
        } catch (error) {
            console.error(error);
            toast.error("❌ Lỗi: " + (error.response?.data?.message || "Không thể tạo đơn hàng"));
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-[500px] p-6 shadow-xl relative">
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <h3 className="text-xl font-bold mb-6 text-gray-800">Tạo đơn hàng mới</h3>

                {/* Chọn sản phẩm */}
                <div className="mb-6">
                    <label className="block text-sm font-semibold mb-2 text-gray-700">Chọn sản phẩm:</label>
                    <select
                        className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        onChange={(e) => {
                            const prod = products.find(p => p.id == e.target.value);
                            if (prod) {
                                addToCart(prod);
                                e.target.value = ""; // Reset select
                            }
                        }}
                    >
                        <option value="">-- Chọn sản phẩm --</option>
                        {products.map(p => (
                            <option key={p.id} value={p.id}>
                                {p.name} - {p.price.toLocaleString()}đ
                            </option>
                        ))}
                    </select>
                </div>

                {/* Giỏ hàng */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg mb-6 h-[200px] overflow-y-auto p-4">
                    {cart.length > 0 ? (
                        <div className="space-y-3">
                            {cart.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center bg-white p-3 rounded shadow-sm">
                                    <div>
                                        <div className="font-medium text-gray-800">{item.name}</div>
                                        <div className="text-sm text-gray-500">
                                            {item.price.toLocaleString()}đ x {item.quantity}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="font-bold text-gray-800">
                                            {(item.price * item.quantity).toLocaleString()}đ
                                        </span>
                                        <button
                                            onClick={() => removeFromCart(idx)}
                                            className="text-red-500 hover:text-red-700 p-1"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                            <svg className="w-12 h-12 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <p>Chưa có sản phẩm nào</p>
                        </div>
                    )}
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                    <div className="text-lg">
                        <span className="text-gray-600 mr-2">Tổng cộng:</span>
                        <span className="font-bold text-blue-600 text-xl">
                            {cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toLocaleString()}đ
                        </span>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                        >
                            Hủy
                        </button>
                        <button
                            onClick={handleSubmit}
                            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={cart.length === 0}
                        >
                            Tạo đơn hàng
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
