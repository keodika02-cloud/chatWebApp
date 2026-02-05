<?php

namespace App\Enums;

enum ConversationType: string
{
    case DIRECT = 'direct';
    case GROUP = 'group';
    case BOT = 'bot';
    case SUPPORT = 'support';
    
    // Hàm lấy nhãn hiển thị (Optional)
    public function label(): string
    {
        return match($this) {
            self::DIRECT => 'Chat riêng',
            self::GROUP => 'Chat nhóm',
            self::BOT => 'Trợ lý ảo',
            self::SUPPORT => 'Hỗ trợ',
        };
    }
}