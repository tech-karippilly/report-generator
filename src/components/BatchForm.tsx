import { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, doc, serverTimestamp, deleteField } from 'firebase/firestore';
import type { Batch, Person, Student } from '../types';
import { db, isFirebaseConfigured } from '../firebase';
import { 
  sendBulkStudentLoginEmails, 
  generateTempPassword, 
  createStudentAccount, 
  isEmailServiceConfigured,
  type StudentLoginCredentials 
} from '../utils/emailService';
import Button from './Button';
import Alert from './Alert';

interface BatchFormProps {
  batch?: Batch | null;
  onSave: () => void;
  onCancel: () => void;
}

function newId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export default function BatchForm({ batch, onSave, onCancel }: BatchFormProps) {
  const [batchName, setBatchName] = useState('');
  const [groupName, setGroupName] = useState('');
  const [sessionLink, setSessionLink] = useState('');
  const [trainers, setTrainers] = useState<Person[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [coordinators, setCoordinators] = useState<Person[]>([]);

  // Trainer form fields
  const [trainerName, setTrainerName] = useState('');
  const [trainerEmail, setTrainerEmail] = useState('');
  const [trainerPhone, setTrainerPhone] = useState('');

  // Student form fields
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentPhone, setStudentPhone] = useState('');

  // Coordinator form fields
  const [coordinatorName, setCoordinatorName] = useState('');
  const [coordinatorEmail, setCoordinatorEmail] = useState('');
  const [coordinatorPhone, setCoordinatorPhone] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [alertMsg, setAlertMsg] = useState('');
  const [alertTone, setAlertTone] = useState<'success' | 'error' | 'info' | 'warning'>('info');
  
  // Email functionality
  const [sendEmails, setSendEmails] = useState(true);
  const [isSendingEmails, setIsSendingEmails] = useState(false);
  const [emailStatus, setEmailStatus] = useState<{
    success: number;
    failed: number;
    errors: string[];
  } | null>(null);

  useEffect(() => {
    if (batch) {
      setBatchName(batch.code);
      setGroupName(batch.groupName || '');
      setSessionLink(batch.defaultMeetUrl || '');
      setTrainers(batch.trainers || []);
      setStudents(batch.students || []);
      setCoordinators(batch.coordinators || []);
    } else {
      // Reset form for new batch
      setBatchName('');
      setGroupName('');
      setSessionLink('');
      setTrainers([]);
      setStudents([]);
      setCoordinators([]);
    }
  }, [batch]);

  const canSave = batchName.trim().length > 0 && trainers.length > 0 && students.length > 0;

  async function handleSave() {
    if (!canSave) return;

    try {
      setIsSaving(true);
      setAlertMsg('');
      if (!db) return;

      const now = Date.now();
      const clean = <T extends { [k: string]: any }>(obj: T): T => {
        const out: any = {};
        Object.entries(obj).forEach(([k, v]) => {
          if (v !== undefined) out[k] = v;
        });
        return out as T;
      };

      const cleanPeople = (arr: { id: string; name: string; email?: string; phone?: string }[]) =>
        arr.map(p => clean({ id: p.id, name: p.name, email: p.email, phone: p.phone }));

      let batchId: string;
      let isNewBatch = false;

      if (batch) {
        // Update existing batch
        const payload: any = {
          code: batchName.trim(),
          groupName: groupName.trim() || undefined,
          trainers: cleanPeople(trainers),
          coordinators: cleanPeople(coordinators),
          students: cleanPeople(students),
          updatedAt: now,
          ts: serverTimestamp(),
        };
        if (sessionLink.trim()) payload.defaultMeetUrl = sessionLink.trim();
        else payload.defaultMeetUrl = deleteField();

        await updateDoc(doc(db, "batches", batch.id), payload);
        batchId = batch.id;
        setAlertTone("success");
        setAlertMsg("Batch updated successfully.");
      } else {
        // Create new batch
        const docRef = await addDoc(collection(db, "batches"), clean({
          code: batchName.trim(),
          groupName: groupName.trim() || undefined,
          defaultMeetUrl: sessionLink.trim() || undefined,
          trainers: cleanPeople(trainers),
          coordinators: cleanPeople(coordinators),
          students: cleanPeople(students),
          createdAt: now,
          updatedAt: now,
          ts: serverTimestamp(),
        }));
        batchId = docRef.id;
        isNewBatch = true;
        setAlertTone("success");
        setAlertMsg("Batch created successfully.");
      }

      // Send emails to students if enabled and this is a new batch
      if (sendEmails && isNewBatch && students.length > 0) {
        if (!isEmailServiceConfigured()) {
          setAlertTone("warning");
          setAlertMsg("Batch saved but email service not configured. Students will need to be manually added to the system.");
        } else {
          setIsSendingEmails(true);
          setAlertMsg("Sending login emails to students...");
          
          try {
            // Create student accounts and prepare email data
            const emailCredentials: StudentLoginCredentials[] = [];
            const loginUrl = `${window.location.origin}/login`;
            
            for (const student of students) {
              const tempPassword = generateTempPassword();
              
              // Create student account
              const accountResult = await createStudentAccount(student.email, tempPassword);
              
              if (accountResult.success) {
                emailCredentials.push({
                  name: student.name,
                  email: student.email,
                  tempPassword,
                  batchCode: batchName.trim(),
                  groupName: groupName.trim() || undefined,
                  loginUrl
                });
              } else {
                console.warn(`Failed to create account for ${student.email}:`, accountResult.error);
              }
            }

            // Send emails
            if (emailCredentials.length > 0) {
              const emailResult = await sendBulkStudentLoginEmails(emailCredentials);
              setEmailStatus(emailResult);
              
              if (emailResult.success > 0) {
                setAlertTone("success");
                setAlertMsg(`Batch saved! Login emails sent to ${emailResult.success} students.`);
                if (emailResult.failed > 0) {
                  setAlertMsg(prev => prev + ` ${emailResult.failed} emails failed to send.`);
                }
              } else {
                setAlertTone("warning");
                setAlertMsg("Batch saved but no emails were sent successfully.");
              }
            } else {
              setAlertTone("warning");
              setAlertMsg("Batch saved but no student accounts were created successfully.");
            }
          } catch (emailError) {
            console.error('Email sending failed:', emailError);
            setAlertTone("warning");
            setAlertMsg("Batch saved but failed to send login emails. Students will need to be manually added to the system.");
          } finally {
            setIsSendingEmails(false);
          }
        }
      }

      setTimeout(() => {
        onSave();
      }, 1500);
    } catch (e) {
      setAlertTone("error");
      const code = (e as any)?.code ?? "error";
      const msg = (e as any)?.message ?? "Failed to save batch. Please try again.";
      setAlertMsg(`${code}: ${msg}`);
    } finally {
      setIsSaving(false);
    }
  }

  function addTrainer() {
    const name = trainerName.trim();
    const email = trainerEmail.trim();
    if (!name || !email) return;

    const phone = trainerPhone.trim() || undefined;
    setTrainers((prev) => [...prev, { id: newId(), name, email, phone }]);
    setTrainerName('');
    setTrainerEmail('');
    setTrainerPhone('');
  }

  function addStudent() {
    const name = studentName.trim();
    const email = studentEmail.trim();
    if (!name || !email) return;

    const phone = studentPhone.trim() || undefined;
    setStudents((prev) => [...prev, { id: newId(), name, email, phone }]);
    setStudentName('');
    setStudentEmail('');
    setStudentPhone('');
  }

  function addCoordinator() {
    const name = coordinatorName.trim();
    const email = coordinatorEmail.trim();
    if (!name || !email) return;

    const phone = coordinatorPhone.trim() || undefined;
    setCoordinators((prev) => [...prev, { id: newId(), name, email, phone }]);
    setCoordinatorName('');
    setCoordinatorEmail('');
    setCoordinatorPhone('');
  }

  function removeTrainer(id: string) {
    setTrainers(trainers.filter(t => t.id !== id));
  }

  function removeStudent(id: string) {
    setStudents(students.filter(s => s.id !== id));
  }

  function removeCoordinator(id: string) {
    setCoordinators(coordinators.filter(c => c.id !== id));
  }

  function setAsCoordinator(studentId: string) {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    // Check if already a coordinator
    if (coordinators.some(c => c.id === studentId)) {
      setCoordinators(coordinators.filter(c => c.id !== studentId));
    } else {
      // Check if we already have 2 coordinators
      if (coordinators.length >= 2) {
        setAlertTone("warning");
        setAlertMsg("Only 2 coordinators are allowed. Please remove one first.");
        setTimeout(() => setAlertMsg(""), 3000);
        return;
      }
      // Add to coordinators
      setCoordinators([...coordinators, { id: student.id, name: student.name, email: student.email, phone: student.phone }]);
    }
  }

  if (!isFirebaseConfigured) {
    return (
      <div className="space-y-4">
        <Alert tone="warning">Create a .env.local with your VITE_FIREBASE_* values, then restart the dev server.</Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">
          {batch ? 'Edit Batch' : 'Create New Batch'}
        </h2>
        <Button variant="danger" onClick={onCancel}>
          Cancel
        </Button>
      </div>

      {alertMsg && <Alert tone={alertTone}>{alertMsg}</Alert>}

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Batch Name *
            </label>
            <input
              value={batchName}
              onChange={(e) => setBatchName(e.target.value)}
              placeholder="e.g., BCR69 Group 2"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Group Name
            </label>
            <input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g., Advanced Group"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Session Link
          </label>
          <input
            value={sessionLink}
            onChange={(e) => setSessionLink(e.target.value)}
            placeholder="https://meet.google.com/..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Trainers Section */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Trainers (One or More)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <input
              value={trainerName}
              onChange={(e) => setTrainerName(e.target.value)}
              placeholder="Trainer Name *"
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              value={trainerEmail}
              onChange={(e) => setTrainerEmail(e.target.value)}
              placeholder="Email *"
              type="email"
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              value={trainerPhone}
              onChange={(e) => setTrainerPhone(e.target.value)}
              placeholder="Phone (optional)"
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={addTrainer} disabled={!trainerName.trim() || !trainerEmail.trim()}>
              Add Trainer
            </Button>
            <Button 
              variant="secondary" 
              onClick={() => {
                setTrainerName('');
                setTrainerEmail('');
                setTrainerPhone('');
              }}
            >
              Clear
            </Button>
          </div>

          {trainers.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Added Trainers ({trainers.length})</h4>
              <div className="space-y-2">
                {trainers.map((trainer, index) => (
                  <div key={trainer.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <span className="font-medium text-blue-900">{trainer.name}</span>
                        <span className="text-blue-700 ml-2">({trainer.email})</span>
                        {trainer.phone && <span className="text-blue-600 ml-2">- {trainer.phone}</span>}
                      </div>
                    </div>
                    <Button variant="danger" className="text-sm px-3 py-1" onClick={() => removeTrainer(trainer.id)}>
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Students Section */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Students</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <input
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="Student Name *"
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              value={studentEmail}
              onChange={(e) => setStudentEmail(e.target.value)}
              placeholder="Email *"
              type="email"
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              value={studentPhone}
              onChange={(e) => setStudentPhone(e.target.value)}
              placeholder="Phone (optional)"
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={addStudent} disabled={!studentName.trim() || !studentEmail.trim()}>
              Add Student
            </Button>
            <Button 
              variant="secondary" 
              onClick={() => {
                setStudentName('');
                setStudentEmail('');
                setStudentPhone('');
              }}
            >
              Clear
            </Button>
          </div>

          {students.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Added Students ({students.length})</h4>
              <div className="space-y-2">
                {students.map((student, index) => (
                  <div key={student.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <span className="font-medium text-green-900">{student.name}</span>
                        <span className="text-green-700 ml-2">({student.email})</span>
                        {student.phone && <span className="text-green-600 ml-2">- {student.phone}</span>}
                      </div>
                      <Button
                        variant={coordinators.some(c => c.id === student.id) ? "primary" : "secondary"}
                        className="text-xs px-2 py-1"
                        onClick={() => setAsCoordinator(student.id)}
                        disabled={coordinators.length >= 2 && !coordinators.some(c => c.id === student.id)}
                      >
                        {coordinators.some(c => c.id === student.id) ? 'Coordinator' : 'Set as Coordinator'}
                      </Button>
                    </div>
                    <Button variant="danger" className="text-sm px-3 py-1" onClick={() => removeStudent(student.id)}>
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Coordinators Section */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Coordinators (Any Two Students) - {coordinators.length}/2
          </h3>
          
          {/* Manual Coordinator Addition */}
          <div className="mb-4 p-4 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Add Coordinator Manually</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <input
                value={coordinatorName}
                onChange={(e) => setCoordinatorName(e.target.value)}
                placeholder="Coordinator Name *"
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                value={coordinatorEmail}
                onChange={(e) => setCoordinatorEmail(e.target.value)}
                placeholder="Email *"
                type="email"
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                value={coordinatorPhone}
                onChange={(e) => setCoordinatorPhone(e.target.value)}
                placeholder="Phone (optional)"
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={addCoordinator} 
                disabled={!coordinatorName.trim() || !coordinatorEmail.trim() || coordinators.length >= 2}
              >
                Add Coordinator
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => {
                  setCoordinatorName('');
                  setCoordinatorEmail('');
                  setCoordinatorPhone('');
                }}
              >
                Clear
              </Button>
            </div>
          </div>

          {coordinators.length > 0 && (
            <div className="space-y-2">
              {coordinators.map((coordinator, index) => (
                <div key={coordinator.id} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <span className="font-medium text-purple-900">{coordinator.name}</span>
                      <span className="text-purple-700 ml-2">({coordinator.email})</span>
                      {coordinator.phone && <span className="text-purple-600 ml-2">- {coordinator.phone}</span>}
                    </div>
                  </div>
                  <Button variant="danger" className="text-sm px-3 py-1" onClick={() => removeCoordinator(coordinator.id)}>
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}

          {coordinators.length === 0 && (
            <div className="text-center py-4 text-gray-500">
              No coordinators selected. Select students above or add manually.
            </div>
          )}
        </div>

        {/* Email Configuration Section - Only show for new batches */}
        {!batch && (
          <div className="mt-8 p-6 bg-yellow-50 rounded-lg border border-yellow-200">
            <h3 className="text-lg font-semibold text-yellow-900 mb-4">
              📧 Student Login Emails
            </h3>
            
            <div className="flex items-center space-x-3 mb-4">
              <input
                type="checkbox"
                id="sendEmails"
                checked={sendEmails}
                onChange={(e) => setSendEmails(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="sendEmails" className="text-sm font-medium text-yellow-800">
                Send login credentials to students via email
              </label>
            </div>
            
            {sendEmails && (
              <div className="text-sm text-yellow-700 space-y-2">
                <p>When enabled, the system will:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Create student accounts with temporary passwords</li>
                  <li>Send professional login emails with credentials</li>
                  <li>Include batch information and login instructions</li>
                  <li>Provide a direct link to the login page</li>
                </ul>
                
                {!isEmailServiceConfigured() && (
                  <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded text-red-700">
                    <strong>⚠️ Email service not configured.</strong> Please set up EmailJS environment variables to enable email sending.
                  </div>
                )}
              </div>
            )}
            
            {emailStatus && (
              <div className="mt-4 p-3 bg-blue-100 border border-blue-300 rounded text-blue-700">
                <strong>Email Status:</strong> {emailStatus.success} sent successfully, {emailStatus.failed} failed
                {emailStatus.errors.length > 0 && (
                  <details className="mt-2">
                    <summary className="cursor-pointer font-medium">View errors</summary>
                    <ul className="mt-1 text-xs space-y-1">
                      {emailStatus.errors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            )}
          </div>
        )}

        <div className="mt-8 flex justify-end space-x-4">
          <Button variant="danger" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={!canSave || isSaving || isSendingEmails}
            onClick={handleSave}
          >
            {isSendingEmails ? 'Sending Emails...' : isSaving ? 'Saving...' : (batch ? 'Update Batch' : 'Create Batch')}
          </Button>
        </div>
      </div>
    </div>
  );
}
