import emailjs from '@emailjs/browser';

// EmailJS configuration
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

export interface StudentLoginCredentials {
  name: string;
  email: string;
  tempPassword: string;
  batchCode: string;
  groupName?: string;
  loginUrl: string;
}

export interface EmailConfig {
  serviceId: string;
  templateId: string;
  publicKey: string;
}

// Initialize EmailJS
export const initializeEmailJS = (config: EmailConfig) => {
  emailjs.init(config.publicKey);
};

// Generate a temporary password
export const generateTempPassword = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

// Send login credentials email to student
export const sendStudentLoginEmail = async (credentials: StudentLoginCredentials): Promise<boolean> => {
  if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) {
    console.error('EmailJS configuration missing. Please set VITE_EMAILJS_* environment variables.');
    return false;
  }

  try {
    // Initialize EmailJS if not already done
    initializeEmailJS({
      serviceId: EMAILJS_SERVICE_ID,
      templateId: EMAILJS_TEMPLATE_ID,
      publicKey: EMAILJS_PUBLIC_KEY
    });

    const templateParams = {
      to_name: credentials.name,
      to_email: credentials.email,
      temp_password: credentials.tempPassword,
      batch_code: credentials.batchCode,
      group_name: credentials.groupName || 'N/A',
      login_url: credentials.loginUrl,
      from_name: 'Comm Reports Team',
      // Try different email field names that EmailJS might expect
      email: credentials.email,
      recipient_email: credentials.email,
      user_email: credentials.email
    };

    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams,
      EMAILJS_PUBLIC_KEY
    );

    console.log('Email sent successfully:', response);
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
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
        errors.push(`Failed to send email to ${student.email}`);
      }
    } catch (error) {
      failed++;
      errors.push(`Error sending email to ${student.email}: ${error}`);
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

// Check if email service is configured
export const isEmailServiceConfigured = (): boolean => {
  return Boolean(EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && EMAILJS_PUBLIC_KEY);
};
