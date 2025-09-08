import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { 
  sendBulkSessionReminderEmails, 
  sendBulkDailyTaskReminderEmails,
  scheduleSessionReminders,
  scheduleDailyTaskReminders,
  getScheduledEmails,
  triggerScheduledEmails,
  type SessionReminderData,
  type DailyTaskReminderData,
  type ScheduleSessionReminderRequest,
  type ScheduleDailyTaskReminderRequest,
  type ScheduledEmail
} from '../utils/apiEmailService';
import { db, isFirebaseConfigured } from '../firebase';
import type { Batch } from '../types';
import Button from '../components/Button';
import Alert from '../components/Alert';

export default function EmailAutomationPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState('');
  const [alertTone, setAlertTone] = useState<'success' | 'error' | 'info' | 'warning'>('info');
  const [customMessage, setCustomMessage] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  
  // Scheduling state
  const [activeTab, setActiveTab] = useState<'manual' | 'schedule' | 'scheduled'>('manual');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [sessionTime, setSessionTime] = useState('10:00');
  const [meetUrl, setMeetUrl] = useState('');
  const [activityTitle, setActivityTitle] = useState('Daily Training Session');
  const [activityDescription, setActivityDescription] = useState('');
  const [trainerName, setTrainerName] = useState('');
  const [taskMessage, setTaskMessage] = useState('');
  const [timeSlots, setTimeSlots] = useState<string[]>(['18:00', '22:00']);
  const [scheduledEmails, setScheduledEmails] = useState<ScheduledEmail[]>([]);
  const [scheduledEmailsLoading, setScheduledEmailsLoading] = useState(false);

  useEffect(() => {
    if (!isFirebaseConfigured || !db) return;
    const unsub = onSnapshot(collection(db, "batches"), (snap) => {
      const list: Batch[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      list.sort((a, b) => a.code.localeCompare(b.code));
      setBatches(list);
    });
    return () => unsub();
  }, []);

  // Initialize default values
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    setFromDate(today);
    setToDate(nextWeek);
    
    if (batches.length > 0) {
      const firstBatch = batches[0];
      setMeetUrl(firstBatch.defaultMeetUrl || 'https://meet.google.com/your-default-meet-link');
      setTrainerName(firstBatch.trainers?.[0]?.name || 'Trainer');
    }
  }, [batches]);

  const totalStudents = batches.reduce((total, batch) => total + (batch.students?.length || 0), 0);

  const sendBulkEmails = async (type: 'session_reminder' | 'daily_task_reminder', batchId?: string) => {
    setIsLoading(true);
    setAlertMsg('');

    try {
      let reminders: (SessionReminderData | DailyTaskReminderData)[] = [];
      let targetBatches = batches;

      if (batchId) {
        targetBatches = batches.filter(b => b.id === batchId);
      }

      for (const batch of targetBatches) {
        for (const student of batch.students || []) {
          if (type === 'session_reminder') {
            reminders.push({
              studentName: student.name,
              studentEmail: student.email,
              batchCode: batch.code,
              groupName: batch.groupName,
              sessionDate: new Date().toISOString().split('T')[0],
              sessionTime: '10:00 AM',
              meetUrl: batch.defaultMeetUrl || 'https://meet.google.com/your-default-meet-link',
              activityTitle: 'Daily Training Session',
              activityDescription: customMessage.trim() || 'Join us for today\'s training session',
              trainerName: batch.trainers?.[0]?.name || 'Trainer'
            });
          } else {
            reminders.push({
              studentName: student.name,
              studentEmail: student.email,
              batchCode: batch.code,
              groupName: batch.groupName,
              taskMessage: customMessage.trim() || 'Complete today\'s assigned tasks and prepare for tomorrow\'s session.',
              date: new Date().toISOString().split('T')[0],
              trainerName: batch.trainers?.[0]?.name || 'Trainer'
            });
          }
        }
      }

      let result;
      if (type === 'session_reminder') {
        result = await sendBulkSessionReminderEmails(reminders as SessionReminderData[]);
      } else {
        result = await sendBulkDailyTaskReminderEmails(reminders as DailyTaskReminderData[]);
      }

      setAlertTone('success');
      if (batchId) {
        const batch = batches.find(b => b.id === batchId);
        setAlertMsg(`${type === 'session_reminder' ? 'Session reminders' : 'Task reminders'} sent successfully to ${result.success} students in ${batch?.code}!`);
      } else {
        setAlertMsg(`${type === 'session_reminder' ? 'Session reminders' : 'Task reminders'} sent successfully to ${result.success} students across all batches!`);
      }
      if (result.failed > 0) {
        setAlertMsg(prev => prev + ` ${result.failed} emails failed to send.`);
        if (result.errors.length > 0) {
          console.error('Email errors:', result.errors);
        }
      }
    } catch (error) {
      console.error('Error sending bulk emails:', error);
      setAlertTone('error');
      setAlertMsg('An error occurred while sending emails.');
    } finally {
      setIsLoading(false);
    }
  };

  // Schedule session reminders
  const scheduleSessionRemindersHandler = async () => {
    if (!fromDate || !toDate) {
      setAlertTone('error');
      setAlertMsg('Please select both from and to dates.');
      return;
    }

    setIsLoading(true);
    setAlertMsg('');

    try {
      let targetBatches = batches;
      if (selectedBatchId) {
        targetBatches = batches.filter(b => b.id === selectedBatchId);
      }

      const students = targetBatches.flatMap(batch => 
        (batch.students || []).map(student => ({
          name: student.name,
          email: student.email,
          batchCode: batch.code,
          groupName: batch.groupName
        }))
      );

      const request: ScheduleSessionReminderRequest = {
        students,
        fromDate,
        toDate,
        sessionDetails: {
          sessionTime,
          meetUrl: meetUrl || 'https://meet.google.com/your-default-meet-link',
          activityTitle: activityTitle || 'Daily Training Session',
          activityDescription: activityDescription || customMessage.trim() || 'Join us for today\'s training session',
          trainerName: trainerName || 'Trainer'
        }
      };

      const result = await scheduleSessionReminders(request);
      
      if (result.success) {
        setAlertTone('success');
        setAlertMsg(`Session reminders scheduled successfully for ${students.length} students from ${fromDate} to ${toDate}!`);
      } else {
        setAlertTone('error');
        setAlertMsg(result.error || 'Failed to schedule session reminders.');
      }
    } catch (error) {
      console.error('Error scheduling session reminders:', error);
      setAlertTone('error');
      setAlertMsg('An error occurred while scheduling session reminders.');
    } finally {
      setIsLoading(false);
    }
  };

  // Schedule daily task reminders
  const scheduleDailyTaskRemindersHandler = async () => {
    if (!fromDate || !toDate) {
      setAlertTone('error');
      setAlertMsg('Please select both from and to dates.');
      return;
    }

    setIsLoading(true);
    setAlertMsg('');

    try {
      let targetBatches = batches;
      if (selectedBatchId) {
        targetBatches = batches.filter(b => b.id === selectedBatchId);
      }

      const students = targetBatches.flatMap(batch => 
        (batch.students || []).map(student => ({
          name: student.name,
          email: student.email,
          batchCode: batch.code,
          groupName: batch.groupName
        }))
      );

      const request: ScheduleDailyTaskReminderRequest = {
        students,
        fromDate,
        toDate,
        taskDetails: {
          taskMessage: taskMessage || customMessage.trim() || 'Complete today\'s assigned tasks and prepare for tomorrow\'s session.',
          trainerName: trainerName || 'Trainer'
        },
        timeSlots
      };

      const result = await scheduleDailyTaskReminders(request);
      
      if (result.success) {
        setAlertTone('success');
        setAlertMsg(`Daily task reminders scheduled successfully for ${students.length} students from ${fromDate} to ${toDate}!`);
      } else {
        setAlertTone('error');
        setAlertMsg(result.error || 'Failed to schedule daily task reminders.');
      }
    } catch (error) {
      console.error('Error scheduling daily task reminders:', error);
      setAlertTone('error');
      setAlertMsg('An error occurred while scheduling daily task reminders.');
    } finally {
      setIsLoading(false);
    }
  };

  // Load scheduled emails
  const loadScheduledEmails = async () => {
    if (!fromDate || !toDate) return;

    setScheduledEmailsLoading(true);
    try {
      const result = await getScheduledEmails(fromDate, toDate);
      if (result.success && result.data) {
        setScheduledEmails(result.data.emails);
      } else {
        setAlertTone('error');
        setAlertMsg(result.error || 'Failed to load scheduled emails.');
      }
    } catch (error) {
      console.error('Error loading scheduled emails:', error);
      setAlertTone('error');
      setAlertMsg('An error occurred while loading scheduled emails.');
    } finally {
      setScheduledEmailsLoading(false);
    }
  };

  // Trigger scheduled emails
  const triggerScheduledEmailsHandler = async (type: 'session' | 'daily', timeSlot?: string) => {
    setIsLoading(true);
    setAlertMsg('');

    try {
      const result = await triggerScheduledEmails({ type, timeSlot });
      
      if (result.success) {
        setAlertTone('success');
        setAlertMsg(result.message || 'Scheduled emails triggered successfully!');
        // Reload scheduled emails to see updated status
        await loadScheduledEmails();
      } else {
        setAlertTone('error');
        setAlertMsg(result.error || 'Failed to trigger scheduled emails.');
      }
    } catch (error) {
      console.error('Error triggering scheduled emails:', error);
      setAlertTone('error');
      setAlertMsg('An error occurred while triggering scheduled emails.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isFirebaseConfigured) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Alert tone="warning">Create a .env.local with your VITE_FIREBASE_* values, then restart the dev server.</Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Email Automation</h1>
            <p className="text-gray-600">Manage automated daily emails for all students across multiple batches</p>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-8">
            <button
              onClick={() => setActiveTab('manual')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'manual'
                  ? 'bg-white text-blue-600 shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Manual Send
            </button>
            <button
              onClick={() => setActiveTab('schedule')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'schedule'
                  ? 'bg-white text-blue-600 shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Schedule
            </button>
            <button
              onClick={() => {
                setActiveTab('scheduled');
                loadScheduledEmails();
              }}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'scheduled'
                  ? 'bg-white text-blue-600 shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Scheduled
            </button>
          </div>

          {alertMsg && (
            <div className="mb-6">
              <Alert tone={alertTone}>{alertMsg}</Alert>
            </div>
          )}

          {/* Tab Content */}
          {activeTab === 'manual' && (
            <>
              {/* Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Total Batches</h3>
              <p className="text-3xl font-bold text-blue-600">{batches.length}</p>
            </div>
            <div className="bg-green-50 p-6 rounded-lg border border-green-200">
              <h3 className="text-lg font-semibold text-green-900 mb-2">Total Students</h3>
              <p className="text-3xl font-bold text-green-600">{totalStudents}</p>
            </div>
            <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
              <h3 className="text-lg font-semibold text-purple-900 mb-2">Daily Emails</h3>
              <p className="text-3xl font-bold text-purple-600">{totalStudents * 2}</p>
              <p className="text-sm text-purple-600">2 per student</p>
            </div>
          </div>

          {/* Manual Email Sending Info */}
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200 mb-8">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">Email Service Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-blue-800">Current Service</h4>
                <p className="text-blue-700">API-based Email Service</p>
                <p className="text-sm text-blue-600">Using backend API for sending emails</p>
              </div>
              <div>
                <h4 className="font-medium text-blue-800">Automation</h4>
                <p className="text-blue-700">⚠️ Manual for now</p>
                <p className="text-sm text-blue-600">Upgrade to Blaze plan for automated scheduling</p>
              </div>
            </div>
          </div>

          {/* Manual Email Sending */}
          <div className="space-y-8">
            <h2 className="text-2xl font-semibold text-gray-900">Manual Email Sending</h2>
            
            {/* Custom Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Message (Optional)
              </label>
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Enter a custom message to include in emails..."
                rows={3}
                className="w-full px-4 py-3 border-0 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:shadow-md"
              />
            </div>

            {/* Batch Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Batch (Leave empty for all batches)
              </label>
              <select
                value={selectedBatchId}
                onChange={(e) => setSelectedBatchId(e.target.value)}
                className="w-full px-4 py-3 border-0 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:shadow-md"
              >
                <option value="">All Batches</option>
                {batches.map((batch) => (
                  <option key={batch.id} value={batch.id}>
                    {batch.code} {batch.groupName && `- ${batch.groupName}`} ({batch.students?.length || 0} students)
                  </option>
                ))}
              </select>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Session Reminders */}
              <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">Session Reminders</h3>
                <p className="text-blue-700 mb-4">
                  Send session reminders with meet links and session details
                </p>
                <div className="space-y-3">
                  <Button
                    onClick={() => sendBulkEmails('session_reminder')}
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? 'Sending...' : 'Send to All Batches'}
                  </Button>
                  <Button
                    onClick={() => sendBulkEmails('session_reminder', selectedBatchId)}
                    disabled={isLoading || !selectedBatchId}
                    variant="secondary"
                    className="w-full"
                  >
                    {isLoading ? 'Sending...' : 'Send to Selected Batch'}
                  </Button>
                </div>
              </div>

              {/* Task Reminders */}
              <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                <h3 className="text-lg font-semibold text-green-900 mb-4">Task Reminders</h3>
                <p className="text-green-700 mb-4">
                  Send daily task reminders with motivational messages
                </p>
                <div className="space-y-3">
                  <Button
                    onClick={() => sendBulkEmails('daily_task_reminder')}
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? 'Sending...' : 'Send to All Batches'}
                  </Button>
                  <Button
                    onClick={() => sendBulkEmails('daily_task_reminder', selectedBatchId)}
                    disabled={isLoading || !selectedBatchId}
                    variant="secondary"
                    className="w-full"
                  >
                    {isLoading ? 'Sending...' : 'Send to Selected Batch'}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Batch Details */}
          <div className="mt-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Batch Details</h2>
            <div className="space-y-4">
              {batches.map((batch) => (
                <div key={batch.id} className="bg-gray-50 p-4 rounded-lg shadow-md">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-900">{batch.code}</h3>
                      {batch.groupName && (
                        <p className="text-gray-600">{batch.groupName}</p>
                      )}
                      <p className="text-sm text-gray-500">
                        {batch.students?.length || 0} students • 
                        Meet URL: {batch.defaultMeetUrl ? 'Set' : 'Not set'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Daily emails</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {(batch.students?.length || 0) * 2}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
            </>
          )}

          {/* Schedule Tab */}
          {activeTab === 'schedule' && (
            <div className="space-y-8">
              <h2 className="text-2xl font-semibold text-gray-900">Schedule Email Reminders</h2>
              
              {/* Date Range Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full px-4 py-3 border-0 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:shadow-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    To Date
                  </label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full px-4 py-3 border-0 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:shadow-md"
                  />
                </div>
              </div>

              {/* Batch Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Batch (Leave empty for all batches)
                </label>
                <select
                  value={selectedBatchId}
                  onChange={(e) => setSelectedBatchId(e.target.value)}
                  className="w-full px-4 py-3 border-0 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:shadow-md"
                >
                  <option value="">All Batches</option>
                  {batches.map((batch) => (
                    <option key={batch.id} value={batch.id}>
                      {batch.code} {batch.groupName && `- ${batch.groupName}`} ({batch.students?.length || 0} students)
                    </option>
                  ))}
                </select>
              </div>

              {/* Session Reminders Scheduling */}
              <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">📚 Schedule Session Reminders</h3>
                <p className="text-blue-700 mb-4">
                  Schedule session reminders to be sent automatically at 9 AM for the selected date range
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Session Time
                    </label>
                    <input
                      type="time"
                      value={sessionTime}
                      onChange={(e) => setSessionTime(e.target.value)}
                      className="w-full px-4 py-3 border-0 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:shadow-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Trainer Name
                    </label>
                    <input
                      type="text"
                      value={trainerName}
                      onChange={(e) => setTrainerName(e.target.value)}
                      placeholder="Enter trainer name"
                      className="w-full px-4 py-3 border-0 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:shadow-md"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meet URL
                  </label>
                  <input
                    type="url"
                    value={meetUrl}
                    onChange={(e) => setMeetUrl(e.target.value)}
                    placeholder="https://meet.google.com/abc-defg-hij"
                    className="w-full px-4 py-3 border-0 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:shadow-md"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Activity Title
                  </label>
                  <input
                    type="text"
                    value={activityTitle}
                    onChange={(e) => setActivityTitle(e.target.value)}
                    placeholder="Daily Training Session"
                    className="w-full px-4 py-3 border-0 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:shadow-md"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Activity Description
                  </label>
                  <textarea
                    value={activityDescription}
                    onChange={(e) => setActivityDescription(e.target.value)}
                    placeholder="Enter activity description..."
                    rows={3}
                    className="w-full px-4 py-3 border-0 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:shadow-md"
                  />
                </div>

                <Button
                  onClick={scheduleSessionRemindersHandler}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? 'Scheduling...' : 'Schedule Session Reminders'}
                </Button>
              </div>

              {/* Daily Task Reminders Scheduling */}
              <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                <h3 className="text-lg font-semibold text-green-900 mb-4">📋 Schedule Daily Task Reminders</h3>
                <p className="text-green-700 mb-4">
                  Schedule daily task reminders to be sent automatically at 6 PM and 10 PM for the selected date range
                </p>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Task Message
                  </label>
                  <textarea
                    value={taskMessage}
                    onChange={(e) => setTaskMessage(e.target.value)}
                    placeholder="Complete the customer service roleplay exercise and submit your reflection by 5 PM today."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time Slots (24-hour format)
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="time"
                      value={timeSlots[0] || '18:00'}
                      onChange={(e) => setTimeSlots([e.target.value, timeSlots[1] || '22:00'])}
                      className="px-4 py-3 border-0 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:shadow-md"
                    />
                    <input
                      type="time"
                      value={timeSlots[1] || '22:00'}
                      onChange={(e) => setTimeSlots([timeSlots[0] || '18:00', e.target.value])}
                      className="px-4 py-3 border-0 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:shadow-md"
                    />
                  </div>
                </div>

                <Button
                  onClick={scheduleDailyTaskRemindersHandler}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? 'Scheduling...' : 'Schedule Daily Task Reminders'}
                </Button>
              </div>
            </div>
          )}

          {/* Scheduled Emails Tab */}
          {activeTab === 'scheduled' && (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold text-gray-900">Scheduled Emails</h2>
                <div className="flex space-x-2">
                  <Button
                    onClick={() => triggerScheduledEmailsHandler('session')}
                    disabled={isLoading}
                    variant="secondary"
                    className="text-sm"
                  >
                    Trigger Session Emails
                  </Button>
                  <Button
                    onClick={() => triggerScheduledEmailsHandler('daily')}
                    disabled={isLoading}
                    variant="secondary"
                    className="text-sm"
                  >
                    Trigger Daily Emails
                  </Button>
                  <Button
                    onClick={loadScheduledEmails}
                    disabled={scheduledEmailsLoading}
                    className="text-sm"
                  >
                    {scheduledEmailsLoading ? 'Loading...' : 'Refresh'}
                  </Button>
                </div>
              </div>

              {scheduledEmailsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading scheduled emails...</p>
                </div>
              ) : scheduledEmails.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No scheduled emails found for the selected date range.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {scheduledEmails.map((email) => (
                    <div key={email.id} className="bg-gray-50 p-4 rounded-lg shadow-md">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              email.type === 'session' 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {email.type === 'session' ? 'Session' : 'Daily Task'}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              email.status === 'pending' 
                                ? 'bg-yellow-100 text-yellow-800'
                                : email.status === 'sent'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {email.status}
                            </span>
                          </div>
                          <h3 className="font-semibold text-gray-900">{email.studentName}</h3>
                          <p className="text-sm text-gray-600">{email.studentEmail}</p>
                          <p className="text-sm text-gray-500">
                            {email.batchCode} {email.groupName && `• ${email.groupName}`}
                          </p>
                          <p className="text-sm text-gray-500">
                            Scheduled: {new Date(email.scheduledDate).toLocaleDateString()}
                            {email.timeSlot && ` at ${email.timeSlot}`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">
                            Created: {new Date(email.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
