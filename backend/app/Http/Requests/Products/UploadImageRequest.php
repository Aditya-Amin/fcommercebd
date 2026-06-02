<?php

namespace App\Http\Requests\Products;

use Illuminate\Foundation\Http\FormRequest;

class UploadImageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'image' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ];
    }

    public function messages(): array
    {
        return [
            'image.required' => 'ছবি যোগ করুন।',
            'image.image'    => 'ফাইলটি ছবি হতে হবে।',
            'image.mimes'    => 'শুধু JPG, PNG বা WebP আপলোড করুন।',
            'image.max'      => 'ছবির সাইজ ৫MB এর বেশি।',
        ];
    }
}
