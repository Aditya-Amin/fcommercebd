<?php

namespace App\Http\Requests\Steadfast;

use Illuminate\Foundation\Http\FormRequest;

class SaveCredentialsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'api_key'    => ['required', 'string', 'min:8', 'max:255'],
            'secret_key' => ['required', 'string', 'min:8', 'max:255'],
        ];
    }
}
