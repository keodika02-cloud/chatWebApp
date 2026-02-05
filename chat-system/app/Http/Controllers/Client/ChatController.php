<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class ChatController extends Controller
{
    public function index()
    {
        // Trả về view chat (ta sẽ tạo ở bước 3)
        return view('client.chat.index');
    }
}