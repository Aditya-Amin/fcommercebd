<?php

namespace App\Http\Requests\Facebook;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreatePostRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'facebook_page_id' => ['required', 'integer', 'exists:facebook_pages,id'],
            'product_id'       => ['nullable', 'integer', 'exists:products,id'],
            'type'             => ['required', Rule::in(['text', 'photo', 'link', 'multi_photo'])],
            'message'          => ['nullable', 'string', 'max:5000', 'required_if:type,text'],
            'link_url'         => ['nullable', 'url', 'max:800', 'required_if:type,link'],
            'image_url'        => ['nullable', 'url', 'max:800', 'required_if:type,photo'],
            'image_urls'       => ['nullable', 'array', 'max:10', 'required_if:type,multi_photo'],
            'image_urls.*'     => ['url', 'max:800'],
            'hashtags'         => ['nullable', 'array', 'max:10'],
            'hashtags.*'       => ['string', 'max:60'],
            'scheduled_at'     => ['nullable', 'date', 'after:now'],
        ];
    }
}
