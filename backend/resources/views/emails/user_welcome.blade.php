<!DOCTYPE html>
<html lang="bn">
<head>
    <meta charset="UTF-8">
    <title>FcommerceBD-এ স্বাগতম</title>
</head>
<body style="margin:0;padding:0;background:#F7F9FC;font-family:Arial,Helvetica,sans-serif;color:#0F172A;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F7F9FC;padding:24px 0;">
    <tr>
        <td align="center">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:#FFFFFF;border-radius:12px;overflow:hidden;border:1px solid #E2E8F0;">

                {{-- Header bar --}}
                <tr>
                    <td style="background:#3362FF;padding:28px 32px;">
                        <div style="font-size:20px;font-weight:700;color:#FFFFFF;letter-spacing:-0.3px;">fCommerceBD</div>
                        <div style="font-size:13px;color:rgba(255,255,255,0.75);margin-top:2px;">আপনার ব্যবসা, আমাদের সাথে</div>
                    </td>
                </tr>

                {{-- Greeting --}}
                <tr>
                    <td style="padding:32px 32px 0;">
                        <h1 style="font-size:22px;margin:0 0 8px;color:#0F172A;">স্বাগতম, {{ $user->name }}! 🎉</h1>
                        <p style="font-size:14px;color:#475569;line-height:1.7;margin:0;">
                            FcommerceBD-এ আপনার অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে।
                            আপনি এখন <strong>৩০ দিনের বিনামূল্যে ট্রায়াল</strong> পাচ্ছেন।
                        </p>
                    </td>
                </tr>

                {{-- Feature highlights --}}
                <tr>
                    <td style="padding:24px 32px 0;">
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                               style="background:#F8FAFC;border-radius:10px;border:1px solid #E2E8F0;">
                            <tr>
                                <td style="padding:20px 24px;">
                                    <p style="font-size:13px;font-weight:700;color:#0F172A;margin:0 0 14px;text-transform:uppercase;letter-spacing:0.5px;">
                                        ট্রায়ালে যা পাচ্ছেন
                                    </p>
                                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                        <tr>
                                            <td style="padding:5px 0;font-size:13px;color:#475569;">
                                                ✅ &nbsp;AI দিয়ে Facebook পোস্ট তৈরি
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="padding:5px 0;font-size:13px;color:#475569;">
                                                ✅ &nbsp;SMS মার্কেটিং
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="padding:5px 0;font-size:13px;color:#475569;">
                                                ✅ &nbsp;Courier অর্ডার ম্যানেজমেন্ট
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="padding:5px 0;font-size:13px;color:#475569;">
                                                ✅ &nbsp;পণ্য ক্যাটালগ ও ইমেজ জেনারেশন
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>

                {{-- Account details --}}
                <tr>
                    <td style="padding:20px 32px 0;">
                        <p style="font-size:13px;color:#64748B;margin:0 0 6px;">আপনার অ্যাকাউন্ট তথ্য</p>
                        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
                               style="font-size:13px;color:#475569;">
                            <tr>
                                <td style="padding:4px 0;width:100px;color:#94A3B8;">ইমেইল</td>
                                <td style="padding:4px 0;"><strong>{{ $user->email }}</strong></td>
                            </tr>
                            @if($user->business)
                            <tr>
                                <td style="padding:4px 0;color:#94A3B8;">ব্যবসা</td>
                                <td style="padding:4px 0;"><strong>{{ $user->business }}</strong></td>
                            </tr>
                            @endif
                            @if($user->phone)
                            <tr>
                                <td style="padding:4px 0;color:#94A3B8;">ফোন</td>
                                <td style="padding:4px 0;"><strong>{{ $user->phone }}</strong></td>
                            </tr>
                            @endif
                        </table>
                    </td>
                </tr>

                {{-- CTA --}}
                <tr>
                    <td style="padding:28px 32px;">
                        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                                <td style="background:#3362FF;border-radius:8px;">
                                    <a href="{{ $dashboardUrl }}"
                                       style="display:inline-block;padding:13px 28px;color:#FFFFFF;font-size:14px;font-weight:600;text-decoration:none;">
                                        ড্যাশবোর্ডে যান →
                                    </a>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>

                {{-- Footer --}}
                <tr>
                    <td style="padding:0 32px 28px;border-top:1px solid #F1F5F9;">
                        <p style="font-size:12px;color:#94A3B8;margin:20px 0 0;line-height:1.7;">
                            কোনো প্রশ্ন থাকলে এই ইমেইলের রিপ্লাই করুন।<br>
                            — FcommerceBD টিম
                        </p>
                    </td>
                </tr>

            </table>
        </td>
    </tr>
</table>
</body>
</html>
