<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Categories\StoreCategoryRequest;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CategoryController extends Controller
{
    /**
     * GET /api/categories
     *
     * Public endpoint — no auth required, but if a valid bearer token is present
     * we resolve the user and return system categories + their own custom categories.
     * Unauthenticated requests receive system categories only (user_id IS NULL).
     */
    public function index(): JsonResponse
    {
        // auth('sanctum')->user() returns null without throwing on public routes.
        $user = auth('sanctum')->user();

        $query = Category::active();

        if ($user) {
            $query->visibleTo($user->id);
        } else {
            $query->whereNull('user_id');
        }

        return response()->json([
            'data' => $query
                ->orderByRaw('user_id IS NULL DESC') // system categories first
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get(['id', 'slug', 'name', 'name_bn']),
        ]);
    }

    /**
     * POST /api/categories — create a user-owned category.
     *
     * Slug is derived from `name`. Returns 409 if:
     *   - a system category with the same slug exists (user cannot shadow system cats)
     *   - the user already has a category with the same slug
     */
    public function store(StoreCategoryRequest $request): JsonResponse
    {
        $data   = $request->validated();
        $slug   = Str::slug($data['name']);
        $userId = $request->user()->id;

        $conflict = Category::where('slug', $slug)
            ->where(function ($q) use ($userId) {
                $q->whereNull('user_id')  // conflicts with a system category
                  ->orWhere('user_id', $userId); // conflicts with user's own
            })
            ->exists();

        if ($conflict) {
            return response()->json([
                'message' => 'A category with this name already exists.',
            ], 409);
        }

        $category = Category::create([
            'user_id'    => $userId,
            'slug'       => $slug,
            'name'       => $data['name'],
            'name_bn'    => $data['name_bn'] ?? null,
            'sort_order' => (int) Category::where('user_id', $userId)->max('sort_order') + 1,
            'is_active'  => true,
        ]);

        return response()->json([
            'data' => $category->only(['id', 'slug', 'name', 'name_bn']),
        ], 201);
    }
}
