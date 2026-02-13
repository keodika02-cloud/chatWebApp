import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function EmployeeHub({ activeChat }) {
    const [activeTab, setActiveTab] = useState('all'); // all, online
    const [searchQuery, setSearchQuery] = useState('');
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setLoading(true);
        // We will reuse the getInternalUsers endpoint or similar logic
        axios.get('/ajax/users/internal')
            .then(res => setEmployees(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    const filteredEmployees = employees.filter(emp => {
        const matchName = emp.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchTab = activeTab === 'all' || (activeTab === 'online' && emp.is_online);
        return matchName && matchTab;
    });

    return (
        <div className="flex-1 flex flex-col h-full bg-white dark:bg-[#313338] transition-colors">
            {/* Header */}
            <div className="h-12 border-b border-gray-200 dark:border-[#26272D] flex items-center px-4 bg-white dark:bg-[#313338] shadow-sm flex-shrink-0">
                <div className="flex items-center gap-2 mr-4 text-gray-700 dark:text-gray-200 font-bold">
                    <i className="fas fa-user-friends"></i>
                    <span>Bạn bè</span>
                </div>
                <div className="h-6 w-[1px] bg-gray-300 dark:bg-gray-600 mx-2"></div>

                {/* Tabs */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab('online')}
                        className={`px-3 py-1 rounded text-sm font-medium transition ${activeTab === 'online' ? 'bg-gray-200 dark:bg-[#404249] text-gray-900 dark:text-gray-100' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-[#35373C]'}`}
                    >
                        Trực tuyến
                    </button>
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`px-3 py-1 rounded text-sm font-medium transition ${activeTab === 'all' ? 'bg-gray-200 dark:bg-[#404249] text-gray-900 dark:text-gray-100' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-[#35373C]'}`}
                    >
                        Tất cả
                    </button>
                    <button className="px-3 py-1 rounded text-sm font-medium text-gray-500 hover:bg-gray-100 dark:hover:bg-[#35373C] cursor-not-allowed opacity-50">
                        Đang chờ
                    </button>
                    <button className="px-3 py-1 rounded text-sm font-medium text-gray-500 hover:bg-gray-100 dark:hover:bg-[#35373C] cursor-not-allowed opacity-50">
                        Đã chặn
                    </button>
                    <button className="px-3 py-1 rounded text-sm font-bold text-green-600 bg-green-50 hover:bg-green-100 dark:bg-transparent dark:text-green-500 border border-green-200 dark:border-green-900 ml-2">
                        Thêm bạn
                    </button>
                </div>
            </div>

            {/* Body */}
            <div className="flex-1 flex overflow-hidden">
                <div className="flex-1 flex flex-col p-4 overflow-y-auto custom-scrollbar">
                    {/* Search Bar inside Hub */}
                    <div className="mb-4 relative">
                        <input
                            type="text"
                            placeholder="Tìm kiếm..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[#F2F3F5] dark:bg-[#1E1F22] text-gray-900 dark:text-gray-100 rounded px-3 py-2 outline-none border border-transparent focus:border-blue-500 transition"
                        />
                        <i className="fas fa-search absolute right-3 top-3 text-gray-400"></i>
                    </div>

                    <h3 className="uppercase text-xs font-bold text-gray-500 mb-2">
                        {activeTab === 'online' ? `Trực tuyến — ${filteredEmployees.length}` : `Tất cả — ${filteredEmployees.length}`}
                    </h3>

                    <div className="space-y-1">
                        {filteredEmployees.map(emp => (
                            <div key={emp.id} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#35373C] group cursor-pointer border-t border-gray-100 dark:border-[#2B2D31]">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <img src={emp.avatar} className="w-9 h-9 rounded-full object-cover bg-gray-300" />
                                        {/* Status Dot */}
                                        <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-[#35373C] ${emp.is_online ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-1">
                                            <span className="font-bold text-gray-900 dark:text-gray-100 text-sm">{emp.name}</span>
                                            {emp.activity_type && <i className="fas fa-gamepad text-xs text-blue-500 ml-1" title={emp.activity_type}></i>}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                            {emp.custom_status || (emp.is_online ? 'Trực tuyến' : 'Ngoại tuyến')}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                                    <button className="w-8 h-8 rounded-full bg-gray-200 dark:bg-[#2B2D31] flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white" title="Nhắn tin">
                                        <i className="fas fa-comment-dots"></i>
                                    </button>
                                    <button className="w-8 h-8 rounded-full bg-gray-200 dark:bg-[#2B2D31] flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white" title="Thêm tùy chọn">
                                        <i className="fas fa-ellipsis-v"></i>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {filteredEmployees.length === 0 && (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 mt-10">
                            <i className="fas fa-box-open text-4xl mb-2 opacity-50"></i>
                            <p>Không có ai ở đây cả. Wumpus đang buồn.</p>
                        </div>
                    )}
                </div>

                {/* Right Sidebar for Hub (Active Now) - Discord has this */}
                <div className="w-[30%] hidden xl:flex flex-col border-l border-gray-200 dark:border-[#2B2D31] p-4 bg-white dark:bg-[#313338]">
                    <h3 className="font-bold text-xl text-gray-900 dark:text-gray-100 mb-4">Đang Hoạt Động</h3>
                    <div className="text-center text-gray-500 dark:text-gray-400 mt-10">
                        <p className="font-bold">Hiện chưa có ai hoạt động</p>
                        <p className="text-sm">Khi bạn bè bắt đầu hoạt động, họ sẽ xuất hiện ở đây!</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
