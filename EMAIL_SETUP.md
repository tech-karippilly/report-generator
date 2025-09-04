# Email Setup Guide for Student Login Credentials

This guide explains how to set up email functionality to automatically send login credentials to students when they're added to a batch.

## Overview

The system now includes automatic email functionality that:
- Creates student accounts with temporary passwords
- Sends professional login emails with credentials
- Includes batch information and login instructions
- Provides direct links to the login page

## Email Service Setup (EmailJS)

### 1. Create EmailJS Account

1. Go to [EmailJS.com](https://www.emailjs.com/)
2. Sign up for a free account
3. Verify your email address

### 2. Set Up Email Service

1. In your EmailJS dashboard, go to **Email Services**
2. Click **Add New Service**
3. Choose your email provider (Gmail, Outlook, etc.)
4. Follow the setup instructions for your provider
5. Note down your **Service ID**

### 3. Create Email Template

1. Go to **Email Templates** in your EmailJS dashboard
2. Click **Create New Template**
3. Use this template content:

```html
Subject: Welcome to Comm Reports - Your Login Credentials

Hello {{to_name}}!

You have been added to the training batch {{batch_code}}{{group_name}}.

Your login credentials:
- Email: {{to_email}}
- Temporary Password: {{temp_password}}
- Batch Code: {{batch_code}}

Login URL: {{login_url}}

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
```

4. Note down your **Template ID**

### 4. Get Public Key

1. Go to **Account** → **General**
2. Find your **Public Key** in the API Keys section

### 5. Configure Environment Variables

1. Copy `.env.local.example` to `.env.local`
2. Add your EmailJS credentials:

```env
# EmailJS Configuration
VITE_EMAILJS_SERVICE_ID=your_service_id_here
VITE_EMAILJS_TEMPLATE_ID=your_template_id_here
VITE_EMAILJS_PUBLIC_KEY=your_public_key_here
```

3. Restart your development server

## How It Works

### For New Batches

1. When creating a new batch with students:
   - Check the "Send login credentials to students via email" option
   - The system will create student accounts with temporary passwords
   - Professional emails will be sent to all students
   - You'll see a status report of successful/failed emails

### For Existing Batches

- Email sending is only available for new batches
- Existing batches can be updated without sending emails
- Students in existing batches need to be manually added to the system

## Email Template Variables

The system uses these variables in the email template:

- `{{to_name}}` - Student's name
- `{{to_email}}` - Student's email address
- `{{temp_password}}` - Generated temporary password
- `{{batch_code}}` - Batch code (e.g., "BCR69 Group 2")
- `{{group_name}}` - Group name (optional)
- `{{login_url}}` - Direct link to login page
- `{{from_name}}` - Sender name ("Comm Reports Team")

## Security Features

- **Temporary Passwords**: Students receive secure temporary passwords
- **Account Creation**: Student accounts are automatically created in Firebase
- **Professional Emails**: Branded, professional email templates
- **Security Warnings**: Clear instructions about password security
- **Error Handling**: Graceful handling of email failures

## Troubleshooting

### Email Service Not Configured
- Check that all environment variables are set correctly
- Restart the development server after adding environment variables
- Verify EmailJS credentials are correct

### Emails Not Sending
- Check EmailJS dashboard for error logs
- Verify email service is active
- Check that template variables match exactly
- Ensure email provider allows sending from your domain

### Student Account Creation Fails
- Check Firebase configuration
- Verify Firebase Auth is enabled
- Check Firebase console for error logs
- Ensure student emails are valid

## Testing

1. Create a test batch with your own email
2. Check that the email is received
3. Test the login with the provided credentials
4. Verify all template variables are populated correctly

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Check EmailJS dashboard for delivery status
3. Verify all configuration steps were completed
4. Contact support with specific error messages

## Cost Considerations

- EmailJS free tier: 200 emails/month
- Paid plans start at $15/month for 1,000 emails
- Consider your student volume when choosing a plan
