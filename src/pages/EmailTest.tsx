import { useState } from 'react';
import { sendSessionReminderEmail, sendDailyTaskReminderEmail } from '../utils/apiEmailService';
import Button from '../components/Button';
import Alert from '../components/Alert';

export default function EmailTestPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState('');
  const [alertTone, setAlertTone] = useState<'success' | 'error' | 'info' | 'warning'>('info');
  const [testEmail, setTestEmail] = useState('');

  const testSessionReminder = async () => {
    if (!testEmail.trim()) {
      setAlertTone('error');
      setAlertMsg('Please enter a test email address');
      return;
    }

    setIsLoading(true);
    setAlertMsg('');

    try {
      const result = await sendSessionReminderEmail({
        studentName: 'Test Student',
        studentEmail: testEmail.trim(),
        batchCode: 'TEST-BATCH',
        groupName: 'Test Group',
        sessionDate: new Date().toISOString().split('T')[0],
        sessionTime: '10:00 AM',
        meetUrl: 'https://meet.google.com/test-link',
        activityTitle: 'Test Session',
        activityDescription: 'This is a test session reminder',
        trainerName: 'Test Trainer'
      });

      if (result) {
        setAlertTone('success');
        setAlertMsg('Session reminder sent successfully! Check your email.');
      } else {
        setAlertTone('error');
        setAlertMsg('Failed to send session reminder. Check console for errors.');
      }
    } catch (error) {
      console.error('Error sending test email:', error);
      setAlertTone('error');
      setAlertMsg(`Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testTaskReminder = async () => {
    if (!testEmail.trim()) {
      setAlertTone('error');
      setAlertMsg('Please enter a test email address');
      return;
    }

    setIsLoading(true);
    setAlertMsg('');

    try {
      const result = await sendDailyTaskReminderEmail({
        studentName: 'Test Student',
        studentEmail: testEmail.trim(),
        batchCode: 'TEST-BATCH',
        groupName: 'Test Group',
        taskMessage: 'This is a test task reminder message. Please complete your daily tasks.',
        date: new Date().toISOString().split('T')[0],
        trainerName: 'Test Trainer'
      });

      if (result) {
        setAlertTone('success');
        setAlertMsg('Task reminder sent successfully! Check your email.');
      } else {
        setAlertTone('error');
        setAlertMsg('Failed to send task reminder. Check console for errors.');
      }
    } catch (error) {
      console.error('Error sending test email:', error);
      setAlertTone('error');
      setAlertMsg(`Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">🧪 Email Test</h1>
            <p className="text-gray-600">Test email sending functionality</p>
          </div>

          {alertMsg && (
            <div className="mb-6">
              <Alert tone={alertTone}>{alertMsg}</Alert>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Test Email Address
              </label>
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="Enter your email address to test"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={testSessionReminder}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'Sending...' : 'Test Session Reminder'}
              </Button>

              <Button
                onClick={testTaskReminder}
                disabled={isLoading}
                variant="secondary"
                className="w-full"
              >
                {isLoading ? 'Sending...' : 'Test Task Reminder'}
              </Button>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h3 className="font-semibold text-yellow-800 mb-2">Troubleshooting Tips:</h3>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Check your spam folder if you don't receive the email</li>
                <li>• Make sure your backend API is running and accessible</li>
                <li>• Check the browser console for any error messages</li>
                <li>• Verify your Gmail app password is correct</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}