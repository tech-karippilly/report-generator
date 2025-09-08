import { useState } from 'react';
import { sendStudentLoginEmail } from '../utils/apiEmailService';

export default function EmailDebug() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testEmail = async () => {
    setLoading(true);
    setResult('Testing...');
    
    try {
      const testCredentials = {
        name: 'Test User',
        email: 'suuportreportgenerator@gmail.com',
        tempPassword: 'TestPass123!',
        batchCode: 'TEST_BATCH',
        groupName: 'Test Group',
        loginUrl: 'https://report-generator-4a753.web.app/login'
      };

      console.log('Sending test email with credentials:', testCredentials);
      
      const success = await sendStudentLoginEmail(testCredentials);
      
      if (success) {
        console.log('Email sent successfully');
        setResult('✅ Email sent successfully! Check your inbox.');
      } else {
        setResult('❌ Error: Failed to send email. Check console for details.');
      }
      
    } catch (error: any) {
      console.error('Email sending failed:', error);
      setResult(`❌ Error: ${error.message || 'Unknown error occurred'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Email Debug Test</h1>
      
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
        <h2 className="font-semibold mb-2">Current Configuration:</h2>
        <ul className="text-sm space-y-1">
          <li>API Base URL: https://report-generator-backend-r85v.onrender.com</li>
          <li>Email Service: API-based (Backend)</li>
          <li>Status: Using direct API calls instead of EmailJS</li>
        </ul>
      </div>

      <button
        onClick={testEmail}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Send Test Email'}
      </button>

      {result && (
        <div className={`mt-4 p-4 rounded ${
          result.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {result}
        </div>
      )}

      <div className="mt-6 text-sm text-gray-600">
        <h3 className="font-semibold mb-2">Troubleshooting Steps:</h3>
        <ol className="list-decimal list-inside space-y-1">
          <li>Check if backend API is running at https://report-generator-backend-r85v.onrender.com</li>
          <li>Verify API endpoints are accessible (/api/send-welcome, /api/send-session-reminder, etc.)</li>
          <li>Check browser network tab for API call errors</li>
          <li>Check spam folder for the test email</li>
          <li>Verify backend email service configuration</li>
        </ol>
      </div>
    </div>
  );
}
