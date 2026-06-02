<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'     => ['required', 'string', 'max:120'],
            'email'    => ['required', 'email', 'max:191', 'unique:users,email'],
            'password' => ['required', 'string', 'min:6', 'max:100'],
            'business' => ['nullable', 'string', 'max:120'],
            // BD mobile format: 01[3-9] + 8 digits.
            'phone'    => ['nullable', 'string', 'regex:/^01[3-9]\d{8}$/'],
            // Optional: if present, the response includes a paymentURL the
            // SPA can redirect to immediately after register.
            'plan_id'  => ['nullable', 'integer', 'exists:plans,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'phone.regex' => 'Phone must be a valid Bangladesh mobile (01XXXXXXXXX).',
            'email.unique' => 'An account with this email already exists.',
        ];
    }
}
