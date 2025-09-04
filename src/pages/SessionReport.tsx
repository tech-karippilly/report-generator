import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import type { Batch, SessionReport, OtherBatchStudent, CombinedSessionStudent } from "../types";
import { db, isFirebaseConfigured } from "../firebase";
import { buildWhatsappReportText } from "../utils/formatReport";
import { useAuth } from "../contexts/AuthContext";
import Button from "../components/Button";
import Alert from "../components/Alert";

function todayISO(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function SessionReportPage() {
  const { currentUser } = useAuth();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [dateISO, setDateISO] = useState<string>(todayISO());
  const [activityTitle, setActivityTitle] = useState<string>("Today's Activity – Roleplay");
  const [activityDescription, setActivityDescription] = useState<string>("");
  const [tldvUrl, setTldvUrl] = useState<string>("");
  const [meetUrl, setMeetUrl] = useState<string>("");
  const [reportedBy, setReportedBy] = useState<string>("");
  const [presentIds, setPresentIds] = useState<string[]>([]);
  const [anotherSessionIds, setAnotherSessionIds] = useState<string[]>([]);
  const [otherBatchStudents, setOtherBatchStudents] = useState<OtherBatchStudent[]>([]);
  const [combinedSessionStudents, setCombinedSessionStudents] = useState<CombinedSessionStudent[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [alertMsg, setAlertMsg] = useState("");
  const [alertTone, setAlertTone] = useState<"success" | "error" | "info" | "warning">("info");
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  
  // Form for adding other batch students
  const [otherStudentName, setOtherStudentName] = useState("");
  const [otherStudentBatch, setOtherStudentBatch] = useState("");
  
  // Form for adding combined session students
  const [combinedStudentName, setCombinedStudentName] = useState("");
  const [combinedStudentBatch, setCombinedStudentBatch] = useState("");
  const [combinedStudentGroup, setCombinedStudentGroup] = useState("");
  const [combinedStudentEmail, setCombinedStudentEmail] = useState("");
  const [combinedStudentPhone, setCombinedStudentPhone] = useState("");

  useEffect(() => {
    if (!isFirebaseConfigured || !db) return;
    const unsub = onSnapshot(collection(db, "batches"), (snap) => {
      const list: Batch[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      list.sort((a, b) => a.code.localeCompare(b.code));
      setBatches(list);
    });
    return () => unsub();
  }, []);

  // Set reportedBy from logged-in user
  useEffect(() => {
    if (currentUser && !reportedBy) {
      // Use displayName if available, otherwise use email
      const userName = currentUser.displayName || currentUser.email?.split('@')[0] || 'Unknown User';
      setReportedBy(userName);
    }
  }, [currentUser, reportedBy]);

  const selectedBatch = useMemo(
    () => batches.find((b) => b.id === selectedBatchId),
    [batches, selectedBatchId]
  );

  useEffect(() => {
    if (selectedBatch?.defaultMeetUrl && !meetUrl) {
      setMeetUrl(selectedBatch.defaultMeetUrl);
    }
  }, [selectedBatch?.defaultMeetUrl]);

  useEffect(() => {
    if (selectedBatch) {
      setPresentIds(selectedBatch.students.map((s) => s.id));
      setAnotherSessionIds([]);
      setOtherBatchStudents([]);
      setCombinedSessionStudents([]);
    } else {
      setPresentIds([]);
      setAnotherSessionIds([]);
      setOtherBatchStudents([]);
      setCombinedSessionStudents([]);
    }
  }, [selectedBatchId]);

  const canSave = useMemo(() => {
    return Boolean(selectedBatch) && dateISO && activityTitle.trim().length > 0;
  }, [selectedBatch, dateISO, activityTitle]);

  function toggleStudent(studentId: string, status: 'present' | 'another_session') {
    if (status === 'present') {
      // Toggle present status
      setPresentIds((prev) =>
        prev.includes(studentId) ? prev.filter((x) => x !== studentId) : [...prev, studentId]
      );
      // Remove from another session if present
      setAnotherSessionIds((prev) => prev.filter((x) => x !== studentId));
    } else if (status === 'another_session') {
      // Toggle another session status
      setAnotherSessionIds((prev) =>
        prev.includes(studentId) ? prev.filter((x) => x !== studentId) : [...prev, studentId]
      );
      // Remove from present if attending another session
      setPresentIds((prev) => prev.filter((x) => x !== studentId));
    }
  }

  const addOtherBatchStudent = () => {
    if (otherStudentName.trim() && otherStudentBatch.trim()) {
      const newStudent: OtherBatchStudent = {
        id: Date.now().toString(),
        name: otherStudentName.trim(),
        batchName: otherStudentBatch.trim()
      };
      setOtherBatchStudents(prev => [...prev, newStudent]);
      setOtherStudentName("");
      setOtherStudentBatch("");
    }
  };

  const removeOtherBatchStudent = (id: string) => {
    setOtherBatchStudents(prev => prev.filter(student => student.id !== id));
  };

  const addCombinedSessionStudent = () => {
    if (combinedStudentName.trim() && combinedStudentBatch.trim() && combinedStudentGroup.trim()) {
      const newStudent: CombinedSessionStudent = {
        id: Date.now().toString(),
        name: combinedStudentName.trim(),
        batchName: combinedStudentBatch.trim(),
        groupName: combinedStudentGroup.trim(),
        email: combinedStudentEmail.trim() || undefined,
        phone: combinedStudentPhone.trim() || undefined
      };
      setCombinedSessionStudents(prev => [...prev, newStudent]);
      setCombinedStudentName("");
      setCombinedStudentBatch("");
      setCombinedStudentGroup("");
      setCombinedStudentEmail("");
      setCombinedStudentPhone("");
    }
  };

  const removeCombinedSessionStudent = (id: string) => {
    setCombinedSessionStudents(prev => prev.filter(student => student.id !== id));
  };

  // WhatsApp helper functions
  const openWhatsApp = (text: string) => {
    const encodedText = encodeURIComponent(text);
    const whatsappUrl = `https://web.whatsapp.com/send?text=${encodedText}`;
    window.open(whatsappUrl, '_blank');
  };

  const copyAndOpenWhatsApp = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Small delay to ensure clipboard is updated
      setTimeout(() => {
        openWhatsApp(text);
      }, 100);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      // Still try to open WhatsApp even if clipboard fails
      openWhatsApp(text);
    }
  };

  async function handleSave() {
    if (!selectedBatch) return;
    
    try {
      setIsSaving(true);
      setAlertMsg("");
      
      const absent = selectedBatch.students
        .filter((s) => !presentIds.includes(s.id) && !anotherSessionIds.includes(s.id))
        .map((s) => s.id);
      
      const report: SessionReport = {
        id: "",
        batchId: selectedBatch.id,
        batchCode: selectedBatch.code,
        dateISO,
        activityTitle: activityTitle.trim(),
        activityDescription: activityDescription.trim() || undefined,
        presentStudentIds: presentIds,
        absenteeStudentIds: absent,
        anotherSessionStudentIds: anotherSessionIds,
        otherBatchStudents: otherBatchStudents,
        combinedSessionStudents: combinedSessionStudents,
        trainers: selectedBatch.trainers,
        coordinators: selectedBatch.coordinators,
        tldvUrl: tldvUrl.trim() || undefined,
        meetUrl: meetUrl.trim() || undefined,
        reportedBy: reportedBy.trim() || (selectedBatch.coordinators[0]?.name ?? ""),
        createdAt: Date.now(),
      };
      
      if (!db) return;
      const clean = <T extends { [k: string]: any }>(obj: T): T => {
        const out: any = {};
        Object.entries(obj).forEach(([k, v]) => {
          if (v !== undefined) out[k] = v;
        });
        return out as T;
      };
      
      const docRef = await addDoc(collection(db, "sessionReports"), clean({
        ...report,
        ts: serverTimestamp(),
      }));
      
      const text = buildWhatsappReportText(selectedBatch, { ...report, id: docRef.id });
      
      setAlertTone("success");
      setAlertMsg("Report saved! Opening WhatsApp...");
      
      // Copy to clipboard and open WhatsApp
      await copyAndOpenWhatsApp(text);
      
    } catch (error: any) {
      setAlertTone("error");
      setAlertMsg(`Failed to save report: ${error.message || "Please try again."}`);
    } finally {
      setIsSaving(false);
      setTimeout(() => setAlertMsg(""), 5000);
    }
  }

  const previewText = useMemo(() => {
    if (!selectedBatch) return "";
    const absent = selectedBatch.students
      .filter((s) => !presentIds.includes(s.id) && !anotherSessionIds.includes(s.id))
      .map((s) => s.id);
    return buildWhatsappReportText(selectedBatch, {
      id: "preview",
      batchId: selectedBatch.id,
      batchCode: selectedBatch.code,
      dateISO,
      activityTitle,
      activityDescription,
      presentStudentIds: presentIds,
      absenteeStudentIds: absent,
      anotherSessionStudentIds: anotherSessionIds,
      otherBatchStudents: otherBatchStudents,
      combinedSessionStudents: combinedSessionStudents,
      trainers: selectedBatch.trainers,
      coordinators: selectedBatch.coordinators,
      tldvUrl, meetUrl,
      reportedBy,
      createdAt: Date.now(),
    });
  }, [selectedBatch, dateISO, activityTitle, tldvUrl, meetUrl, reportedBy, presentIds, anotherSessionIds, otherBatchStudents, combinedSessionStudents]);

  if (!isFirebaseConfigured) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Setup required</h2>
        <Alert tone="warning">Create a .env.local with your VITE_FIREBASE_* values, then restart the dev server.</Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Session Report</h2>
      
      {alertMsg && <Alert tone={alertTone}>{alertMsg}</Alert>}

      <div className="max-w-4xl mx-auto">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Report Details</h3>
          <div className="bg-white rounded-lg shadow-sm border p-6 space-y-6">
            {/* Batch Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Batch *
              </label>
              <select 
                value={selectedBatchId} 
                onChange={(e) => setSelectedBatchId(e.target.value)} 
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Choose a batch...</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.code} {b.groupName && `- ${b.groupName}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Group Selection (if batch has groups) */}
            {selectedBatch && selectedBatch.groupName && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Group
                </label>
                <input 
                  type="text" 
                  value={selectedBatch.groupName} 
                  disabled
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                />
              </div>
            )}

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date *
              </label>
              <input 
                type="date" 
                value={dateISO} 
                onChange={(e) => setDateISO(e.target.value)} 
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Activity Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Activity Title *
              </label>
              <input 
                value={activityTitle} 
                onChange={(e) => setActivityTitle(e.target.value)} 
                placeholder="e.g., Today's Activity – Roleplay"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Activity Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Activity Description
              </label>
              <textarea 
                value={activityDescription} 
                onChange={(e) => setActivityDescription(e.target.value)} 
                rows={3}
                placeholder="Describe the activity details..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Meet Link */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meet Link
              </label>
              <input 
                value={meetUrl} 
                onChange={(e) => setMeetUrl(e.target.value)} 
                placeholder="https://meet.google.com/..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* TLDV Link */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                TLDV Link
              </label>
              <input 
                value={tldvUrl} 
                onChange={(e) => setTldvUrl(e.target.value)} 
                placeholder="https://tldv.io/..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Reported By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reported By *
              </label>
              <input 
                value={reportedBy} 
                onChange={(e) => setReportedBy(e.target.value)} 
                placeholder="Enter reporter name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Auto-filled with your name from your account
              </p>
            </div>

            {/* Attendance */}
            {selectedBatch && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Attendance ({presentIds.length} present, {anotherSessionIds.length} another session, {selectedBatch.students.length - presentIds.length - anotherSessionIds.length} absent)
                </label>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {selectedBatch.students.map((s) => {
                    const isPresent = presentIds.includes(s.id);
                    const isAnotherSession = anotherSessionIds.includes(s.id);
                    const isAbsent = !isPresent && !isAnotherSession;
                    
                    return (
                      <div key={s.id} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{s.name}</div>
                            <div className="text-sm text-gray-500">{s.email}</div>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            {isPresent && <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full">Present</span>}
                            {isAnotherSession && <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full">Another Session</span>}
                            {isAbsent && <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full">Absent</span>}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => toggleStudent(s.id, 'present')}
                            className={`px-3 py-1 text-xs rounded-md border transition-colors ${
                              isPresent 
                                ? 'bg-green-500 text-white border-green-500' 
                                : 'bg-white text-green-600 border-green-300 hover:bg-green-50'
                            }`}
                          >
                            Present
                          </button>
                          <button
                            onClick={() => toggleStudent(s.id, 'another_session')}
                            className={`px-3 py-1 text-xs rounded-md border transition-colors ${
                              isAnotherSession 
                                ? 'bg-blue-500 text-white border-blue-500' 
                                : 'bg-white text-blue-600 border-blue-300 hover:bg-blue-50'
                            }`}
                          >
                            Another Session
                          </button>
                          <button
                            onClick={() => {
                              setPresentIds(prev => prev.filter(id => id !== s.id));
                              setAnotherSessionIds(prev => prev.filter(id => id !== s.id));
                            }}
                            className={`px-3 py-1 text-xs rounded-md border transition-colors ${
                              isAbsent 
                                ? 'bg-red-500 text-white border-red-500' 
                                : 'bg-white text-red-600 border-red-300 hover:bg-red-50'
                            }`}
                          >
                            Absent
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Other Batch Students */}
            {selectedBatch && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Other Batch Students ({otherBatchStudents.length} added)
                </label>
                
                {/* Add Other Batch Student Form */}
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Student Name
                      </label>
                      <input
                        type="text"
                        value={otherStudentName}
                        onChange={(e) => setOtherStudentName(e.target.value)}
                        placeholder="Enter student name"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Batch Name
                      </label>
                      <input
                        type="text"
                        value={otherStudentBatch}
                        onChange={(e) => setOtherStudentBatch(e.target.value)}
                        placeholder="Enter batch name"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={addOtherBatchStudent}
                    disabled={!otherStudentName.trim() || !otherStudentBatch.trim()}
                    className="text-sm"
                  >
                    Add Student
                  </Button>
                </div>

                {/* Display Added Other Batch Students */}
                {otherBatchStudents.length > 0 && (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {otherBatchStudents.map((student) => (
                      <div key={student.id} className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{student.name}</div>
                          <div className="text-sm text-gray-600">({student.batchName})</div>
                        </div>
                        <button
                          onClick={() => removeOtherBatchStudent(student.id)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Combined Session Students */}
            {selectedBatch && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Combined Session Students ({combinedSessionStudents.length} added)
                </label>
                
                {/* Add Combined Session Student Form */}
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Student Name *
                      </label>
                      <input
                        type="text"
                        value={combinedStudentName}
                        onChange={(e) => setCombinedStudentName(e.target.value)}
                        placeholder="Enter student name"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Batch Name *
                      </label>
                      <input
                        type="text"
                        value={combinedStudentBatch}
                        onChange={(e) => setCombinedStudentBatch(e.target.value)}
                        placeholder="Enter batch name"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Group Name *
                      </label>
                      <input
                        type="text"
                        value={combinedStudentGroup}
                        onChange={(e) => setCombinedStudentGroup(e.target.value)}
                        placeholder="Enter group name"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Email (Optional)
                      </label>
                      <input
                        type="email"
                        value={combinedStudentEmail}
                        onChange={(e) => setCombinedStudentEmail(e.target.value)}
                        placeholder="Enter email address"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Phone (Optional)
                      </label>
                      <input
                        type="tel"
                        value={combinedStudentPhone}
                        onChange={(e) => setCombinedStudentPhone(e.target.value)}
                        placeholder="Enter phone number"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={addCombinedSessionStudent}
                    disabled={!combinedStudentName.trim() || !combinedStudentBatch.trim() || !combinedStudentGroup.trim()}
                    className="text-sm"
                  >
                    Add Student
                  </Button>
                </div>

                {/* Display Added Combined Session Students */}
                {combinedSessionStudents.length > 0 && (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {combinedSessionStudents.map((student) => (
                      <div key={student.id} className="flex items-center justify-between p-3 bg-purple-50 border border-purple-200 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{student.name}</div>
                          <div className="text-sm text-gray-600">
                            {student.batchName} • {student.groupName}
                            {student.email && ` • ${student.email}`}
                            {student.phone && ` • ${student.phone}`}
                          </div>
                        </div>
                        <button
                          onClick={() => removeCombinedSessionStudent(student.id)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button 
                variant="secondary" 
                onClick={() => setShowPreviewModal(true)}
                disabled={!previewText}
                className="flex-1"
              >
                Preview Report
              </Button>
              <Button 
                variant="primary" 
                disabled={!canSave || isSaving} 
                onClick={handleSave}
                className="flex-1"
              >
                {isSaving ? 'Saving...' : 'Save & Copy Report'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreviewModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setShowPreviewModal(false)}
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">WhatsApp Report Preview</h3>
              <div className="flex gap-2">
                <Button 
                  onClick={() => {
                    navigator.clipboard.writeText(previewText);
                    setShowPreviewModal(false);
                  }}
                  className="text-sm"
                >
                  Copy Only
                </Button>
                <Button 
                  onClick={() => {
                    copyAndOpenWhatsApp(previewText);
                    setShowPreviewModal(false);
                  }}
                  className="text-sm"
                >
                  Copy & Open WhatsApp
                </Button>
                <Button 
                  variant="danger" 
                  onClick={() => setShowPreviewModal(false)}
                  className="text-sm"
                >
                  Close
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-6">
              <pre className="whitespace-pre-wrap text-sm text-gray-700 bg-gray-50 p-4 rounded-lg border">
                {previewText}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


