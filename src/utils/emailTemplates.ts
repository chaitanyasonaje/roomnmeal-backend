export const welcomeTemplate = (otp: string) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f9; margin: 0; padding: 0; }
        .container { width: 100%; max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); overflow: hidden; }
        .header { background-color: #2563eb; padding: 30px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; }
        .content { padding: 40px; text-align: center; color: #334155; }
        .content h2 { color: #1e293b; margin-top: 0; }
        .otp-container { background-color: #eff6ff; border: 2px dashed #2563eb; border-radius: 8px; padding: 20px; margin: 30px 0; display: inline-block; width: 100%; box-sizing: border-box; }
        .otp-code { font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #2563eb; margin: 0; }
        .security-note { font-size: 13px; color: #64748b; line-height: 1.6; border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px; text-align: left; }
        .footer { background-color: #f8fafc; padding: 30px; text-align: left; font-size: 14px; color: #64748b; }
        .footer strong { color: #334155; display: block; margin-bottom: 4px; }
        .footer span { font-size: 13px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>RoomNMeal</h1>
        </div>
        <div class="content">
            <h2>Welcome to the family!</h2>
            <p>We're thrilled to have you here. To complete your registration and secure your account, please use the verification code below:</p>
            <div class="otp-container">
                <p class="otp-code">${otp}</p>
            </div>
            <p>This code is valid for 5 minutes.</p>
            <div class="security-note">
                <strong>Security Reminder:</strong> Never share this code with anyone. RoomNMeal staff will never ask for your OTP. If you didn't request this, please ignore this email.
            </div>
        </div>
        <div class="footer">
            <strong>Chaitanya Sonaje</strong>
            <span>Founder, RoomNMeal</span>
        </div>
    </div>
</body>
</html>
`;

export const loginOtpTemplate = (otp: string) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f9; margin: 0; padding: 0; }
        .container { width: 100%; max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); overflow: hidden; }
        .header { background-color: #2563eb; padding: 30px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; }
        .content { padding: 40px; text-align: center; color: #334155; }
        .content h2 { color: #1e293b; margin-top: 0; }
        .otp-container { background-color: #eff6ff; border: 2px dashed #2563eb; border-radius: 8px; padding: 20px; margin: 30px 0; display: inline-block; width: 100%; box-sizing: border-box; }
        .otp-code { font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #2563eb; margin: 0; }
        .security-note { font-size: 13px; color: #64748b; line-height: 1.6; border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px; text-align: left; }
        .footer { background-color: #f8fafc; padding: 30px; text-align: left; font-size: 14px; color: #64748b; }
        .footer strong { color: #334155; display: block; margin-bottom: 4px; }
        .footer span { font-size: 13px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>RoomNMeal</h1>
        </div>
        <div class="content">
            <h2>Secure Login</h2>
            <p>Use the following code to sign in to your RoomNMeal account. This helps us verify it's really you.</p>
            <div class="otp-container">
                <p class="otp-code">${otp}</p>
            </div>
            <p>This code is valid for 5 minutes.</p>
            <div class="security-note">
                <strong>Security Reminder:</strong> If you did not attempt to log in, someone else might be trying to access your account. Please change your password immediately.
            </div>
        </div>
        <div class="footer">
            <strong>Chaitanya Sonaje</strong>
            <span>Founder, RoomNMeal</span>
        </div>
    </div>
</body>
</html>
`;

export const passwordResetTemplate = (otp: string) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f9; margin: 0; padding: 0; }
        .container { width: 100%; max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); overflow: hidden; }
        .header { background-color: #ea580c; padding: 30px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; }
        .content { padding: 40px; text-align: center; color: #334155; }
        .content h2 { color: #1e293b; margin-top: 0; }
        .otp-container { background-color: #ffedd5; border: 2px dashed #ea580c; border-radius: 8px; padding: 20px; margin: 30px 0; display: inline-block; width: 100%; box-sizing: border-box; }
        .otp-code { font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #ea580c; margin: 0; }
        .security-note { font-size: 13px; color: #64748b; line-height: 1.6; border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px; text-align: left; }
        .footer { background-color: #f8fafc; padding: 30px; text-align: left; font-size: 14px; color: #64748b; }
        .footer strong { color: #334155; display: block; margin-bottom: 4px; }
        .footer span { font-size: 13px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>RoomNMeal</h1>
        </div>
        <div class="content">
            <h2>Reset Password</h2>
            <p>We received a request to reset your password. Use the following code to continue the process.</p>
            <div class="otp-container">
                <p class="otp-code">${otp}</p>
            </div>
            <p>This code is valid for 5 minutes.</p>
            <div class="security-note">
                <strong>Security Reminder:</strong> If you did not request a password reset, you can safely ignore this email. Someone may have typed your email by mistake.
            </div>
        </div>
        <div class="footer">
            <strong>Chaitanya Sonaje</strong>
            <span>Founder, RoomNMeal</span>
        </div>
    </div>
</body>
</html>
`;
