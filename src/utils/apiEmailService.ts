// API-based email service using your backend endpoints
// This replaces EmailJS with direct API calls

export interface StudentLoginCredentials {
  name: string;
  email: string;
  tempPassword: string;
  batchCode: string;
  groupName?: string;
  loginUrl: string;
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

// New interfaces for scheduling APIs
export interface ScheduleSessionReminderRequest {
  students: {
    name: string;
    email: string;
    batchCode: string;
    groupName?: string;
  }[];
  fromDate: string;
  toDate: string;
  sessionDetails: {
    sessionTime: string;
    meetUrl: string;
    activityTitle: string;
    activityDescription: string;
    trainerName: string;
  };
}

export interface ScheduleDailyTaskReminderRequest {
  students: {
    name: string;
    email: string;
    batchCode: string;
    groupName?: string;
  }[];
  fromDate: string;
  toDate: string;
  taskDetails: {
    taskMessage: string;
    trainerName: string;
  };
  timeSlots: string[];
}

export interface ScheduledEmail {
  id: string;
  type: 'session' | 'daily';
  studentEmail: string;
  studentName: string;
  batchCode: string;
  groupName?: string;
  scheduledDate: string;
  timeSlot?: string;
  status: 'pending' | 'sent' | 'failed';
  createdAt: string;
}

export interface GetScheduledEmailsResponse {
  emails: ScheduledEmail[];
  total: number;
}

export interface TriggerScheduledEmailsRequest {
  type: 'session' | 'daily';
  timeSlot?: string;
}

// API Configuration
const API_BASE_URL = 'https://report-generator-backend-r85v.onrender.com';

// Generate a temporary password
export const generateTempPassword = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

// Generic API call function
const apiCall = async (endpoint: string, data: any): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || `HTTP error! status: ${response.status}`
      };
    }

    return {
      success: true,
      message: result.message || 'Email sent successfully'
    };
  } catch (error) {
    console.error('API call failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

// Send welcome email with login credentials
export const sendStudentLoginEmail = async (credentials: StudentLoginCredentials): Promise<boolean> => {
  const result = await apiCall('/api/send-welcome', credentials);
  
  if (result.success) {
    console.log('Welcome email sent successfully:', result.message);
  } else {
    console.error('Failed to send welcome email:', result.error);
  }
  
  return result.success;
};

// Send session reminder email
export const sendSessionReminderEmail = async (data: SessionReminderData): Promise<boolean> => {
  const result = await apiCall('/api/send-session-reminder', data);
  
  if (result.success) {
    console.log('Session reminder sent successfully:', result.message);
  } else {
    console.error('Failed to send session reminder:', result.error);
  }
  
  return result.success;
};

// Send daily task reminder email
export const sendDailyTaskReminderEmail = async (data: DailyTaskReminderData): Promise<boolean> => {
  const result = await apiCall('/api/send-daily-task-reminder', data);
  
  if (result.success) {
    console.log('Daily task reminder sent successfully:', result.message);
  } else {
    console.error('Failed to send daily task reminder:', result.error);
  }
  
  return result.success;
};

// Send login credentials to multiple students
export const sendBulkStudentLoginEmails = async (
  students: StudentLoginCredentials[]
): Promise<{ success: number; failed: number; errors: string[] }> => {
  let success = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const student of students) {
    try {
      const result = await sendStudentLoginEmail(student);
      if (result) {
        success++;
      } else {
        failed++;
        errors.push(`Failed to send welcome email to ${student.email}`);
      }
    } catch (error) {
      failed++;
      errors.push(`Error sending welcome email to ${student.email}: ${error}`);
    }
  }

  return { success, failed, errors };
};

// Send bulk session reminder emails
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

// Send bulk daily task reminder emails
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

// Create student account with temporary password
export const createStudentAccount = async (
  email: string, 
  tempPassword: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Import Firebase auth functions
    const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth');
    const { auth } = await import('../firebase');

    if (!auth) {
      return { success: false, error: 'Firebase auth not configured' };
    }

    // Create user account
    const userCredential = await createUserWithEmailAndPassword(auth, email, tempPassword);
    
    // Set display name (extract from email)
    const displayName = email.split('@')[0];
    await updateProfile(userCredential.user, {
      displayName: displayName
    });

    return { success: true };
  } catch (error: any) {
    console.error('Failed to create student account:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to create student account' 
    };
  }
};

// Schedule session reminder emails
export const scheduleSessionReminders = async (
  request: ScheduleSessionReminderRequest
): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/schedule-session-reminders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || `HTTP error! status: ${response.status}`
      };
    }

    return {
      success: true,
      message: result.message || 'Session reminders scheduled successfully'
    };
  } catch (error) {
    console.error('Failed to schedule session reminders:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

// Schedule daily task reminder emails
export const scheduleDailyTaskReminders = async (
  request: ScheduleDailyTaskReminderRequest
): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/schedule-daily-task-reminders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || `HTTP error! status: ${response.status}`
      };
    }

    return {
      success: true,
      message: result.message || 'Daily task reminders scheduled successfully'
    };
  } catch (error) {
    console.error('Failed to schedule daily task reminders:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

// Get scheduled emails
export const getScheduledEmails = async (
  fromDate: string,
  toDate: string,
  type?: 'session' | 'daily'
): Promise<{ success: boolean; data?: GetScheduledEmailsResponse; error?: string }> => {
  try {
    const params = new URLSearchParams({
      fromDate,
      toDate,
      ...(type && { type })
    });

    const response = await fetch(`${API_BASE_URL}/api/scheduled-emails?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || `HTTP error! status: ${response.status}`
      };
    }

    return {
      success: true,
      data: result
    };
  } catch (error) {
    console.error('Failed to get scheduled emails:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

// Trigger scheduled emails manually
export const triggerScheduledEmails = async (
  request: TriggerScheduledEmailsRequest
): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/trigger-scheduled-emails`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || `HTTP error! status: ${response.status}`
      };
    }

    return {
      success: true,
      message: result.message || 'Scheduled emails triggered successfully'
    };
  } catch (error) {
    console.error('Failed to trigger scheduled emails:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

// Check if email service is configured (always true for API service)
export const isEmailServiceConfigured = (): boolean => {
  return true; // API service is always available
};
