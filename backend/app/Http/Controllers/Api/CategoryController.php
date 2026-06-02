<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Categories\StoreCategoryRequest;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class CategoryController extends Controller
{
    /**
     * GET /api/categories — public list of active categories.
     */
    public function index(): JsonResponse
    {
        return response()->json([
            'data' => Category::active()
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get(['id', 'slug', 'name', 'name_bn']),
        ]);
    }

    /**
     * POST /api/categories — create a new category.
     *
     * Slug is derived from `name`. If a duplicate slug exists, returns 409.
     */
    public function store(StoreCategoryRequest $request): JsonResponse
    {
        $data = $request->validated();
        $slug = Str::slug($data['name']);

        if (Category::where('slug', $slug)->exists()) {
            return response()->json([
                'message' => 'A category with this name already exists.',
            ], 409);
        }

        $category = Category::create([
            'slug'       => $slug,
            'name'       => $data['name'],
            'name_bn'    => $data['name_bn'] ?? null,
            'sort_order' => (int) Category::max('sort_order') + 1,
            'is_active'  => true,
        ]);

        return response()->json([
            'data' => $category->only(['id', 'slug', 'name', 'name_bn']),
        ], 201);
    }
}
