import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as nodemailer from 'nodemailer';

// Initialize Firebase Admin
admin.initializeApp();

// Email configuration using your Gmail credentials
const createTransporter = () => {
  return nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: 'suuportreportgenerator@gmail.com',
      pass: 'xsek wxyk byjb elin'
    },
  });
};

// Generate session reminder email HTML
const generateSessionReminderHTML = (data: any) => {
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
const generateDailyTaskReminderHTML = (data: any) => {
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
const generateSessionReminderText = (data: any) => {
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

const generateDailyTaskReminderText = (data: any) => {
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

// Firebase Function to send emails
export const sendEmail = functions.https.onCall(async (data, context) => {
  // Check if user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  try {
    const { type, emailData } = data;

    // Create transporter
    const transporter = createTransporter();

    let mailOptions: any = {};

    if (type === 'session_reminder') {
      mailOptions = {
        from: '"Comm Reports" <suuportreportgenerator@gmail.com>',
        to: emailData.studentEmail,
        subject: `Session Reminder - ${emailData.batchCode}`,
        text: generateSessionReminderText(emailData),
        html: generateSessionReminderHTML(emailData),
      };
    } else if (type === 'daily_task_reminder') {
      mailOptions = {
        from: '"Comm Reports" <suuportreportgenerator@gmail.com>',
        to: emailData.studentEmail,
        subject: `Daily Task Reminder - ${emailData.batchCode}`,
        text: generateDailyTaskReminderText(emailData),
        html: generateDailyTaskReminderHTML(emailData),
      };
    } else {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid email type');
    }

    // Send email
    const info = await transporter.sendMail(mailOptions);
    
    console.log('Email sent successfully:', info.messageId);
    
    return {
      success: true,
      messageId: info.messageId
    };

  } catch (error) {
    console.error('Error sending email:', error);
    throw new functions.https.HttpsError('internal', 'Failed to send email', error);
  }
});

// Scheduled function to send daily session reminders at 8:00 AM
export const sendDailySessionReminders = functions.pubsub.schedule('0 8 * * *')
  .timeZone('Asia/Kolkata') // Adjust timezone as needed
  .onRun(async (context) => {
    console.log('Starting daily session reminders...');
    
    try {
      const db = admin.firestore();
      const batchesSnapshot = await db.collection('batches').get();
      
      let totalSent = 0;
      let totalFailed = 0;
      
      for (const batchDoc of batchesSnapshot.docs) {
        const batch = batchDoc.data();
        const batchId = batchDoc.id;
        
        console.log(`Processing batch: ${batch.code}`);
        
        // Get today's session data (you can customize this logic)
        const today = new Date();
        const sessionDate = today.toISOString().split('T')[0];
        const sessionTime = '10:00 AM'; // Default time, can be customized per batch
        const activityTitle = 'Daily Training Session';
        const meetUrl = batch.defaultMeetUrl || 'https://meet.google.com/your-default-meet-link';
        
        // Send to all students in this batch
        for (const student of batch.students || []) {
          try {
            const transporter = createTransporter();
            
            const sessionData = {
              studentName: student.name,
              studentEmail: student.email,
              batchCode: batch.code,
              groupName: batch.groupName,
              sessionDate: sessionDate,
              sessionTime: sessionTime,
              meetUrl: meetUrl,
              activityTitle: activityTitle,
              activityDescription: 'Join us for today\'s training session',
              trainerName: batch.trainers?.[0]?.name || 'Trainer'
            };
            
            const mailOptions = {
              from: '"Comm Reports" <suuportreportgenerator@gmail.com>',
              to: student.email,
              subject: `Session Reminder - ${batch.code}`,
              text: generateSessionReminderText(sessionData),
              html: generateSessionReminderHTML(sessionData),
            };
            
            await transporter.sendMail(mailOptions);
            totalSent++;
            console.log(`Session reminder sent to ${student.email}`);
            
          } catch (error) {
            totalFailed++;
            console.error(`Failed to send session reminder to ${student.email}:`, error);
          }
        }
      }
      
      console.log(`Daily session reminders completed. Sent: ${totalSent}, Failed: ${totalFailed}`);
      return { success: true, sent: totalSent, failed: totalFailed };
      
    } catch (error) {
      console.error('Error in daily session reminders:', error);
      return { success: false, error: error.message };
    }
  });

// Scheduled function to send daily task reminders at 6:00 PM
export const sendDailyTaskReminders = functions.pubsub.schedule('0 18 * * *')
  .timeZone('Asia/Kolkata') // Adjust timezone as needed
  .onRun(async (context) => {
    console.log('Starting daily task reminders...');
    
    try {
      const db = admin.firestore();
      const batchesSnapshot = await db.collection('batches').get();
      
      let totalSent = 0;
      let totalFailed = 0;
      
      for (const batchDoc of batchesSnapshot.docs) {
        const batch = batchDoc.data();
        const batchId = batchDoc.id;
        
        console.log(`Processing batch: ${batch.code}`);
        
        // Get today's task message (you can customize this per batch)
        const today = new Date();
        const taskDate = today.toISOString().split('T')[0];
        const taskMessage = `Complete today's assigned tasks and prepare for tomorrow's session. Review your notes and practice the concepts we covered.`;
        
        // Send to all students in this batch
        for (const student of batch.students || []) {
          try {
            const transporter = createTransporter();
            
            const taskData = {
              studentName: student.name,
              studentEmail: student.email,
              batchCode: batch.code,
              groupName: batch.groupName,
              taskMessage: taskMessage,
              date: taskDate,
              trainerName: batch.trainers?.[0]?.name || 'Trainer'
            };
            
            const mailOptions = {
              from: '"Comm Reports" <suuportreportgenerator@gmail.com>',
              to: student.email,
              subject: `Daily Task Reminder - ${batch.code}`,
              text: generateDailyTaskReminderText(taskData),
              html: generateDailyTaskReminderHTML(taskData),
            };
            
            await transporter.sendMail(mailOptions);
            totalSent++;
            console.log(`Task reminder sent to ${student.email}`);
            
          } catch (error) {
            totalFailed++;
            console.error(`Failed to send task reminder to ${student.email}:`, error);
          }
        }
      }
      
      console.log(`Daily task reminders completed. Sent: ${totalSent}, Failed: ${totalFailed}`);
      return { success: true, sent: totalSent, failed: totalFailed };
      
    } catch (error) {
      console.error('Error in daily task reminders:', error);
      return { success: false, error: error.message };
    }
  });

// Function to send bulk emails manually (for testing or immediate sending)
export const sendBulkEmails = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  try {
    const { type, batchId, customMessage } = data;
    const db = admin.firestore();
    
    let batchDoc;
    if (batchId) {
      batchDoc = await db.collection('batches').doc(batchId).get();
    } else {
      // Send to all batches
      const batchesSnapshot = await db.collection('batches').get();
      const results = [];
      
      for (const doc of batchesSnapshot.docs) {
        const result = await sendBulkEmails({ type, batchId: doc.id, customMessage }, context);
        results.push(result);
      }
      
      return { success: true, results };
    }
    
    if (!batchDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Batch not found');
    }
    
    const batch = batchDoc.data();
    const transporter = createTransporter();
    
    let totalSent = 0;
    let totalFailed = 0;
    
    for (const student of batch.students || []) {
      try {
        let mailOptions: any = {};
        
        if (type === 'session_reminder') {
          const sessionData = {
            studentName: student.name,
            studentEmail: student.email,
            batchCode: batch.code,
            groupName: batch.groupName,
            sessionDate: new Date().toISOString().split('T')[0],
            sessionTime: '10:00 AM',
            meetUrl: batch.defaultMeetUrl || 'https://meet.google.com/your-default-meet-link',
            activityTitle: 'Daily Training Session',
            activityDescription: customMessage || 'Join us for today\'s training session',
            trainerName: batch.trainers?.[0]?.name || 'Trainer'
          };
          
          mailOptions = {
            from: '"Comm Reports" <suuportreportgenerator@gmail.com>',
            to: student.email,
            subject: `Session Reminder - ${batch.code}`,
            text: generateSessionReminderText(sessionData),
            html: generateSessionReminderHTML(sessionData),
          };
        } else if (type === 'daily_task_reminder') {
          const taskData = {
            studentName: student.name,
            studentEmail: student.email,
            batchCode: batch.code,
            groupName: batch.groupName,
            taskMessage: customMessage || 'Complete today\'s assigned tasks and prepare for tomorrow\'s session.',
            date: new Date().toISOString().split('T')[0],
            trainerName: batch.trainers?.[0]?.name || 'Trainer'
          };
          
          mailOptions = {
            from: '"Comm Reports" <suuportreportgenerator@gmail.com>',
            to: student.email,
            subject: `Daily Task Reminder - ${batch.code}`,
            text: generateDailyTaskReminderText(taskData),
            html: generateDailyTaskReminderHTML(taskData),
          };
        }
        
        await transporter.sendMail(mailOptions);
        totalSent++;
        
      } catch (error) {
        totalFailed++;
        console.error(`Failed to send email to ${student.email}:`, error);
      }
    }
    
    return {
      success: true,
      sent: totalSent,
      failed: totalFailed,
      batchCode: batch.code
    };
    
  } catch (error) {
    console.error('Error in bulk email sending:', error);
    throw new functions.https.HttpsError('internal', 'Failed to send bulk emails', error);
  }
});
