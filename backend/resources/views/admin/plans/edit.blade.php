@extends('admin.layout')

@section('title', 'Edit Plan')
@section('page-title', 'Edit Plan')

@section('content')
<div class="max-w-3xl">
    <a href="{{ route('admin.plans.index') }}" class="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-4 transition">
        <i class="fa-solid fa-arrow-left text-xs"></i> Back to plans
    </a>

    <form method="POST" action="{{ route('admin.plans.update', $plan) }}" class="space-y-5">
        @csrf
        @method('PUT')
        @include('admin.plans._form', ['submitLabel' => 'Save changes'])
    </form>
</div>
@endsection
