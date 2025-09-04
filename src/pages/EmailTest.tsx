import { useState } from 'react';
import emailjs from '@emailjs/browser';

export default function EmailTest() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const testEmail = async () => {
    setIsLoading(true);
    setResult('');

    try {
      // Initialize EmailJS
      emailjs.init('XX_vyoM7pPkvI6W_x');
      
      const templateParams = {
        to_name: 'Test User',
        to_email: 'suuportreportgenerator@gmail.com',
        temp_password: 'TestPass123!',
        batch_code: 'TEST_BATCH',
        group_name: 'Test Group',
        login_url: 'https://report-generator-4a753.web.app/login',
        from_name: 'Comm Reports Team'
      };

      console.log('Sending test email with params:', templateParams);
      
      const response = await emailjs.send(
        'service_13lxauc',
        'template_xwho51h',
        templateParams
      );
      
      console.log('Email sent successfully:', response);
      setResult(`✅ Email sent successfully! Status: ${response.status}`);
      
    } catch (error: any) {
      console.error('Email sending failed:', error);
      setResult(`❌ Email failed: ${error.message || error.text || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Email Test Page</h1>
      
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <h2 className="font-semibold mb-2">Configuration:</h2>
        <ul className="text-sm space-y-1">
          <li>Service ID: service_13lxauc</li>
          <li>Template ID: template_xwho51h</li>
          <li>Public Key: XX_vyoM7pPkvI6W_x</li>
        </ul>
      </div>

      <button
        onClick={testEmail}
        disabled={isLoading}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {isLoading ? 'Sending...' : 'Send Test Email'}
      </button>

      {result && (
        <div className={`mt-4 p-4 rounded-lg ${
          result.includes('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {result}
        </div>
      )}

      <div className="mt-6 text-sm text-gray-600">
        <p><strong>Note:</strong> Check your email (including spam folder) after clicking the button.</p>
        <p><strong>Console:</strong> Open Developer Tools (F12) to see detailed logs.</p>
      </div>
    </div>
  );
}
