<?php

namespace App\Http\Requests\Products;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'title'             => ['required', 'string', 'min:3', 'max:200'],
            'short_description' => ['nullable', 'string', 'max:280'],
            'description'       => ['nullable', 'string', 'max:5000'],
            'price'             => ['required', 'numeric', 'min:0', 'max:99999999.99'],
            'compare_price'     => ['nullable', 'numeric', 'min:0', 'gte:price'],
            'currency'          => ['nullable', 'string', 'size:3'],
            'stock'             => ['required', 'integer', 'min:0'],
            'status'            => ['required', Rule::in(['active', 'draft', 'out_of_stock'])],
            'category_id'       => ['nullable', 'exists:categories,id'],
            'category'          => ['nullable', 'string', 'exists:categories,slug'],

            'tags'              => ['nullable', 'array', 'max:20'],
            'tags.*'            => ['string', 'max:40'],

            'images'                => ['nullable', 'array', 'max:10'],
            'images.*.url'          => ['required_with:images', 'string', 'max:500'],
            'images.*.alt'          => ['nullable', 'string', 'max:255'],
            'images.*.is_primary'   => ['nullable', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'title.required'  => 'প্রোডাক্টের নাম দিতে হবে।',
            'title.min'       => 'নাম কমপক্ষে ৩ অক্ষর হতে হবে।',
            'price.required'  => 'প্রাইস দিতে হবে।',
            'price.numeric'   => 'সঠিক প্রাইস দিন।',
            'stock.integer'   => 'স্টক সঠিক সংখ্যা হতে হবে।',
        ];
    }
}
