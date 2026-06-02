<?php

namespace App\Http\Requests\Products;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        $product = $this->route('product');
        return $product && $product->user_id === $this->user()?->id;
    }

    public function rules(): array
    {
        return [
            'title'             => ['sometimes', 'required', 'string', 'min:3', 'max:200'],
            'short_description' => ['sometimes', 'nullable', 'string', 'max:280'],
            'description'       => ['sometimes', 'nullable', 'string', 'max:5000'],
            'price'             => ['sometimes', 'required', 'numeric', 'min:0', 'max:99999999.99'],
            'compare_price'     => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'currency'          => ['sometimes', 'nullable', 'string', 'size:3'],
            'stock'             => ['sometimes', 'required', 'integer', 'min:0'],
            'status'            => ['sometimes', 'required', Rule::in(['active', 'draft', 'out_of_stock'])],
            'category_id'       => ['sometimes', 'nullable', 'exists:categories,id'],
            'category'          => ['sometimes', 'nullable', 'string', 'exists:categories,slug'],

            'tags'              => ['sometimes', 'nullable', 'array', 'max:20'],
            'tags.*'            => ['string', 'max:40'],

            'images'                => ['sometimes', 'nullable', 'array', 'max:10'],
            'images.*.url'          => ['required_with:images', 'string', 'max:500'],
            'images.*.alt'          => ['nullable', 'string', 'max:255'],
            'images.*.is_primary'   => ['nullable', 'boolean'],
        ];
    }
}
