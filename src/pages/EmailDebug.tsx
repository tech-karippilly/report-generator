import { useState } from 'react';
import emailjs from '@emailjs/browser';

export default function EmailDebug() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testEmail = async () => {
    setLoading(true);
    setResult('Testing...');
    
    try {
      // Initialize EmailJS
      emailjs.init('XX_vyoM7pPkvI6W_x');
      
      const templateParams = {
        to_name: 'Test User',
        to_email: 'suuportreportgenerator@gmail.com',
        temp_password: 'TestPass123!',
        batch_code: 'TEST_BATCH',
        group_name: 'Test Group',
        login_url: 'http://localhost:5175/login',
        from_name: 'Comm Reports Team',
        // Try different email field names
        email: 'suuportreportgenerator@gmail.com',
        recipient_email: 'suuportreportgenerator@gmail.com',
        user_email: 'suuportreportgenerator@gmail.com'
      };

      console.log('Sending test email with params:', templateParams);
      
      const response = await emailjs.send(
        'service_13lxauc',
        'template_xwho51h',
        templateParams
      );
      
      console.log('Email sent successfully:', response);
      setResult('✅ Email sent successfully! Check your inbox.');
      
    } catch (error: any) {
      console.error('Email sending failed:', error);
      setResult(`❌ Error: ${error.text || error.message}`);
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
          <li>Service ID: service_13lxauc</li>
          <li>Template ID: template_xwho51h</li>
          <li>Public Key: XX_vyoM7pPkvI6W_x</li>
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
          <li>Check EmailJS dashboard - is your Gmail service active?</li>
          <li>Check template settings - is "To Email" field set to {{to_email}}?</li>
          <li>Check spam folder for the test email</li>
          <li>Try re-authenticating your Gmail service in EmailJS</li>
        </ol>
      </div>
    </div>
  );
}
