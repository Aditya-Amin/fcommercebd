<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>New User Registration Alert</title>
</head>
<body style="margin:0;padding:0;background:#F7F9FC;font-family:Arial,Helvetica,sans-serif;color:#0F172A;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F7F9FC;padding:24px 0;">
    <tr>
        <td align="center">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:#FFFFFF;border-radius:12px;overflow:hidden;border:1px solid #E2E8F0;">

                {{-- Header bar --}}
                <tr>
                    <td style="background:#1E293B;padding:24px 32px;">
                        <div style="font-size:18px;font-weight:700;color:#FFFFFF;">fCommerceBD <span style="color:#6366F1;">Admin</span></div>
                        <div style="font-size:12px;color:rgba(255,255,255,0.5);margin-top:2px;">Admin Notification</div>
                    </td>
                </tr>

                {{-- Alert badge --}}
                <tr>
                    <td style="padding:28px 32px 0;">
                        <div style="display:inline-block;background:#EDE9FE;color:#6D28D9;font-size:11px;font-weight:700;
                                    padding:4px 12px;border-radius:99px;letter-spacing:0.5px;text-transform:uppercase;">
                            🆕 New Registration
                        </div>
                        <h1 style="font-size:20px;margin:12px 0 6px;color:#0F172A;">New User Signed Up</h1>
                        <p style="font-size:14px;color:#475569;margin:0;line-height:1.7;">
                            A new account was just created on FcommerceBD. They've been automatically
                            started on the free 30-day trial.
                        </p>
                    </td>
                </tr>

                {{-- User details card --}}
                <tr>
                    <td style="padding:20px 32px 0;">
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                               style="background:#F8FAFC;border-radius:10px;border:1px solid #E2E8F0;">
                            <tr>
                                <td style="padding:20px 24px;">
                                    <p style="font-size:12px;font-weight:700;color:#0F172A;margin:0 0 14px;
                                              text-transform:uppercase;letter-spacing:0.5px;">User Details</p>
                                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                                           style="font-size:13px;color:#475569;">
                                        <tr>
                                            <td style="padding:5px 0;width:90px;color:#94A3B8;vertical-align:top;">Name</td>
                                            <td style="padding:5px 0;"><strong style="color:#0F172A;">{{ $user->name }}</strong></td>
                                        </tr>
                                        <tr>
                                            <td style="padding:5px 0;color:#94A3B8;vertical-align:top;">Email</td>
                                            <td style="padding:5px 0;">
                                                <a href="mailto:{{ $user->email }}"
                                                   style="color:#3362FF;text-decoration:none;">{{ $user->email }}</a>
                                            </td>
                                        </tr>
                                        @if($user->phone)
                                        <tr>
                                            <td style="padding:5px 0;color:#94A3B8;vertical-align:top;">Phone</td>
                                            <td style="padding:5px 0;">{{ $user->phone }}</td>
                                        </tr>
                                        @endif
                                        @if($user->business)
                                        <tr>
                                            <td style="padding:5px 0;color:#94A3B8;vertical-align:top;">Business</td>
                                            <td style="padding:5px 0;">{{ $user->business }}</td>
                                        </tr>
                                        @endif
                                        <tr>
                                            <td style="padding:5px 0;color:#94A3B8;vertical-align:top;">Registered</td>
                                            <td style="padding:5px 0;">{{ $user->created_at->format('M j, Y · g:i A') }}</td>
                                        </tr>
                                        <tr>
                                            <td style="padding:5px 0;color:#94A3B8;vertical-align:top;">Plan</td>
                                            <td style="padding:5px 0;">
                                                <span style="background:#EDE9FE;color:#6D28D9;font-size:11px;font-weight:600;
                                                             padding:2px 8px;border-radius:99px;">
                                                    30-Day Free Trial
                                                </span>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>

                {{-- CTA buttons --}}
                <tr>
                    <td style="padding:28px 32px;">
                        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                                <td style="background:#3362FF;border-radius:8px;padding-right:12px;">
                                    <a href="{{ $userPageUrl }}"
                                       style="display:inline-block;padding:12px 22px;color:#FFFFFF;
                                              font-size:13px;font-weight:600;text-decoration:none;">
                                        View User Activity →
                                    </a>
                                </td>
                                <td style="border:1px solid #E2E8F0;border-radius:8px;">
                                    <a href="{{ $usersUrl }}"
                                       style="display:inline-block;padding:12px 22px;color:#475569;
                                              font-size:13px;font-weight:600;text-decoration:none;">
                                        All Users
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
                            You're receiving this because you're a Super Admin on FcommerceBD.<br>
                            — FcommerceBD System
                        </p>
                    </td>
                </tr>

            </table>
        </td>
    </tr>
</table>
</body>
</html>
