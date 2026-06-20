@extends('admin.layout')

@section('title', 'New Plan')
@section('page-title', 'New Plan')

@section('content')
<div class="max-w-3xl">
    <a href="{{ route('admin.plans.index') }}" class="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-4 transition">
        <i class="fa-solid fa-arrow-left text-xs"></i> Back to plans
    </a>

    <form method="POST" action="{{ route('admin.plans.store') }}" class="space-y-5">
        @csrf
        @include('admin.plans._form', ['submitLabel' => 'Create plan'])
    </form>
</div>
@endsection
