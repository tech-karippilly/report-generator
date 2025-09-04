// Test EmailJS configuration
import emailjs from '@emailjs/browser';

const testEmail = async () => {
  const serviceId = 'service_13lxauc';
  const templateId = 'template_xwho51h';
  const publicKey = 'XX_vyoM7pPkvI6W_x';
  
  console.log('Testing EmailJS configuration...');
  console.log('Service ID:', serviceId);
  console.log('Template ID:', templateId);
  console.log('Public Key:', publicKey);
  
  try {
    // Initialize EmailJS
    emailjs.init(publicKey);
    console.log('EmailJS initialized successfully');
    
    // Test email parameters
    const templateParams = {
      to_name: 'Test User',
      to_email: 'suuportreportgenerator@gmail.com',
      temp_password: 'TestPass123!',
      batch_code: 'TEST_BATCH',
      group_name: 'Test Group',
      login_url: 'http://localhost:5175/login',
      from_name: 'Comm Reports Team'
    };
    
    console.log('Sending test email...');
    const response = await emailjs.send(serviceId, templateId, templateParams);
    console.log('Email sent successfully:', response);
    
  } catch (error) {
    console.error('Email sending failed:', error);
    console.error('Error details:', {
      status: error.status,
      text: error.text,
      message: error.message
    });
  }
};

// Run the test
testEmail();
