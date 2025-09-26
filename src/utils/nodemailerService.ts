// Nodemailer-based email service for sending notifications
// This service will be used with a backend API endpoint

export interface NodemailerConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export interface SessionReminderData {
  studentName: string;
  studentEmail: string;
  batchCode: string;
  groupName?: string;
  sessionDate: string;
  sessionTime: string;
  meetUrl: string;
  activityTitle: string;
  activityDescription?: string;
  trainerName: string;
}

export interface DailyTaskReminderData {
  studentName: string;
  studentEmail: string;
  batchCode: string;
  groupName?: string;
  taskMessage: string;
  date: string;
  trainerName: string;
}

// Generate session reminder email HTML
export const generateSessionReminderHTML = (data: SessionReminderData): string => {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Session Reminder - ${data.batchCode}</title>
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
        .session-info {
            background: white;
            border: 2px solid #e9ecef;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .info-item {
            display: flex;
            justify-content: space-between;
            margin: 10px 0;
            padding: 10px;
            background: #f8f9fa;
            border-radius: 5px;
        }
        .info-label {
            font-weight: bold;
            color: #495057;
        }
        .info-value {
            color: #495057;
        }
        .meet-button {
            display: inline-block;
            background: #28a745;
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 8px;
            margin: 20px 0;
            font-weight: bold;
            font-size: 16px;
        }
        .meet-button:hover {
            background: #218838;
        }
        .reminder {
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
        <h1>📚 Session Reminder</h1>
        <p>${data.batchCode}${data.groupName ? ` - ${data.groupName}` : ''}</p>
    </div>
    
    <div class="content">
        <h2>Hello ${data.studentName}!</h2>
        
        <p>This is a friendly reminder about your upcoming training session.</p>
        
        <div class="session-info">
            <h3>📅 Session Details</h3>
            <div class="info-item">
                <span class="info-label">Date:</span>
                <span class="info-value">${data.sessionDate}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Time:</span>
                <span class="info-value">${data.sessionTime}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Activity:</span>
                <span class="info-value">${data.activityTitle}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Trainer:</span>
                <span class="info-value">${data.trainerName}</span>
            </div>
            ${data.activityDescription ? `
            <div class="info-item">
                <span class="info-label">Description:</span>
                <span class="info-value">${data.activityDescription}</span>
            </div>
            ` : ''}
        </div>
        
        <div style="text-align: center;">
            <a href="${data.meetUrl}" class="meet-button">🚀 Join Session</a>
        </div>
        
        <div class="reminder">
            <strong>⏰ Important Reminders:</strong>
            <ul>
                <li>Please join the session 5 minutes before the scheduled time</li>
                <li>Ensure you have a stable internet connection</li>
                <li>Keep your camera and microphone ready</li>
                <li>Have any required materials prepared</li>
            </ul>
        </div>
        
        <p>If you have any questions or need to reschedule, please contact your trainer as soon as possible.</p>
        
        <p>We look forward to seeing you in the session! 🎉</p>
    </div>
    
    <div class="footer">
        <p>This reminder was sent by the Comm Reports system.</p>
        <p>Please do not reply to this email.</p>
    </div>
</body>
</html>
  `.trim();
};

// Generate daily task reminder email HTML
export const generateDailyTaskReminderHTML = (data: DailyTaskReminderData): string => {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Daily Task Reminder - ${data.batchCode}</title>
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
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
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
        .task-box {
            background: white;
            border: 2px solid #e9ecef;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .task-message {
            font-size: 16px;
            line-height: 1.8;
            color: #495057;
            background: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            border-left: 4px solid #28a745;
        }
        .info-item {
            display: flex;
            justify-content: space-between;
            margin: 10px 0;
            padding: 10px;
            background: #f8f9fa;
            border-radius: 5px;
        }
        .info-label {
            font-weight: bold;
            color: #495057;
        }
        .info-value {
            color: #495057;
        }
        .motivation {
            background: #d4edda;
            border: 1px solid #c3e6cb;
            color: #155724;
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
        <h1>📋 Daily Task Reminder</h1>
        <p>${data.batchCode}${data.groupName ? ` - ${data.groupName}` : ''}</p>
    </div>
    
    <div class="content">
        <h2>Hello ${data.studentName}!</h2>
        
        <p>Here's your daily task reminder for <strong>${data.date}</strong>.</p>
        
        <div class="task-box">
            <h3>📝 Today's Task</h3>
            <div class="task-message">
                ${data.taskMessage}
            </div>
        </div>
        
        <div class="info-item">
            <span class="info-label">Batch:</span>
            <span class="info-value">${data.batchCode}${data.groupName ? ` (${data.groupName})` : ''}</span>
        </div>
        <div class="info-item">
            <span class="info-label">Date:</span>
            <span class="info-value">${data.date}</span>
        </div>
        <div class="info-item">
            <span class="info-label">Trainer:</span>
            <span class="info-value">${data.trainerName}</span>
        </div>
        
        <div class="motivation">
            <strong>💪 Keep Going!</strong>
            <p>Remember, consistent practice and dedication are key to your success. Take your time with today's task and don't hesitate to reach out if you need any guidance.</p>
        </div>
        
        <p>If you have any questions about the task or need clarification, please contact your trainer.</p>
        
        <p>Good luck with today's work! 🌟</p>
    </div>
    
    <div class="footer">
        <p>This reminder was sent by the Comm Reports system.</p>
        <p>Please do not reply to this email.</p>
    </div>
</body>
</html>
  `.trim();
};

// Generate plain text versions
export const generateSessionReminderText = (data: SessionReminderData): string => {
  return `
Session Reminder - ${data.batchCode}${data.groupName ? ` - ${data.groupName}` : ''}

Hello ${data.studentName}!

This is a friendly reminder about your upcoming training session.

Session Details:
- Date: ${data.sessionDate}
- Time: ${data.sessionTime}
- Activity: ${data.activityTitle}
- Trainer: ${data.trainerName}
${data.activityDescription ? `- Description: ${data.activityDescription}` : ''}

Join Session: ${data.meetUrl}

Important Reminders:
- Please join the session 5 minutes before the scheduled time
- Ensure you have a stable internet connection
- Keep your camera and microphone ready
- Have any required materials prepared

If you have any questions or need to reschedule, please contact your trainer as soon as possible.

We look forward to seeing you in the session!

---
This reminder was sent by the Comm Reports system.
Please do not reply to this email.
  `.trim();
};

export const generateDailyTaskReminderText = (data: DailyTaskReminderData): string => {
  return `
Daily Task Reminder - ${data.batchCode}${data.groupName ? ` - ${data.groupName}` : ''}

Hello ${data.studentName}!

Here's your daily task reminder for ${data.date}.

Today's Task:
${data.taskMessage}

Batch: ${data.batchCode}${data.groupName ? ` (${data.groupName})` : ''}
Date: ${data.date}
Trainer: ${data.trainerName}

Keep Going!
Remember, consistent practice and dedication are key to your success. Take your time with today's task and don't hesitate to reach out if you need any guidance.

If you have any questions about the task or need clarification, please contact your trainer.

Good luck with today's work!

---
This reminder was sent by the Comm Reports system.
Please do not reply to this email.
  `.trim();
};

// Firebase Functions to send emails
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();

// Callable function for sending emails
const sendEmailFunction = httpsCallable(functions, 'sendEmail');

export const sendSessionReminderEmail = async (data: SessionReminderData): Promise<boolean> => {
  try {
    const result = await sendEmailFunction({
      type: 'session_reminder',
      emailData: data
    });

    return (result.data as any).success;
  } catch (error) {
    console.error('Failed to send session reminder email:', error);
    return false;
  }
};

export const sendDailyTaskReminderEmail = async (data: DailyTaskReminderData): Promise<boolean> => {
  try {
    const result = await sendEmailFunction({
      type: 'daily_task_reminder',
      emailData: data
    });

    return (result.data as any).success;
  } catch (error) {
    console.error('Failed to send daily task reminder email:', error);
    return false;
  }
};

// Bulk email functions
export const sendBulkSessionReminderEmails = async (
  reminders: SessionReminderData[]
): Promise<{ success: number; failed: number; errors: string[] }> => {
  let success = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const reminder of reminders) {
    try {
      const result = await sendSessionReminderEmail(reminder);
      if (result) {
        success++;
      } else {
        failed++;
        errors.push(`Failed to send session reminder to ${reminder.studentEmail}`);
      }
    } catch (error) {
      failed++;
      errors.push(`Error sending session reminder to ${reminder.studentEmail}: ${error}`);
    }
  }

  return { success, failed, errors };
};

export const sendBulkDailyTaskReminderEmails = async (
  reminders: DailyTaskReminderData[]
): Promise<{ success: number; failed: number; errors: string[] }> => {
  let success = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const reminder of reminders) {
    try {
      const result = await sendDailyTaskReminderEmail(reminder);
      if (result) {
        success++;
      } else {
        failed++;
        errors.push(`Failed to send daily task reminder to ${reminder.studentEmail}`);
      }
    } catch (error) {
      failed++;
      errors.push(`Error sending daily task reminder to ${reminder.studentEmail}: ${error}`);
    }
  }

  return { success, failed, errors };
};
