import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

export default function CreateOrderModalV2({ customer, onClose, onSuccess }) {
    const [cart, setCart] = useState([]);
    const [shipping, setShipping] = useState(0);
    const [discount, setDiscount] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState('COD');
    const [note, setNote] = useState('');

    // STATE MỚI CHO TÌM KIẾM
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const searchTimeout = useRef(null); // Để Debounce (tránh gọi API quá nhiều)

    // Hàm tính tổng tiền
    const subTotal = cart.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
    const total = subTotal + Number(shipping) - Number(discount);

    // HÀM TÌM KIẾM SẢN PHẨM (GỌI API)
    const handleSearch = (e) => {
        const keyword = e.target.value;
        setSearchTerm(keyword);

        if (searchTimeout.current) clearTimeout(searchTimeout.current);

        if (!keyword.trim()) {
            setSearchResults([]);
            setShowDropdown(false);
            return;
        }

        // Đợi ngưng gõ 300ms mới gọi API
        searchTimeout.current = setTimeout(() => {
            axios.get(`/api/products?q=${keyword}`)
                .then(res => {
                    setSearchResults(res.data);
                    setShowDropdown(true);
                })
                .catch(err => console.error(err));
        }, 300);
    };

    // HÀM CHỌN SẢN PHẨM TỪ DROPDOWN
    const selectProduct = (product) => {
        // Kiểm tra xem sản phẩm đã có trong giỏ chưa
        const existItem = cart.find(item => item.id === product.id);

        if (existItem) {
            // Nếu có rồi thì tăng số lượng
            setCart(cart.map(item =>
                item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
            ));
        } else {
            // Chưa có thì thêm mới
            setCart([...cart, { ...product, quantity: 1 }]);
        }

        // Reset tìm kiếm
        setSearchTerm('');
        setShowDropdown(false);
    };

    // Hàm xóa item khỏi giỏ
    const removeFromCart = (productId) => {
        setCart(cart.filter(item => item.id !== productId));
    };

    // Hàm đổi số lượng
    const updateQuantity = (productId, newQty) => {
        if (newQty < 1) return;
        setCart(cart.map(item =>
            item.id === productId ? { ...item, quantity: parseInt(newQty) } : item
        ));
    };

    // Hàm Lưu đơn (Gửi ID sản phẩm thật lên Server)
    const handleSaveOrder = async () => {
        if (cart.length === 0) return toast.warning("⚠️ Vui lòng thêm ít nhất một sản phẩm!");

        try {
            const response = await axios.post('/api/orders', {
                customer_id: customer.id,
                items: cart.map(item => ({
                    product_id: item.id,      // Gửi ID thật
                    product_name: item.name,
                    quantity: item.quantity,
                    price: item.price
                })),
                shipping_fee: shipping,
                discount: discount,
                total_amount: total,
                payment_method: paymentMethod,
                internal_note: note,
                status: 'pending'
            });
            toast.success("✅ Tạo đơn thành công!");
            if (onSuccess) onSuccess(response.data);
            onClose();
        } catch (err) {
            toast.error("❌ Lỗi: " + (err.response?.data?.message || "Không thể tạo đơn"));
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            <div className="bg-white rounded-lg w-[900px] h-[85vh] flex flex-col shadow-2xl border pointer-events-auto">

                {/* HEADER */}
                <div className="p-3 bg-blue-600 text-white flex justify-between items-center rounded-t-lg">
                    <div className="flex items-center gap-2">
                        <i className="fas fa-shopping-cart"></i>
                        <h3 className="font-bold">Tạo đơn hàng mới</h3>
                    </div>
                    <button onClick={onClose}><i className="fas fa-times"></i></button>
                </div>

                <div className="flex-1 flex overflow-hidden bg-gray-50">
                    {/* CỘT TRÁI */}
                    <div className="w-2/3 p-4 overflow-y-auto bg-white border-r custom-scrollbar">

                        {/* THÔNG TIN KHÁCH */}
                        <div className="flex gap-3 mb-4 border-b pb-4">
                            <img
                                src={customer.avatar || '/default-avatar.png'}
                                className="w-10 h-10 rounded-full object-cover border"
                                onError={(e) => e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(customer.full_name || 'Customer')}
                            />
                            <div>
                                <div className="font-bold">{customer.full_name}</div>
                                <div className="text-sm text-gray-500">{customer.phone || 'Chưa có SĐT'}</div>
                            </div>
                        </div>

                        {/* KHU VỰC TÌM KIẾM SẢN PHẨM */}
                        <div className="mb-4 relative">
                            <label className="font-bold text-sm mb-1 block">Tìm sản phẩm</label>
                            <div className="relative">
                                <i className="fas fa-search absolute left-3 top-2.5 text-gray-400"></i>
                                <input
                                    className="w-full border rounded pl-9 p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Nhập tên hoặc mã SKU..."
                                    value={searchTerm}
                                    onChange={handleSearch}
                                />
                            </div>

                            {/* DROPDOWN KẾT QUẢ TÌM KIẾM */}
                            {showDropdown && searchResults.length > 0 && (
                                <div className="absolute top-full left-0 w-full bg-white border shadow-xl rounded-b mt-1 z-10 max-h-[300px] overflow-y-auto custom-scrollbar">
                                    {searchResults.map(prod => (
                                        <div
                                            key={prod.id}
                                            onClick={() => selectProduct(prod)}
                                            className="p-2 hover:bg-blue-50 cursor-pointer flex justify-between items-center border-b"
                                        >
                                            <div className="flex items-center gap-2">
                                                <img src={prod.image_url || 'https://via.placeholder.com/150'} className="w-8 h-8 object-cover rounded" />
                                                <div>
                                                    <div className="text-sm font-bold">{prod.name}</div>
                                                    <div className="text-xs text-gray-500">SKU: {prod.sku} | Kho: {prod.stock}</div>
                                                </div>
                                            </div>
                                            <div className="font-bold text-blue-600">
                                                {parseInt(prod.price).toLocaleString()}đ
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* DANH SÁCH ĐÃ CHỌN (CART) */}
                        <div className="border rounded">
                            <div className="bg-gray-100 p-2 text-xs font-bold flex text-gray-600">
                                <div className="flex-1">Sản phẩm</div>
                                <div className="w-20 text-center">SL</div>
                                <div className="w-24 text-right">Đơn giá</div>
                                <div className="w-8"></div>
                            </div>

                            {cart.length === 0 ? (
                                <div className="p-8 text-center text-gray-400 text-sm">Chưa có sản phẩm nào</div>
                            ) : (
                                cart.map((item, idx) => (
                                    <div key={idx} className="p-2 border-b flex items-center text-sm">
                                        <div className="flex-1 font-medium">{item.name}</div>
                                        <div className="w-20 text-center flex items-center justify-center gap-1">
                                            <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="px-1 bg-gray-200 hover:bg-gray-300 rounded">-</button>
                                            <input
                                                className="w-8 text-center border rounded text-xs py-1"
                                                value={item.quantity}
                                                readOnly
                                            />
                                            <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="px-1 bg-gray-200 hover:bg-gray-300 rounded">+</button>
                                        </div>
                                        <div className="w-24 text-right font-bold">
                                            {parseInt(item.price).toLocaleString()}
                                        </div>
                                        <div className="w-8 text-right">
                                            <button onClick={() => removeFromCart(item.id)} className="text-red-500 hover:text-red-700">
                                                <i className="fas fa-times"></i>
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* CỘT PHẢI: THANH TOÁN */}
                    <div className="w-1/3 p-4 bg-gray-50 flex flex-col space-y-4 overflow-y-auto custom-scrollbar">
                        <div className="bg-white p-4 rounded shadow-sm border mb-3">
                            <h4 className="font-bold text-sm mb-3 border-b pb-2">THANH TOÁN</h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span>Tổng phụ ({cart.length} món)</span>
                                    <span className="font-bold">{subTotal.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span>Phí giao hàng</span>
                                    <input
                                        type="number"
                                        className="w-20 text-right border rounded p-1"
                                        value={shipping}
                                        onChange={e => setShipping(e.target.value)}
                                    />
                                </div>
                                <div className="flex justify-between items-center text-blue-600">
                                    <span>Chiết khấu</span>
                                    <input
                                        type="number"
                                        className="w-20 text-right border rounded p-1 text-blue-600 font-bold"
                                        value={discount}
                                        onChange={e => setDiscount(e.target.value)}
                                    />
                                </div>
                                <div className="border-t pt-2 mt-2 flex justify-between text-lg font-bold text-blue-700">
                                    <span>CẦN THANH TOÁN</span>
                                    <span>{total.toLocaleString()}đ</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-4 rounded shadow-sm border space-y-3">
                            <label className="font-bold text-gray-700 text-xs uppercase tracking-wider block border-b pb-2">Hình thức & Ghi chú</label>

                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => setPaymentMethod('COD')}
                                    className={`py-2 rounded text-xs font-bold border ${paymentMethod === 'COD' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 bg-gray-50'}`}
                                >
                                    COD
                                </button>
                                <button
                                    onClick={() => setPaymentMethod('Banking')}
                                    className={`py-2 rounded text-xs font-bold border ${paymentMethod === 'Banking' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 bg-gray-50'}`}
                                >
                                    Chuyển khoản
                                </button>
                            </div>

                            <textarea
                                className="w-full border rounded p-2 text-xs focus:border-blue-500 outline-none min-h-[80px] bg-gray-50"
                                placeholder="Ghi chú đơn hàng..."
                                value={note}
                                onChange={e => setNote(e.target.value)}
                            ></textarea>
                        </div>

                        <div className="mt-auto flex justify-end gap-2 pt-4">
                            <button onClick={onClose} className="px-4 py-2 bg-white border rounded text-sm font-bold text-gray-600">Hủy bỏ</button>
                            <button
                                onClick={handleSaveOrder}
                                className="px-4 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 text-sm shadow"
                            >
                                <i className="fas fa-check mr-2"></i> Tạo đơn hàng
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

