<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Products\StoreProductRequest;
use App\Http\Requests\Products\UpdateProductRequest;
use App\Http\Requests\Products\UploadImageRequest;
use App\Http\Resources\ProductResource;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\URL;

class ProductController extends Controller
{
    /**
     * GET /api/products — list current user's products with optional filters.
     *
     * Query params:
     *   search     string  matches title or description (LIKE)
     *   category   string  category slug
     *   status     string  active|draft|out_of_stock
     *   page       int     pagination page (default 1)
     *   per_page   int     items per page (default 24, max 100)
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = (int) min(max((int) $request->query('per_page', 24), 1), 100);

        $query = Product::query()
            ->with(['images', 'category'])
            ->where('user_id', $request->user()->id);

        if ($search = $request->query('search')) {
            $query->search($search);
        }
        if ($categorySlug = $request->query('category')) {
            $query->whereHas('category', fn ($q) => $q->where('slug', $categorySlug));
        }
        if ($status = $request->query('status')) {
            $query->status($status);
        }

        $paginator = $query->orderByDesc('created_at')->paginate($perPage);

        return response()->json([
            'data'    => ProductResource::collection($paginator->items()),
            'total'   => $paginator->total(),
            'page'    => $paginator->currentPage(),
            'perPage' => $paginator->perPage(),
        ]);
    }

    /**
     * GET /api/products/{product} — single product (must belong to user).
     */
    public function show(Request $request, Product $product): JsonResponse
    {
        $this->ensureOwner($request, $product);
        $product->load(['images', 'category']);

        return response()->json(['data' => new ProductResource($product)]);
    }

    /**
     * POST /api/products — create product with images.
     */
    public function store(StoreProductRequest $request): JsonResponse
    {
        $data = $request->validated();
        $categoryId = $this->resolveCategoryId($data, $request->user()->id);

        $product = DB::transaction(function () use ($request, $data, $categoryId) {
            $product = Product::create([
                'user_id'           => $request->user()->id,
                'category_id'       => $categoryId,
                'title'             => $data['title'],
                'short_description' => $data['short_description'] ?? null,
                'description'       => $data['description'] ?? null,
                'price'             => $data['price'],
                'compare_price'     => $data['compare_price'] ?? null,
                'currency'          => $data['currency'] ?? 'BDT',
                'stock'             => $data['stock'],
                'status'            => $data['status'],
                'tags'              => $data['tags'] ?? [],
            ]);

            $this->syncImages($product, $data['images'] ?? []);

            return $product->load(['images', 'category']);
        });

        return response()->json(['data' => new ProductResource($product)], 201);
    }

    /**
     * PUT /api/products/{product} — update product.
     */
    public function update(UpdateProductRequest $request, Product $product): JsonResponse
    {
        $data = $request->validated();
        $categoryId = array_key_exists('category', $data) || array_key_exists('category_id', $data)
            ? $this->resolveCategoryId($data, $request->user()->id)
            : $product->category_id;

        $product = DB::transaction(function () use ($product, $data, $categoryId) {
            $product->fill([
                'category_id'       => $categoryId,
                'title'             => $data['title']             ?? $product->title,
                'short_description' => array_key_exists('short_description', $data) ? $data['short_description'] : $product->short_description,
                'description'       => array_key_exists('description', $data) ? $data['description'] : $product->description,
                'price'             => $data['price']             ?? $product->price,
                'compare_price'     => array_key_exists('compare_price', $data) ? $data['compare_price'] : $product->compare_price,
                'currency'          => $data['currency']          ?? $product->currency,
                'stock'             => $data['stock']             ?? $product->stock,
                'status'            => $data['status']            ?? $product->status,
                'tags'              => $data['tags']              ?? $product->tags,
            ])->save();

            if (array_key_exists('images', $data)) {
                $this->syncImages($product, $data['images'] ?? []);
            }

            return $product->load(['images', 'category']);
        });

        return response()->json(['data' => new ProductResource($product)]);
    }

    /**
     * DELETE /api/products/{product} — soft delete.
     */
    public function destroy(Request $request, Product $product): JsonResponse
    {
        $this->ensureOwner($request, $product);
        $product->delete();

        return response()->json(['data' => ['deleted' => true]]);
    }

    /**
     * POST /api/products/upload-image — upload a single image, returns hosted URL.
     *
     * Files are stored directly inside public/uploads/products/ so they are
     * immediately accessible without requiring `php artisan storage:link`.
     */
    public function uploadImage(UploadImageRequest $request): JsonResponse
    {
        $file = $request->file('image');

        $dir = public_path('uploads/products');
        if (! is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        $filename = $file->hashName();
        $file->move($dir, $filename);

        return response()->json([
            'data' => [
                'id'  => 'img_' . $filename,
                'url' => URL::to('uploads/products/' . $filename),
            ],
        ], 201);
    }

    private function ensureOwner(Request $request, Product $product): void
    {
        abort_if($product->user_id !== $request->user()->id, 403, 'Forbidden');
    }

    private function resolveCategoryId(array $data, int $userId): ?int
    {
        if (! empty($data['category_id'])) {
            return (int) $data['category_id'];
        }
        if (! empty($data['category'])) {
            // Prefer the user's own category over a system category with the same slug.
            return Category::where('slug', $data['category'])
                ->where(function ($q) use ($userId) {
                    $q->where('user_id', $userId)->orWhereNull('user_id');
                })
                ->orderByRaw('CASE WHEN user_id = ? THEN 0 ELSE 1 END', [$userId])
                ->value('id');
        }
        return null;
    }

    private function syncImages(Product $product, array $images): void
    {
        $product->images()->delete();
        if (empty($images)) {
            return;
        }
        $hasPrimary = collect($images)->contains(fn ($img) => ! empty($img['is_primary']));
        foreach ($images as $i => $img) {
            $product->images()->create([
                'url'        => $img['url'],
                'alt'        => $img['alt'] ?? null,
                'is_primary' => ! empty($img['is_primary']) || (! $hasPrimary && $i === 0),
                'sort_order' => $i,
            ]);
        }
    }
}
