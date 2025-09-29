import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import type { Batch, SessionReport, OtherBatchStudent, CombinedSessionStudent } from "../types";
import { db, isFirebaseConfigured } from "../firebase";
import { buildWhatsappReportText } from "../utils/formatReport";
import { useAuth } from "../contexts/AuthContext";
import Button from "../components/Button";
import Alert from "../components/Alert";
import Papa from "papaparse";

function todayISO(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function AutomatedSessionReportPage() {
  const { currentUser } = useAuth();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [isProcessingCsv, setIsProcessingCsv] = useState(false);
  const [matchingResults, setMatchingResults] = useState<{
    matched: Array<{participant: any, student: any, confidence: number, matchType: string}>;
    unmatched: any[];
    unmatchedStudents: any[];
  } | null>(null);
  const [presentIds, setPresentIds] = useState<string[]>([]);
  const [alternativeSessionIds, setAlternativeSessionIds] = useState<string[]>([]);
  const [dateISO, setDateISO] = useState<string>(todayISO());
  const [activityTitle, setActivityTitle] = useState<string>("Today's Activity – Roleplay");
  const [activityDescription, setActivityDescription] = useState<string>("");
  const [tldvUrl, setTldvUrl] = useState<string>("");
  const [meetUrl, setMeetUrl] = useState<string>("");
  const [meetListUrl, setMeetListUrl] = useState<string>("");
  const [reportedBy, setReportedBy] = useState<string>("");
  const [alertMsg, setAlertMsg] = useState("");
  const [alertTone, setAlertTone] = useState<"success" | "error" | "info" | "warning">("info");
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');

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

  // Set reportedBy from logged-in user
  useEffect(() => {
    if (currentUser && !reportedBy) {
      // Use displayName if available, otherwise use email
      const userName = currentUser.displayName || currentUser.email?.split('@')[0] || 'Unknown User';
      setReportedBy(userName);
    }
  }, [currentUser, reportedBy]);

  // Reset attendance when batch changes
  useEffect(() => {
    if (selectedBatch) {
      setPresentIds([]);
      setAlternativeSessionIds([]);
    }
  }, [selectedBatchId]);

  // Set default meet URL when batch changes
  useEffect(() => {
    if (selectedBatch?.defaultMeetUrl && !meetUrl) {
      setMeetUrl(selectedBatch.defaultMeetUrl);
    }
  }, [selectedBatch?.defaultMeetUrl]);

  const toggleStudent = (studentId: string, status: 'present' | 'alternative_session') => {
    if (status === 'present') {
      // Toggle present status
      setPresentIds((prev) =>
        prev.includes(studentId) 
          ? prev.filter((id) => id !== studentId) 
          : [...prev, studentId]
      );
      // Remove from alternative session if present
      setAlternativeSessionIds((prev) => prev.filter((id) => id !== studentId));
    } else if (status === 'alternative_session') {
      // Toggle alternative session status
      setAlternativeSessionIds((prev) =>
        prev.includes(studentId) 
          ? prev.filter((id) => id !== studentId) 
          : [...prev, studentId]
      );
      // Remove from present if attending alternative session
      setPresentIds((prev) => prev.filter((id) => id !== studentId));
    }
  };

  const markAbsent = (studentId: string) => {
    setPresentIds((prev) => prev.filter((id) => id !== studentId));
    setAlternativeSessionIds((prev) => prev.filter((id) => id !== studentId));
  };

  // Report Preview Function - Same format as SessionReport
  const generateReportPreview = () => {
    if (!selectedBatch) return "";

    const absent = selectedBatch.students
      .filter((s) => !presentIds.includes(s.id) && !alternativeSessionIds.includes(s.id))
      .map((s) => s.id);

    const presentNames = selectedBatch.students
      .filter((s) => presentIds.includes(s.id))
      .map((s) => s.name);

    const anotherSessionNames = selectedBatch.students
      .filter((s) => alternativeSessionIds.includes(s.id))
      .map((s) => s.name);

    const absentNames = selectedBatch.students
      .filter((s) => absent.includes(s.id))
      .map((s) => s.name);

    const trainerNames = selectedBatch.trainers.map(t => t.name).join(" , ");

    const lines: string[] = [];
    lines.push(`Communication Session Report`);
    lines.push(`-------------------------------------`);
    lines.push(`Batch: ${selectedBatch.code}${selectedBatch.groupName ? ` - ${selectedBatch.groupName}` : ''}`);
    lines.push(`📅 Date: ${new Date(dateISO).toLocaleDateString("en-GB")}`);
    lines.push(`--------------------------------------------`);
    lines.push(`Trainers:- ${trainerNames}.`);
    lines.push("");
    lines.push(`Coordinators :`);
    selectedBatch.coordinators.forEach((c, i) => lines.push(`${i + 1}.\t${c.name}`));
    lines.push(` ---------------------------------`);
    if (tldvUrl) lines.push(`📌 Tldv link: ${tldvUrl}`);
    if (meetUrl) lines.push(`🔗 Session Link: ${meetUrl}`);
    if (meetListUrl) lines.push(`📋 Meet List Link: ${meetListUrl}`);
    lines.push("");
    lines.push(` 📝 Report:`);
    lines.push("");
    lines.push(activityTitle);
    if (activityDescription) {
      lines.push("");
      lines.push(activityDescription);
    }
    lines.push("");
    lines.push(`✅ Present :(${presentNames.length})`);
    lines.push(`---------------------------`);
    presentNames.forEach((name, index) => lines.push(`${index + 1}.\t${name}`));
    lines.push("");
    
    if (anotherSessionNames.length > 0) {
      lines.push(`🔄 Attending Another Session (${anotherSessionNames.length})`);
      lines.push(`----------------------------------------`);
      anotherSessionNames.forEach((name, index) => lines.push(`${index + 1}.\t${name}`));
      lines.push("");
    }
    
    lines.push(`❌ Absentees (${absentNames.length})`);
    lines.push(`-------------------`);
    absentNames.forEach((name, index) => lines.push(`${index + 1}.\t${name}`));
    lines.push("");
    lines.push(`-------------------------------`);
    lines.push(`🖊reported by : ${reportedBy}`);
    
    return lines.join("\n");
  };

  // Copy and WhatsApp Functions
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setAlertMsg("Report copied to clipboard!");
      setAlertTone("success");
      setTimeout(() => setAlertMsg(""), 3000);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      setAlertMsg("Failed to copy to clipboard. Please try again.");
      setAlertTone("error");
      setTimeout(() => setAlertMsg(""), 3000);
    }
  };

  const openWhatsApp = (text: string) => {
    // Use the specific WhatsApp group link
    const groupLink = 'https://chat.whatsapp.com/G9GQeOnI0XHEwDsNriWGNS';
    const whatsappUrl = `${groupLink}?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleCopyAndOpenWhatsApp = async () => {
    const reportText = generateReportPreview();
    try {
      await copyToClipboard(reportText);
      openWhatsApp(reportText);
    } catch (error) {
      console.error("Error in copy and WhatsApp:", error);
      openWhatsApp(reportText);
    }
  };

  const handleCopyOnly = async () => {
    const reportText = generateReportPreview();
    await copyToClipboard(reportText);
  };

  // CSV Processing Functions
  const handleCsvFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const allowedTypes = ['text/csv', 'application/csv', 'text/plain'];
      const fileName = file.name.toLowerCase();
      const isCsvFile = allowedTypes.includes(file.type) || fileName.endsWith('.csv');
      
      if (isCsvFile) {
        setCsvFile(file);
        setAlertMsg(`CSV file "${file.name}" selected successfully.`);
        setAlertTone("success");
        setTimeout(() => setAlertMsg(""), 3000);
      } else {
        setAlertMsg("Please select a valid CSV file (.csv)");
        setAlertTone("error");
        setTimeout(() => setAlertMsg(""), 3000);
      }
    }
  };

  const removeCsvFile = () => {
    setCsvFile(null);
    setCsvData([]);
    setMatchingResults(null);
    const fileInput = document.getElementById('csvFile') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  // Name matching functions
  const normalizeName = (name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, '') // Remove special characters
      .replace(/\s+/g, ' '); // Normalize spaces
  };

  const getFirstName = (name: string): string => {
    const normalized = normalizeName(name);
    return normalized.split(' ')[0];
  };

  const levenshteinDistance = (str1: string, str2: string): number => {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  };

  const calculateSimilarity = (str1: string, str2: string): number => {
    const distance = levenshteinDistance(str1, str2);
    const maxLength = Math.max(str1.length, str2.length);
    return maxLength === 0 ? 1 : 1 - (distance / maxLength);
  };

  const compareNames = (participantName: string, studentName: string) => {
    const normalizedParticipant = normalizeName(participantName);
    const normalizedStudent = normalizeName(studentName);

    // Exact match
    if (normalizedParticipant === normalizedStudent) {
      return { confidence: 1.0, matchType: 'exact' };
    }

    // First name match
    const participantFirstName = getFirstName(participantName);
    const studentFirstName = getFirstName(studentName);
    if (participantFirstName === studentFirstName && participantFirstName.length > 2) {
      return { confidence: 0.9, matchType: 'first_name' };
    }

    // Partial match
    if (normalizedStudent.includes(participantFirstName) && participantFirstName.length > 2) {
      return { confidence: 0.8, matchType: 'partial' };
    }
    if (normalizedParticipant.includes(studentFirstName) && studentFirstName.length > 2) {
      return { confidence: 0.8, matchType: 'partial' };
    }

    // Fuzzy match
    const similarity = calculateSimilarity(normalizedParticipant, normalizedStudent);
    if (similarity > 0.6) {
      return { confidence: similarity, matchType: 'fuzzy' };
    }

    return null;
  };

  const matchParticipantsWithStudents = (participants: any[], students: any[]) => {
    const matched: Array<{participant: any, student: any, confidence: number, matchType: string}> = [];
    const unmatched: any[] = [];
    const usedStudentIds = new Set<string>();

    participants.forEach(participant => {
      let bestMatch = null;
      let bestConfidence = 0;

      students.forEach(student => {
        if (usedStudentIds.has(student.id)) return;
        
        const match = compareNames(participant.fullName || participant.name || '', student.name);
        if (match && match.confidence > bestConfidence) {
          bestMatch = { ...match, student };
          bestConfidence = match.confidence;
        }
      });

      if (bestMatch && bestConfidence > 0.6) {
        matched.push({
          participant,
          student: bestMatch.student,
          confidence: bestMatch.confidence,
          matchType: bestMatch.matchType
        });
        usedStudentIds.add(bestMatch.student.id);
      } else {
        unmatched.push(participant);
      }
    });

    const unmatchedStudents = students.filter(student => !usedStudentIds.has(student.id));

    return { matched, unmatched, unmatchedStudents };
  };

  const parseMeetingData = (csvString: string) => {
    const lines = csvString.split('\n').map(line => line.trim()).filter(line => line !== '');
    const headerIndex = lines.findIndex(line => line.startsWith('"Full Name","First Seen","Time in Call"'));
    
    const metadata: { [key: string]: string } = {};
    for (let i = 0; i < headerIndex; i++) {
      const match = lines[i].match(/"\* Meet","(.*)"/);
      if (match && match[1]) {
        metadata[match[1].trim()] = match[1].trim();
      }
    }
    
    const dataLines = lines.slice(headerIndex).join('\n');
    const results = Papa.parse(dataLines, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.trim().replace(/^"|"$/g, ''),
      transform: (value: string) => value.trim().replace(/^"|"$/g, '')
    });
    
    const participants = results.data.map((row: any) => ({
      fullName: row["Full Name"],
      firstSeen: row["First Seen"],
      timeInCall: row["Time in Call"]
    }));
    
    return { metadata, participants };
  };

  const processCsvFile = async () => {
    if (!csvFile || !selectedBatch) return;

    setIsProcessingCsv(true);
    setAlertMsg("Processing CSV file...");
    setAlertTone("info");

    try {
      const text = await csvFile.text();
      const parsedData = parseMeetingData(text);
      
      console.log('=== PARTICIPANTS LIST ===');
      console.log('Participants:', parsedData.participants);
      console.log('========================');
      
      setCsvData(parsedData.participants);
      
      console.log('=== STUDENTS LIST FOR SELECTED BATCH ===');
      console.log('Batch:', selectedBatch.code);
      console.log('Students:', selectedBatch.students);
      console.log('========================================');
      
      const matchingResults = matchParticipantsWithStudents(parsedData.participants, selectedBatch.students);
      setMatchingResults(matchingResults);
      
      // Auto-mark students as present if confidence is 90% or higher
      const highConfidenceMatches = matchingResults.matched.filter(match => match.confidence >= 0.9);
      const autoPresentIds = highConfidenceMatches.map(match => match.student.id);
      setPresentIds(autoPresentIds);
      
      let message = `CSV processed successfully! Found ${matchingResults.matched.length} matched participants.`;
      if (highConfidenceMatches.length > 0) {
        message += ` ${highConfidenceMatches.length} students automatically marked as present (90%+ confidence).`;
      }
      if (matchingResults.unmatched.length > 0) {
        message += ` ${matchingResults.unmatched.length} participants couldn't be matched.`;
        setAlertTone("warning");
      } else {
        setAlertTone("success");
      }
      
      setAlertMsg(message);
      setTimeout(() => setAlertMsg(""), 8000);
    } catch (error) {
      console.error("Error processing CSV file:", error);
      setAlertMsg("Error processing CSV file. Please check the format.");
      setAlertTone("error");
      setTimeout(() => setAlertMsg(""), 5000);
    } finally {
      setIsProcessingCsv(false);
    }
  };

  const parseJoinTime = (timeStr: string): Date | null => {
    if (!timeStr) return null;
    
    try {
      const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)/i);
      if (timeMatch) {
        const [, hours, minutes, seconds = '0', period] = timeMatch;
        let hour24 = parseInt(hours);
        
        if (period.toUpperCase() === 'PM' && hour24 !== 12) {
          hour24 += 12;
        } else if (period.toUpperCase() === 'AM' && hour24 === 12) {
          hour24 = 0;
        }
        
        const joinTime = new Date();
        joinTime.setHours(hour24, parseInt(minutes), parseInt(seconds), 0);
        return joinTime;
      }
      
      return null;
    } catch (error) {
      console.error('Error parsing time:', error);
      return null;
    }
  };

  if (!isFirebaseConfigured) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Setup required</h2>
        <Alert tone="warning">Create a .env.local with your VITE_FIREBASE_* values, then restart the dev server.</Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gray-50 p-4">
      <div className="w-full max-w-7xl mx-auto">
        <div className="space-y-6">
          {alertMsg && <Alert tone={alertTone}>{alertMsg}</Alert>}

          <div className="bg-white rounded-lg shadow-md p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Automated Session Report</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Controls */}
              <div className="space-y-6">
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
                    placeholder="Today's Activity – Roleplay"
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
                    placeholder="Describe the activity..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* TLdV URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    TLdV URL
                  </label>
                  <input 
                    value={tldvUrl} 
                    onChange={(e) => setTldvUrl(e.target.value)} 
                    placeholder="https://tldv.io/..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Meet URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meet URL
                  </label>
                  <input 
                    value={meetUrl} 
                    onChange={(e) => setMeetUrl(e.target.value)} 
                    placeholder="https://meet.google.com/..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Meet List URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meet List URL
                  </label>
                  <input 
                    value={meetListUrl} 
                    onChange={(e) => setMeetListUrl(e.target.value)} 
                    placeholder="https://docs.google.com/spreadsheets/..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* CSV File Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meeting Participants CSV
                  </label>
                  <div className="space-y-3">
                    <input
                      id="csvFile"
                      type="file"
                      accept=".csv"
                      onChange={handleCsvFileUpload}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {csvFile && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <span className="text-green-600">📄</span>
                            <span className="text-sm font-medium text-green-800">{csvFile.name}</span>
                            <span className="text-xs text-green-600">
                              ({(csvFile.size / 1024).toFixed(1)} KB)
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={removeCsvFile}
                            className="text-red-500 hover:text-red-700 text-sm font-medium"
                          >
                            Remove
                          </button>
                        </div>
                        
                        {selectedBatch && (
                          <Button
                            onClick={processCsvFile}
                            disabled={isProcessingCsv}
                            className="w-full px-4 py-2 text-sm"
                          >
                            {isProcessingCsv ? 'Processing...' : 'Process CSV & Show Results'}
                          </Button>
                        )}
                        
                        {matchingResults && (
                          <div className="space-y-2">
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <div className="text-sm text-blue-800">
                                <strong>Matching Results:</strong> {matchingResults.matched.length} matched, {matchingResults.unmatched.length} unmatched
                              </div>
                            </div>
                            
                            {matchingResults.matched.length > 0 && (
                              <details className="p-2 bg-gray-50 border border-gray-200 rounded text-xs">
                                <summary className="cursor-pointer font-medium text-gray-700">View Matched Participants</summary>
                                <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                                  {matchingResults.matched.map((match, index) => {
                                    const isAutoPresent = match.confidence >= 0.9;
                                    return (
                                      <div key={index} className="text-gray-600">
                                        <span className="font-medium">"{match.participant.fullName}"</span> →
                                        <span className="font-medium"> "{match.student.name}"</span>
                                        <span className={`ml-2 ${isAutoPresent ? 'text-green-600 font-bold' : 'text-blue-600'}`}>
                                          ({match.matchType} - {(match.confidence * 100).toFixed(0)}%)
                                          {isAutoPresent && ' ✅ AUTO-PRESENT'}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </details>
                            )}
                            
                            {matchingResults.unmatched.length > 0 && (
                              <details className="p-2 bg-gray-50 border border-gray-200 rounded text-xs">
                                <summary className="cursor-pointer font-medium text-gray-700">View Unmatched Participants</summary>
                                <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                                  {matchingResults.unmatched.map((participant, index) => (
                                    <div key={index} className="text-gray-600">
                                      <span className="font-medium">"{participant.fullName}"</span>
                                    </div>
                                  ))}
                                </div>
                              </details>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
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
              </div>

              {/* Right Column - Report Preview */}
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Preview</h3>
                  {selectedBatch ? (
                    <div className="bg-white rounded border p-4 max-h-96 overflow-y-auto">
                      <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
                        {generateReportPreview()}
                      </pre>
                    </div>
                  ) : (
                    <div className="text-gray-500 text-sm italic">
                      Select a batch to see report preview
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                {selectedBatch && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
                    <div className="space-y-3">
                      <Button 
                        onClick={handleCopyOnly}
                        className="w-full"
                      >
                        Copy Report
                      </Button>
                      <Button 
                        onClick={handleCopyAndOpenWhatsApp}
                        variant="secondary"
                        className="w-full"
                      >
                        Copy & Send to Group
                      </Button>
                      <div className="text-xs text-gray-500 text-center">
                        📱 Will open WhatsApp group: TEAM 2 BCR69
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Attendance Section - Manual Editing */}
          {selectedBatch && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Attendance ({presentIds.length} present, {alternativeSessionIds.length} alternative session, {selectedBatch.students.length - presentIds.length - alternativeSessionIds.length} absent)
                  </h3>
                  <div className="text-sm text-gray-500 mt-1">
                    💡 Students with 90%+ confidence are auto-marked as present
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">View:</span>
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode('cards')}
                      className={`px-3 py-1 text-xs rounded transition-colors ${
                        viewMode === 'cards' 
                          ? 'bg-white text-gray-900 shadow-sm' 
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Cards
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`px-3 py-1 text-xs rounded transition-colors ${
                        viewMode === 'list' 
                          ? 'bg-white text-gray-900 shadow-sm' 
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      List
                    </button>
                  </div>
                </div>
              </div>

              {viewMode === 'cards' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-80 overflow-y-auto">
                  {selectedBatch.students.map((s) => {
                    const isPresent = presentIds.includes(s.id);
                    const isAlternativeSession = alternativeSessionIds.includes(s.id);
                    const isAbsent = !isPresent && !isAlternativeSession;
                    
                    return (
                      <div key={s.id} className={`p-3 rounded-lg border-2 transition-all ${
                        isPresent 
                          ? 'bg-green-50 border-green-200 shadow-md' 
                          : isAlternativeSession
                          ? 'bg-blue-50 border-blue-200 shadow-md'
                          : 'bg-gray-50 border-gray-200 hover:shadow-md'
                      }`}>
                        <div className="mb-3">
                          <div className="font-medium text-gray-900 text-sm truncate">{s.name}</div>
                          <div className="text-xs text-gray-500 truncate">{s.email}</div>
                        </div>
                        <div className="mb-2">
                          {isPresent && (
                            <span className="inline-block px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                              ✅ Present
                            </span>
                          )}
                          {isAlternativeSession && (
                            <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                              🔄 Alternative Session
                            </span>
                          )}
                          {isAbsent && (
                            <span className="inline-block px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                              ❌ Absent
                            </span>
                          )}
                        </div>
                        <div className="space-y-1">
                          <button
                            onClick={() => toggleStudent(s.id, 'present')}
                            className={`w-full px-2 py-1 text-xs rounded border transition-colors ${
                              isPresent 
                                ? 'bg-green-500 text-white border-green-500' 
                                : 'bg-white text-green-600 border-green-300 hover:bg-green-50'
                            }`}
                          >
                            {isPresent ? '✓ Present' : 'Mark Present'}
                          </button>
                          <button
                            onClick={() => toggleStudent(s.id, 'alternative_session')}
                            className={`w-full px-2 py-1 text-xs rounded border transition-colors ${
                              isAlternativeSession 
                                ? 'bg-blue-500 text-white border-blue-500' 
                                : 'bg-white text-blue-600 border-blue-300 hover:bg-blue-50'
                            }`}
                          >
                            {isAlternativeSession ? '✓ Alt Session' : 'Alt Session'}
                          </button>
                          <button
                            onClick={() => markAbsent(s.id)}
                            className={`w-full px-2 py-1 text-xs rounded border transition-colors ${
                              isAbsent 
                                ? 'bg-red-500 text-white border-red-500' 
                                : 'bg-white text-red-600 border-red-300 hover:bg-red-50'
                            }`}
                          >
                            {isAbsent ? '✓ Absent' : 'Mark Absent'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto">
                  <div className="space-y-2">
                    {selectedBatch.students.map((s) => {
                      const isPresent = presentIds.includes(s.id);
                      const isAlternativeSession = alternativeSessionIds.includes(s.id);
                      const isAbsent = !isPresent && !isAlternativeSession;
                      
                      return (
                        <div key={s.id} className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                          isPresent 
                            ? 'bg-green-50 border-green-200' 
                            : isAlternativeSession
                            ? 'bg-blue-50 border-blue-200'
                            : 'bg-gray-50 border-gray-200'
                        }`}>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 text-sm truncate">{s.name}</div>
                            <div className="text-xs text-gray-500 truncate">{s.email}</div>
                          </div>
                          <div className="flex items-center gap-2 ml-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              isPresent 
                                ? 'bg-green-100 text-green-800'
                                : isAlternativeSession
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {isPresent ? '✅ Present' : isAlternativeSession ? '🔄 Alt Session' : '❌ Absent'}
                            </span>
                            <div className="flex gap-1">
                              <button
                                onClick={() => toggleStudent(s.id, 'present')}
                                className={`px-2 py-1 text-xs rounded border transition-colors ${
                                  isPresent 
                                    ? 'bg-green-500 text-white border-green-500' 
                                    : 'bg-white text-green-600 border-green-300 hover:bg-green-50'
                                }`}
                              >
                                P
                              </button>
                              <button
                                onClick={() => toggleStudent(s.id, 'alternative_session')}
                                className={`px-2 py-1 text-xs rounded border transition-colors ${
                                  isAlternativeSession 
                                    ? 'bg-blue-500 text-white border-blue-500' 
                                    : 'bg-white text-blue-600 border-blue-300 hover:bg-blue-50'
                                }`}
                              >
                                A
                              </button>
                              <button
                                onClick={() => markAbsent(s.id)}
                                className={`px-2 py-1 text-xs rounded border transition-colors ${
                                  isAbsent 
                                    ? 'bg-red-500 text-white border-red-500' 
                                    : 'bg-white text-red-600 border-red-300 hover:bg-red-50'
                                }`}
                              >
                                X
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
