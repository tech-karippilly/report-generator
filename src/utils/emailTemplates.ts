// Email template for student login credentials
export const generateStudentLoginEmailTemplate = (credentials: {
  name: string;
  email: string;
  tempPassword: string;
  batchCode: string;
  groupName?: string;
  loginUrl: string;
}): string => {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Comm Reports - Login Credentials</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
        }
        .content {
            background: #f8f9fa;
            padding: 30px;
            border-radius: 0 0 10px 10px;
        }
        .credentials-box {
            background: white;
            border: 2px solid #e9ecef;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .credential-item {
            display: flex;
            justify-content: space-between;
            margin: 10px 0;
            padding: 10px;
            background: #f8f9fa;
            border-radius: 5px;
        }
        .credential-label {
            font-weight: bold;
            color: #495057;
        }
        .credential-value {
            font-family: monospace;
            background: #e9ecef;
            padding: 5px 10px;
            border-radius: 3px;
            color: #495057;
        }
        .login-button {
            display: inline-block;
            background: #007bff;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
            font-weight: bold;
        }
        .login-button:hover {
            background: #0056b3;
        }
        .warning {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            color: #856404;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            color: #6c757d;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎓 Welcome to Comm Reports!</h1>
        <p>Your login credentials for ${credentials.batchCode}</p>
    </div>
    
    <div class="content">
        <h2>Hello ${credentials.name}!</h2>
        
        <p>You have been added to the training batch <strong>${credentials.batchCode}</strong>${credentials.groupName ? ` (${credentials.groupName})` : ''}.</p>
        
        <p>Below are your login credentials to access the Comm Reports system:</p>
        
        <div class="credentials-box">
            <h3>🔐 Your Login Credentials</h3>
            <div class="credential-item">
                <span class="credential-label">Email:</span>
                <span class="credential-value">${credentials.email}</span>
            </div>
            <div class="credential-item">
                <span class="credential-label">Temporary Password:</span>
                <span class="credential-value">${credentials.tempPassword}</span>
            </div>
            <div class="credential-item">
                <span class="credential-label">Batch Code:</span>
                <span class="credential-value">${credentials.batchCode}</span>
            </div>
        </div>
        
        <div style="text-align: center;">
            <a href="${credentials.loginUrl}" class="login-button">🚀 Login to Comm Reports</a>
        </div>
        
        <div class="warning">
            <strong>⚠️ Important Security Notice:</strong>
            <ul>
                <li>This is a temporary password - please change it after your first login</li>
                <li>Keep your login credentials secure and don't share them with others</li>
                <li>If you didn't expect this email, please contact your trainer immediately</li>
            </ul>
        </div>
        
        <h3>📋 What you can do with Comm Reports:</h3>
        <ul>
            <li>View your batch information and fellow students</li>
            <li>Access session reports and attendance records</li>
            <li>Generate daily session announcements</li>
            <li>Stay updated with training schedules and links</li>
        </ul>
        
        <p>If you have any questions or need assistance, please don't hesitate to contact your trainer or coordinator.</p>
        
        <p>Welcome aboard and happy learning! 🎉</p>
    </div>
    
    <div class="footer">
        <p>This email was sent by the Comm Reports system.</p>
        <p>Please do not reply to this email.</p>
    </div>
</body>
</html>
  `.trim();
};

// Plain text version of the email
export const generateStudentLoginEmailText = (credentials: {
  name: string;
  email: string;
  tempPassword: string;
  batchCode: string;
  groupName?: string;
  loginUrl: string;
}): string => {
  return `
Welcome to Comm Reports!

Hello ${credentials.name}!

You have been added to the training batch ${credentials.batchCode}${credentials.groupName ? ` (${credentials.groupName})` : ''}.

Your login credentials:
- Email: ${credentials.email}
- Temporary Password: ${credentials.tempPassword}
- Batch Code: ${credentials.batchCode}

Login URL: ${credentials.loginUrl}

IMPORTANT SECURITY NOTICE:
- This is a temporary password - please change it after your first login
- Keep your login credentials secure and don't share them with others
- If you didn't expect this email, please contact your trainer immediately

What you can do with Comm Reports:
- View your batch information and fellow students
- Access session reports and attendance records
- Generate daily session announcements
- Stay updated with training schedules and links

If you have any questions or need assistance, please contact your trainer or coordinator.

Welcome aboard and happy learning!

---
This email was sent by the Comm Reports system.
Please do not reply to this email.
  `.trim();
};
