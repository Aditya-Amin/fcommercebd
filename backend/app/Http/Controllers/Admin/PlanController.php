<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use App\Models\Subscription;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class PlanController extends Controller
{
    public function index()
    {
        $plans = Plan::withCount([
                'subscriptions as active_subscriptions_count' => fn ($q) =>
                    $q->whereIn('status', Subscription::ACTIVE_STATUSES)->where('expiry_date', '>', now()),
            ])
            ->orderBy('price')
            ->paginate(20);

        return view('admin.plans.index', compact('plans'));
    }

    public function create()
    {
        return view('admin.plans.create', ['plan' => new Plan()]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validateData($request);

        Plan::create($this->mapData($data, $request));

        return redirect()->route('admin.plans.index')
            ->with('success', "Plan \"{$data['name']}\" created.");
    }

    public function edit(Plan $plan)
    {
        return view('admin.plans.edit', compact('plan'));
    }

    public function update(Request $request, Plan $plan): RedirectResponse
    {
        $data = $this->validateData($request, $plan);

        $plan->update($this->mapData($data, $request));

        return redirect()->route('admin.plans.index')
            ->with('success', "Plan \"{$plan->name}\" updated.");
    }

    public function destroy(Plan $plan): RedirectResponse
    {
        // Guard against orphaning live subscriptions — a deleted plan would
        // leave active subscribers pointing at nothing and lock their features.
        $active = $plan->subscriptions()
            ->whereIn('status', Subscription::ACTIVE_STATUSES)
            ->where('expiry_date', '>', now())
            ->count();

        if ($active > 0) {
            return back()->with('error', "Can't delete \"{$plan->name}\" — {$active} active subscriber(s) are on it. Deactivate it instead.");
        }

        $name = $plan->name;
        $plan->delete();

        return redirect()->route('admin.plans.index')
            ->with('success', "Plan \"{$name}\" deleted.");
    }

    /**
     * Shared validation for store/update. Slug is derived from the name when
     * left blank, then checked for uniqueness so collisions surface as errors.
     */
    private function validateData(Request $request, ?Plan $plan = null): array
    {
        $request->merge([
            'slug' => $request->filled('slug')
                ? Str::slug($request->input('slug'))
                : Str::slug($request->input('name')),
        ]);

        return $request->validate([
            'name'                 => ['required', 'string', 'max:255'],
            'tagline'              => ['nullable', 'string', 'max:255'],
            'slug'                 => ['required', 'string', 'max:255', Rule::unique('plans', 'slug')->ignore($plan?->id)],
            'price'                => ['required', 'numeric', 'min:0', 'max:99999999'],
            'currency'             => ['required', 'string', 'size:3'],
            'duration'             => ['required', 'in:monthly,yearly'],
            'duration_days'        => ['required', 'integer', 'min:1', 'max:3650'],
            'limit_fb_posts'       => ['nullable', 'integer', 'min:0', 'max:100000'],
            'limit_ai_generations' => ['nullable', 'integer', 'min:0', 'max:100000'],
            'limit_sms'            => ['nullable', 'integer', 'min:0', 'max:1000000'],
            'features'             => ['nullable', 'string', 'max:5000'],
        ]);
    }

    /**
     * Shape the validated input into the columns the Plan model stores:
     * `limits` (queryable caps used by gating) and `features` (marketing bullets).
     */
    private function mapData(array $data, Request $request): array
    {
        $features = collect(preg_split('/\r\n|\r|\n/', $data['features'] ?? ''))
            ->map(fn ($line) => trim($line))
            ->filter()
            ->values()
            ->all();

        return [
            'name'          => $data['name'],
            'tagline'       => $data['tagline'] ?? null,
            'slug'          => $data['slug'],
            'price'         => $data['price'],
            'currency'      => strtoupper($data['currency']),
            'duration'      => $data['duration'],
            'duration_days' => $data['duration_days'],
            'limits'        => [
                'fbPosts'       => (int) ($data['limit_fb_posts'] ?? 0),
                'aiGenerations' => (int) ($data['limit_ai_generations'] ?? 0),
                'sms'           => (int) ($data['limit_sms'] ?? 0),
            ],
            'features'      => $features ?: null,
            'is_active'     => $request->boolean('is_active'),
            'is_popular'    => $request->boolean('is_popular'),
        ];
    }
}
