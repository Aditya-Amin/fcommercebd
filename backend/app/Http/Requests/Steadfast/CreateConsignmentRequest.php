<?php

namespace App\Http\Requests\Steadfast;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Mirrors Steadfast's /create_order field constraints from the public docs.
 * Phone numbers are validated as 11-digit BD format because that's all
 * Steadfast accepts; we don't try to be more permissive than the upstream.
 */
class CreateConsignmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'invoice'           => ['required', 'string', 'max:60', 'regex:/^[A-Za-z0-9_\-]+$/'],
            'recipient_name'    => ['required', 'string', 'max:100'],
            'recipient_phone'   => ['required', 'string', 'regex:/^01[3-9]\d{8}$/'],
            'alternative_phone' => ['nullable', 'string', 'regex:/^01[3-9]\d{8}$/'],
            'recipient_email'   => ['nullable', 'email', 'max:120'],
            'recipient_address' => ['required', 'string', 'max:250'],
            'cod_amount'        => ['required', 'numeric', 'min:0'],
            'note'              => ['nullable', 'string', 'max:500'],
            'item_description'  => ['nullable', 'string', 'max:500'],
            'total_lot'         => ['nullable', 'integer', 'min:1', 'max:1000'],
            'delivery_type'     => ['nullable', Rule::in([0, 1])],
        ];
    }

    public function messages(): array
    {
        return [
            'recipient_phone.regex'   => 'Phone must be a Bangladesh mobile (01XXXXXXXXX, 11 digits).',
            'alternative_phone.regex' => 'Alternative phone must be a Bangladesh mobile (01XXXXXXXXX, 11 digits).',
            'invoice.regex'           => 'Invoice may contain letters, digits, hyphens, and underscores only.',
        ];
    }
}
