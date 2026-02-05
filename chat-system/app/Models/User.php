<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\SoftDeletes;

// 1. Thêm các thư viện mở rộng
use Laravel\Sanctum\HasApiTokens; // Để tạo Token đăng nhập App/Mobile
use Spatie\Permission\Traits\HasRoles; // Để phân quyền 4 lớp (Admin/Manager...)

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes, HasRoles;

    /**
     * Các trường cho phép nhập dữ liệu vào (Mass Assignment)
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'avatar_url',
        'department_id',
        'parent_id',    // ID của người quản lý trực tiếp
        'is_active',    // Trạng thái khóa/mở
        'last_seen_at', // Thời điểm online cuối
    ];

    /**
     * Các trường cần giấu đi khi trả về JSON
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Định dạng dữ liệu
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
            'last_seen_at' => 'datetime',
        ];
    }

    // =========================================================================
    // RELATIONSHIPS (LIÊN KẾT BẢNG)
    // =========================================================================

    // 1. User thuộc về 1 Phòng ban
    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    // 2. User tham gia nhiều Cuộc hội thoại
    public function conversations()
    {
        return $this->belongsToMany(Conversation::class)
                    ->withPivot(['is_admin', 'last_read_at'])
                    ->withTimestamps();
    }

    // 3. User có nhiều thiết bị (để bắn thông báo đẩy)
    public function devices()
    {
        return $this->hasMany(UserDevice::class);
    }

    // 4. User có người quản lý (Self-referencing)
    public function manager()
    {
        return $this->belongsTo(User::class, 'parent_id');
    }

    // 5. User quản lý nhiều nhân viên cấp dưới
    public function subordinates()
    {
        return $this->hasMany(User::class, 'parent_id');
    }
}