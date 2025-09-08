import { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase';
import type { Batch, Student } from '../types';
import { 
  sendBulkSessionReminderEmails, 
  sendBulkDailyTaskReminderEmails,
  type SessionReminderData,
  type DailyTaskReminderData
} from '../utils/apiEmailService';
import Button from '../components/Button';
import Alert from '../components/Alert';

export default function NotificationsPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [notificationType, setNotificationType] = useState<'session' | 'daily_task'>('session');
  const [isSending, setIsSending] = useState(false);
  const [alertMsg, setAlertMsg] = useState('');
  const [alertTone, setAlertTone] = useState<'success' | 'error' | 'info' | 'warning'>('info');

  // Session reminder fields
  const [sessionDate, setSessionDate] = useState('');
  const [sessionTime, setSessionTime] = useState('');
  const [activityTitle, setActivityTitle] = useState('');
  const [activityDescription, setActivityDescription] = useState('');
  const [meetUrl, setMeetUrl] = useState('');

  // Daily task reminder fields
  const [taskMessage, setTaskMessage] = useState('');
  const [taskDate, setTaskDate] = useState('');

  useEffect(() => {
    if (!isFirebaseConfigured || !db) return;
    const unsub = onSnapshot(collection(db, "batches"), (snap) => {
      const list: Batch[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      list.sort((a, b) => a.code.localeCompare(b.code));
      setBatches(list);
    });
    return () => unsub();
  }, []);

  const selectedBatch = useMemo(
    () => batches.find((b) => b.id === selectedBatchId),
    [batches, selectedBatchId]
  );

  // Set default meet URL when batch is selected
  useEffect(() => {
    if (selectedBatch?.defaultMeetUrl && !meetUrl) {
      setMeetUrl(selectedBatch.defaultMeetUrl);
    }
  }, [selectedBatch?.defaultMeetUrl]);

  // Set today's date as default
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setSessionDate(today);
    setTaskDate(today);
  }, []);

  const canSendSessionReminder = useMemo(() => {
    return Boolean(
      selectedBatch &&
      sessionDate &&
      sessionTime &&
      activityTitle &&
      meetUrl &&
      selectedBatch.students.length > 0
    );
  }, [selectedBatch, sessionDate, sessionTime, activityTitle, meetUrl]);

  const canSendDailyTaskReminder = useMemo(() => {
    return Boolean(
      selectedBatch &&
      taskMessage.trim() &&
      taskDate &&
      selectedBatch.students.length > 0
    );
  }, [selectedBatch, taskMessage, taskDate]);

  const handleSendSessionReminder = async () => {
    if (!selectedBatch || !canSendSessionReminder) return;

    try {
      setIsSending(true);
      setAlertMsg('');

      const reminders: SessionReminderData[] = selectedBatch.students.map((student: Student) => ({
        studentName: student.name,
        studentEmail: student.email,
        batchCode: selectedBatch.code,
        groupName: selectedBatch.groupName,
        sessionDate,
        sessionTime,
        meetUrl,
        activityTitle,
        activityDescription: activityDescription.trim() || undefined,
        trainerName: selectedBatch.trainers[0]?.name || 'Trainer'
      }));

      const result = await sendBulkSessionReminderEmails(reminders);
      
      if (result.success > 0) {
        setAlertTone('success');
        setAlertMsg(`Session reminders sent successfully to ${result.success} students!`);
        if (result.failed > 0) {
          setAlertMsg(prev => prev + ` ${result.failed} emails failed to send.`);
        }
      } else {
        setAlertTone('error');
        setAlertMsg('Failed to send session reminders. Please try again.');
      }
    } catch (error) {
      console.error('Error sending session reminders:', error);
      setAlertTone('error');
      setAlertMsg('An error occurred while sending session reminders.');
    } finally {
      setIsSending(false);
    }
  };

  const handleSendDailyTaskReminder = async () => {
    if (!selectedBatch || !canSendDailyTaskReminder) return;

    try {
      setIsSending(true);
      setAlertMsg('');

      const reminders: DailyTaskReminderData[] = selectedBatch.students.map((student: Student) => ({
        studentName: student.name,
        studentEmail: student.email,
        batchCode: selectedBatch.code,
        groupName: selectedBatch.groupName,
        taskMessage: taskMessage.trim(),
        date: taskDate,
        trainerName: selectedBatch.trainers[0]?.name || 'Trainer'
      }));

      const result = await sendBulkDailyTaskReminderEmails(reminders);
      
      if (result.success > 0) {
        setAlertTone('success');
        setAlertMsg(`Daily task reminders sent successfully to ${result.success} students!`);
        if (result.failed > 0) {
          setAlertMsg(prev => prev + ` ${result.failed} emails failed to send.`);
        }
      } else {
        setAlertTone('error');
        setAlertMsg('Failed to send daily task reminders. Please try again.');
      }
    } catch (error) {
      console.error('Error sending daily task reminders:', error);
      setAlertTone('error');
      setAlertMsg('An error occurred while sending daily task reminders.');
    } finally {
      setIsSending(false);
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
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">📧 Send Notifications</h1>
            <p className="text-gray-600">Send session reminders and daily task reminders to students</p>
          </div>

          {alertMsg && (
            <div className="mb-6">
              <Alert tone={alertTone}>{alertMsg}</Alert>
            </div>
          )}

          <div className="mb-6">
            <Alert tone="info">
              📧 Using API-based email service for sending notifications. All emails are sent through the backend API.
            </Alert>
          </div>

          {/* Batch Selection */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Batch *
            </label>
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Choose a batch...</option>
              {batches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.code} {batch.groupName && `- ${batch.groupName}`} ({batch.students.length} students)
                </option>
              ))}
            </select>
          </div>

          {selectedBatch && (
            <>
              {/* Notification Type Selection */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Notification Type
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="session"
                      checked={notificationType === 'session'}
                      onChange={(e) => setNotificationType(e.target.value as 'session' | 'daily_task')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">Session Reminder</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="daily_task"
                      checked={notificationType === 'daily_task'}
                      onChange={(e) => setNotificationType(e.target.value as 'session' | 'daily_task')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">Daily Task Reminder</span>
                  </label>
                </div>
              </div>

              {/* Session Reminder Form */}
              {notificationType === 'session' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-gray-900">Session Reminder Details</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Session Date *
                      </label>
                      <input
                        type="date"
                        value={sessionDate}
                        onChange={(e) => setSessionDate(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Session Time *
                      </label>
                      <input
                        type="time"
                        value={sessionTime}
                        onChange={(e) => setSessionTime(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Activity Title *
                    </label>
                    <input
                      type="text"
                      value={activityTitle}
                      onChange={(e) => setActivityTitle(e.target.value)}
                      placeholder="e.g., Today's Activity – Roleplay"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Activity Description
                    </label>
                    <textarea
                      value={activityDescription}
                      onChange={(e) => setActivityDescription(e.target.value)}
                      placeholder="Optional description of the activity..."
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Meeting Link *
                    </label>
                    <input
                      type="url"
                      value={meetUrl}
                      onChange={(e) => setMeetUrl(e.target.value)}
                      placeholder="https://meet.google.com/..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Recipients</h4>
                    <p className="text-blue-700">
                      This reminder will be sent to <strong>{selectedBatch.students.length} students</strong> in {selectedBatch.code}
                      {selectedBatch.groupName && ` (${selectedBatch.groupName})`}.
                    </p>
                  </div>

                  <Button
                    onClick={handleSendSessionReminder}
                    disabled={!canSendSessionReminder || isSending}
                    className="w-full py-3 text-lg font-medium"
                  >
                    {isSending ? 'Sending Session Reminders...' : 'Send Session Reminders'}
                  </Button>
                </div>
              )}

              {/* Daily Task Reminder Form */}
              {notificationType === 'daily_task' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-gray-900">Daily Task Reminder Details</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Task Date *
                      </label>
                      <input
                        type="date"
                        value={taskDate}
                        onChange={(e) => setTaskDate(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Task Message *
                    </label>
                    <textarea
                      value={taskMessage}
                      onChange={(e) => setTaskMessage(e.target.value)}
                      placeholder="Enter the daily task message for students..."
                      rows={6}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-medium text-green-900 mb-2">Recipients</h4>
                    <p className="text-green-700">
                      This task reminder will be sent to <strong>{selectedBatch.students.length} students</strong> in {selectedBatch.code}
                      {selectedBatch.groupName && ` (${selectedBatch.groupName})`}.
                    </p>
                  </div>

                  <Button
                    onClick={handleSendDailyTaskReminder}
                    disabled={!canSendDailyTaskReminder || isSending}
                    className="w-full py-3 text-lg font-medium"
                  >
                    {isSending ? 'Sending Task Reminders...' : 'Send Task Reminders'}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}


