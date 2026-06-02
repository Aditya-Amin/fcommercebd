<?php

namespace App\Http\Requests\Facebook;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class GenerateCaptionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'product_id'       => ['required', 'integer', 'exists:products,id'],
            'tone'             => ['nullable', Rule::in(['friendly', 'professional', 'promo', 'festive'])],
            'language'         => ['nullable', Rule::in(['en', 'bn', 'mixed'])],
            'include_hashtags' => ['nullable', 'boolean'],
        ];
    }
}
