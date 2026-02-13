<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Product;

class ProductController extends Controller
{
    // GET /api/products?q=keyword
    public function index(Request $request)
    {
        $query = Product::query();

        if ($search = $request->input('q')) {
            $query->where('name', 'like', "%{$search}%")
                  ->orWhere('sku', 'like', "%{$search}%");
        }

        // Lấy 10 kết quả đầu tiên thôi cho nhẹ
        return response()->json($query->take(10)->get());
    }
}
