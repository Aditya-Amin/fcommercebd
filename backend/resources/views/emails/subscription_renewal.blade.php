<!DOCTYPE html>
<html lang="bn">
<head>
    <meta charset="UTF-8">
    <title>FcommerceBD</title>
</head>
<body style="margin:0;padding:0;background:#F7F9FC;font-family:Arial,Helvetica,sans-serif;color:#0F172A;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F7F9FC;padding:24px 0;">
    <tr>
        <td align="center">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:#FFFFFF;border-radius:12px;overflow:hidden;border:1px solid #E2E8F0;">
                <tr>
                    <td style="padding:24px 24px 8px;">
                        <div style="font-size:14px;color:#475569;">FcommerceBD</div>
                        @if ($kind === 'expiring_3d')
                            <h1 style="font-size:20px;margin:8px 0 0;">আপনার {{ $plan->name ?? 'প্ল্যান' }} প্ল্যান ৩ দিনে শেষ হচ্ছে</h1>
                        @elseif ($kind === 'expiring_1d')
                            <h1 style="font-size:20px;margin:8px 0 0;">আপনার {{ $plan->name ?? 'প্ল্যান' }} প্ল্যান আগামীকাল শেষ হচ্ছে</h1>
                        @else
                            <h1 style="font-size:20px;margin:8px 0 0;">আপনার {{ $plan->name ?? 'প্ল্যান' }} প্ল্যান শেষ হয়ে গেছে</h1>
                        @endif
                    </td>
                </tr>
                <tr>
                    <td style="padding:8px 24px 0;font-size:14px;color:#475569;line-height:1.6;">
                        প্রিয় {{ $user->name }},
                        <br><br>
                        @if ($kind === 'expiring_3d')
                            আপনার <strong>{{ $plan->name ?? 'বর্তমান প্ল্যান' }}</strong> সাবস্ক্রিপশনটি
                            <strong>{{ optional($expiresAt)->format('d M Y') }}</strong> তারিখে শেষ হবে।
                            ড্যাশবোর্ডে কাজের ধারাবাহিকতা বজায় রাখতে এখনই রিনিউ করুন।
                        @elseif ($kind === 'expiring_1d')
                            আপনার <strong>{{ $plan->name ?? 'বর্তমান প্ল্যান' }}</strong> সাবস্ক্রিপশনটি
                            <strong>{{ optional($expiresAt)->format('d M Y') }}</strong>-এ শেষ হচ্ছে — মাত্র ১ দিন বাকি।
                            ব্যবসায় কোনো বিঘ্ন এড়াতে আজই রিনিউ করে নিন।
                        @else
                            আপনার <strong>{{ $plan->name ?? 'বর্তমান প্ল্যান' }}</strong> সাবস্ক্রিপশনটি
                            <strong>{{ optional($expiresAt)->format('d M Y') }}</strong>-এ শেষ হয়ে গেছে।
                            ড্যাশবোর্ডে অ্যাকসেস ফিরে পেতে নিচের বাটন থেকে রিনিউ করুন।
                        @endif
                    </td>
                </tr>
                <tr>
                    <td style="padding:24px;">
                        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                                <td style="background:#3362FF;border-radius:8px;">
                                    <a href="{{ $renewUrl }}" style="display:inline-block;padding:12px 24px;color:#FFFFFF;font-size:14px;font-weight:600;text-decoration:none;">
                                        bKash দিয়ে রিনিউ করুন
                                    </a>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
                <tr>
                    <td style="padding:0 24px 24px;font-size:13px;color:#94A3B8;line-height:1.6;">
                        কোনো প্রশ্ন থাকলে এই ইমেইলের রিপ্লাই করুন।<br>
                        — FcommerceBD টিম
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>
</body>
</html>
