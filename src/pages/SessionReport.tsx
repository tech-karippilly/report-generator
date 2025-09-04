import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import type { Batch, SessionReport } from "../types";
import { db, isFirebaseConfigured } from "../firebase";
import { buildWhatsappReportText } from "../utils/formatReport";
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
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");
  const [dateISO, setDateISO] = useState<string>(todayISO());
  const [activityTitle, setActivityTitle] = useState<string>("Today's Activity  – Roleplay");
  const [tldvUrl, setTldvUrl] = useState<string>("");
  const [meetUrl, setMeetUrl] = useState<string>("");
  const [reportedBy, setReportedBy] = useState<string>("");
  const [presentIds, setPresentIds] = useState<string[]>([]);
  const [activityDescription, setActivityDescription] = useState<string>("");

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

  useEffect(() => {
    if (selectedBatch?.defaultMeetUrl && !meetUrl) {
      setMeetUrl(selectedBatch.defaultMeetUrl);
    }
  }, [selectedBatch?.defaultMeetUrl]);

  useEffect(() => {
    if (selectedBatch) {
      setPresentIds(selectedBatch.students.map((s) => s.id));
    } else {
      setPresentIds([]);
    }
  }, [selectedBatchId]);

  const canSave = useMemo(() => {
    return Boolean(selectedBatch) && dateISO && activityTitle.trim().length > 0;
  }, [selectedBatch, dateISO, activityTitle]);

  function toggleStudent(studentId: string) {
    setPresentIds((prev) =>
      prev.includes(studentId) ? prev.filter((x) => x !== studentId) : [...prev, studentId]
    );
  }

  async function handleSave() {
    if (!selectedBatch) return;
    const absent = selectedBatch.students
      .filter((s) => !presentIds.includes(s.id))
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
    navigator.clipboard.writeText(text).catch(() => {});
    alert("Report saved and copied to clipboard. Paste into WhatsApp.");
  }

  const previewText = useMemo(() => {
    if (!selectedBatch) return "";
    const absent = selectedBatch.students
      .filter((s) => !presentIds.includes(s.id))
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
      trainers: selectedBatch.trainers,
      coordinators: selectedBatch.coordinators,
      tldvUrl, meetUrl,
      reportedBy,
      createdAt: Date.now(),
    });
  }, [selectedBatch, dateISO, activityTitle, tldvUrl, meetUrl, reportedBy, presentIds]);

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
      <h2 className="text-xl font-semibold">Session Report</h2>
      <div className="grid gap-4">
        <label className="grid gap-1">
          <span className="text-sm text-gray-700">Batch</span>
          <select value={selectedBatchId} onChange={(e) => setSelectedBatchId(e.target.value)} className="w-full border rounded-md px-3 py-2">
            <option value="">Select batch…</option>
            {batches.map((b) => (
              <option key={b.id} value={b.id}>{b.code}</option>
            ))}
          </select>
        </label>

        <label className="grid gap-1">
          <span className="text-sm text-gray-700">Date</span>
          <input type="date" value={dateISO} onChange={(e) => setDateISO(e.target.value)} className="w-full border rounded-md px-3 py-2" />
        </label>

        <label className="grid gap-1">
          <span className="text-sm text-gray-700">Activity title</span>
          <input value={activityTitle} onChange={(e) => setActivityTitle(e.target.value)} className="w-full border rounded-md px-3 py-2" />
        </label>

        <label className="grid gap-1">
          <span className="text-sm text-gray-700">Activity description (optional)</span>
          <textarea value={activityDescription} onChange={(e) => setActivityDescription(e.target.value)} rows={3} className="w-full border rounded-md px-3 py-2" />
        </label>

        <label className="grid gap-1">
          <span className="text-sm text-gray-700">tldv link (optional)</span>
          <input value={tldvUrl} onChange={(e) => setTldvUrl(e.target.value)} className="w-full border rounded-md px-3 py-2" />
        </label>

        <label className="grid gap-1">
          <span className="text-sm text-gray-700">Meet link (optional)</span>
          <input value={meetUrl} onChange={(e) => setMeetUrl(e.target.value)} className="w-full border rounded-md px-3 py-2" />
        </label>

        <label className="grid gap-1">
          <span className="text-sm text-gray-700">Reported by</span>
          <input value={reportedBy} onChange={(e) => setReportedBy(e.target.value)} placeholder="Your name" className="w-full border rounded-md px-3 py-2" />
        </label>

        {selectedBatch && (
          <div>
            <strong>Attendance</strong>
            <div className="grid gap-2 mt-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))" }}>
              {selectedBatch.students.map((s) => (
                <label key={s.id} className="flex items-center gap-2 px-3 py-2 border rounded-md">
                  <input type="checkbox" checked={presentIds.includes(s.id)} onChange={() => toggleStudent(s.id)} />
                  <span>{s.name}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2 flex-wrap">
          <Button variant="primary" disabled={!canSave} onClick={handleSave}>Save & Copy Text</Button>
          {previewText && (
            <Button onClick={() => navigator.clipboard.writeText(previewText)}>Copy Preview</Button>
          )}
        </div>

        {previewText && (
          <pre className="whitespace-pre-wrap bg-gray-50 p-3 rounded-md">
            {previewText}
          </pre>
        )}
      </div>
    </div>
  );
}


