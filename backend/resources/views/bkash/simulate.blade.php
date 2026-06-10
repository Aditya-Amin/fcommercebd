<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>bKash Sandbox — পেমেন্ট সিমুলেশন</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #f0f4f8;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }

    .card {
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0,0,0,.12);
      max-width: 400px;
      width: 100%;
      overflow: hidden;
    }

    .header {
      background: #e2136e;
      padding: 20px 24px 16px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .header-logo {
      background: #fff;
      color: #e2136e;
      font-weight: 900;
      font-size: 13px;
      letter-spacing: .5px;
      padding: 4px 8px;
      border-radius: 6px;
    }
    .header-title {
      color: #fff;
      font-size: 15px;
      font-weight: 600;
    }
    .sandbox-badge {
      margin-left: auto;
      background: rgba(255,255,255,.2);
      color: #fff;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 1px;
      padding: 3px 7px;
      border-radius: 999px;
      text-transform: uppercase;
    }

    .body { padding: 24px; }

    .amount-box {
      background: #fef2f8;
      border: 1px solid #fbd7ea;
      border-radius: 12px;
      padding: 16px;
      text-align: center;
      margin-bottom: 20px;
    }
    .amount-label { font-size: 12px; color: #9ca3af; margin-bottom: 4px; }
    .amount-value { font-size: 32px; font-weight: 800; color: #e2136e; }
    .amount-currency { font-size: 18px; font-weight: 600; }

    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 13px;
      color: #6b7280;
      padding: 6px 0;
      border-bottom: 1px solid #f3f4f6;
    }
    .detail-row:last-child { border-bottom: none; }
    .detail-value { color: #111827; font-weight: 500; font-size: 12px; }

    .divider {
      border: none;
      border-top: 1px dashed #e5e7eb;
      margin: 20px 0;
    }

    .info-note {
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: 8px;
      padding: 10px 12px;
      font-size: 12px;
      color: #92400e;
      margin-bottom: 20px;
      line-height: 1.5;
    }
    .info-note strong { display: block; margin-bottom: 2px; }

    .btn {
      display: block;
      width: 100%;
      border: none;
      cursor: pointer;
      font-size: 15px;
      font-weight: 600;
      padding: 14px;
      border-radius: 10px;
      transition: opacity .15s;
      margin-bottom: 10px;
      text-align: center;
      text-decoration: none;
    }
    .btn:last-child { margin-bottom: 0; }
    .btn:hover { opacity: .88; }
    .btn:active { opacity: .75; transform: scale(.99); }
    .btn-success { background: #e2136e; color: #fff; }
    .btn-failure { background: #fff; color: #374151; border: 1.5px solid #d1d5db; }
    .btn-failure:hover { background: #f9fafb; }

    .footer {
      padding: 12px 24px;
      background: #f9fafb;
      border-top: 1px solid #f3f4f6;
      text-align: center;
      font-size: 11px;
      color: #9ca3af;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <span class="header-logo">bKash</span>
      <span class="header-title">পেমেন্ট পেজ</span>
      <span class="sandbox-badge">Sandbox</span>
    </div>

    <div class="body">
      <div class="amount-box">
        <div class="amount-label">মোট পরিমাণ</div>
        <div class="amount-value">
          <span class="amount-currency">৳</span>{{ number_format($amount, 0) }}
        </div>
      </div>

      <div class="detail-row">
        <span>প্ল্যান</span>
        <span class="detail-value">{{ $planName }}</span>
      </div>
      <div class="detail-row">
        <span>মার্চেন্ট</span>
        <span class="detail-value">FcommerceBD</span>
      </div>
      <div class="detail-row">
        <span>পেমেন্ট আইডি</span>
        <span class="detail-value" style="font-family:monospace;font-size:11px">{{ Str::limit($paymentID, 24) }}</span>
      </div>

      <hr class="divider" />

      <div class="info-note">
        <strong>⚠️ Sandbox Mode (ডেভেলপমেন্ট)</strong>
        এটি একটি সিমুলেটেড bKash পেমেন্ট পেজ। নিচের বোতাম ব্যবহার করে সফল বা ব্যর্থ পেমেন্ট পরীক্ষা করুন।
      </div>

      {{-- Simple GET links — no CSRF needed for this dev-only page --}}
      <a href="/bkash/simulate/success?paymentID={{ urlencode($paymentID) }}"
         class="btn btn-success"
         onclick="this.textContent='অপেক্ষা করুন…'; this.style.opacity='.7'; this.style.pointerEvents='none';">
        ✅ পেমেন্ট সফল সিমুলেট করুন
      </a>

      <a href="/bkash/simulate/failure?paymentID={{ urlencode($paymentID) }}"
         class="btn btn-failure"
         onclick="this.textContent='অপেক্ষা করুন…'; this.style.opacity='.7'; this.style.pointerEvents='none';">
        ❌ পেমেন্ট ব্যর্থ সিমুলেট করুন
      </a>
    </div>

    <div class="footer">bKash Tokenized Checkout — Sandbox &nbsp;|&nbsp; FcommerceBD</div>
  </div>
</body>
</html>
