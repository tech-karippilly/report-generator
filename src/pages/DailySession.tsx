import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db, isFirebaseConfigured } from "../firebase";
import type { Batch } from "../types";
import Button from "../components/Button";
import Alert from "../components/Alert";
import { buildDailySessionText } from "../utils/formatDailySession";

function todayISO(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function DailySessionPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");
  const [dateISO, setDateISO] = useState<string>(todayISO());
  const [startTime, setStartTime] = useState<string>("10:00");
  const [endTime, setEndTime] = useState<string>("11:00");
  const [timezone, setTimezone] = useState<string>("Asia/Kolkata");
  const [meetUrl, setMeetUrl] = useState<string>("");
  const [greeting, setGreeting] = useState<string>("Good Morning Colleagues!");

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

  const canGenerate = useMemo(
    () => Boolean(selectedBatch) && !!meetUrl && !!dateISO && !!startTime && !!endTime,
    [selectedBatch, meetUrl, dateISO, startTime, endTime]
  );

  const preview = useMemo(() => {
    if (!selectedBatch) return "";
    return buildDailySessionText({
      dateISO, startTime, endTime, timezone, meetUrl, batch: selectedBatch, greeting,
    });
  }, [selectedBatch, dateISO, startTime, endTime, timezone, meetUrl, greeting]);

  if (!isFirebaseConfigured) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Daily Session</h2>
        <Alert tone="warning">Create a .env.local with your VITE_FIREBASE_* values, then restart the dev server.</Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Daily Session</h2>
      <div className="grid gap-4">
        <label className="grid gap-1">
          <span className="text-sm text-gray-700">Batch</span>
          <select className="w-full border rounded-md px-3 py-2" value={selectedBatchId} onChange={(e) => setSelectedBatchId(e.target.value)}>
            <option value="">Select batch…</option>
            {batches.map((b) => <option key={b.id} value={b.id}>{b.code}</option>)}
          </select>
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <label className="grid gap-1">
            <span className="text-sm text-gray-700">Date</span>
            <input className="w-full border rounded-md px-3 py-2" type="date" value={dateISO} onChange={(e) => setDateISO(e.target.value)} />
          </label>
          <label className="grid gap-1">
            <span className="text-sm text-gray-700">Start time</span>
            <input className="w-full border rounded-md px-3 py-2" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </label>
          <label className="grid gap-1">
            <span className="text-sm text-gray-700">End time</span>
            <input className="w-full border rounded-md px-3 py-2" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          </label>
        </div>

        <label className="grid gap-1">
          <span className="text-sm text-gray-700">Time zone</span>
          <input className="w-full border rounded-md px-3 py-2" value={timezone} onChange={(e) => setTimezone(e.target.value)} />
        </label>

        <label className="grid gap-1">
          <span className="text-sm text-gray-700">Meet link</span>
          <input className="w-full border rounded-md px-3 py-2" value={meetUrl} onChange={(e) => setMeetUrl(e.target.value)} />
        </label>

        <label className="grid gap-1">
          <span className="text-sm text-gray-700">Greeting (optional)</span>
          <input className="w-full border rounded-md px-3 py-2" value={greeting} onChange={(e) => setGreeting(e.target.value)} />
        </label>

        <div className="flex gap-2 flex-wrap">
          <Button variant="primary" disabled={!canGenerate} onClick={() => preview && navigator.clipboard.writeText(preview)}>Copy Text</Button>
        </div>

        {preview && (
          <pre className="whitespace-pre-wrap bg-gray-50 p-3 rounded-md">{preview}</pre>
        )}
      </div>
    </div>
  );
}


