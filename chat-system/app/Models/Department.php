<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Department extends Model
{
    use HasFactory;

    // Cho phép nhập liệu các cột này (Mass Assignment)
    protected $fillable = [
        'name',
        'code',
        'manager_id',
    ];

    // Quan hệ: Một phòng ban có nhiều nhân viên
    public function users()
    {
        return $this->hasMany(User::class);
    }
}