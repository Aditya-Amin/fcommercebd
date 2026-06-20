<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Services\Ai\AiPostGenerator;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\View\View;

class SettingsController extends Controller
{
    // ── Image Generation ─────────────────────────────────────────────────────

    public function imageGeneration(): View
    {
        $settings = Setting::getGroup('image');
        return view('admin.settings.image-generation', compact('settings'));
    }

    public function saveImageGeneration(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'provider'   => ['required', 'in:stub,openai,replicate'],
            'api_key'    => ['nullable', 'string', 'max:500'],
            // gpt-image-1 sizes: square / portrait / landscape.
            'image_size' => ['required', 'in:1024x1024,1024x1536,1536x1024'],
        ]);

        Setting::set('image.provider',   $data['provider']);
        Setting::set('image.image_size', $data['image_size']);

        // Only overwrite the key when a new non-empty value is submitted
        if (!empty($data['api_key'])) {
            Setting::set('image.api_key', $data['api_key']);
        }

        return back()->with('success', 'Image generation settings saved.');
    }

    // ── Facebook Post ─────────────────────────────────────────────────────────

    public function facebookPost(): View
    {
        $settings        = Setting::getGroup('facebook_post');
        $defaultPrompt   = AiPostGenerator::DEFAULT_PROMPT_TEMPLATE;
        return view('admin.settings.facebook-post', compact('settings', 'defaultPrompt'));
    }

    public function saveFacebookPost(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'provider'           => ['required', 'in:stub,deepseek,anthropic,openai'],
            'api_key'            => ['nullable', 'string', 'max:500'],
            'ai_model'           => ['required', 'string', 'max:100'],
            'ai_prompt_template' => ['nullable', 'string', 'max:5000'],
        ]);

        Setting::set('facebook_post.provider', $data['provider']);

        // Only overwrite the key when a new non-empty value is submitted
        if (!empty($data['api_key'])) {
            Setting::set('facebook_post.api_key', $data['api_key']);
        }

        Setting::set('facebook_post.ai_model', $data['ai_model']);

        // Save custom prompt — blank means "use the built-in default"
        Setting::set('facebook_post.ai_prompt_template', trim($data['ai_prompt_template'] ?? ''));

        return back()->with('success', 'Facebook post settings saved.');
    }

    // ── SMS API ───────────────────────────────────────────────────────────────

    public function smsApi(): View
    {
        $settings = Setting::getGroup('sms');
        return view('admin.settings.sms-api', compact('settings'));
    }

    public function saveSmsApi(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'provider'      => ['required', 'in:greenweb,ssl,twilio'],
            'ai_model'      => ['required', 'in:claude-haiku-4-5,claude-sonnet-4-6'],
            'api_key'       => ['nullable', 'string', 'max:500'],
            'sender_id'     => ['nullable', 'string', 'max:20'],
            'cost_per_seg'  => ['required', 'numeric', 'min:0'],
            'chars_per_seg' => ['required', 'integer', 'min:1'],
        ]);

        Setting::set('sms.provider',      $data['provider']);
        Setting::set('sms.ai_model',      $data['ai_model']);
        Setting::set('sms.api_key',       $data['api_key'] ?? '');
        Setting::set('sms.sender_id',     $data['sender_id'] ?? '');
        Setting::set('sms.cost_per_seg',  $data['cost_per_seg']);
        Setting::set('sms.chars_per_seg', $data['chars_per_seg']);

        return back()->with('success', 'SMS API settings saved.');
    }
}
