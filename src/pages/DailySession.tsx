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

  useEffect(() => {
    if (selectedBatch?.defaultMeetUrl && !meetUrl) {
      setMeetUrl(selectedBatch.defaultMeetUrl);
    }
  }, [selectedBatch?.defaultMeetUrl]);

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
      <div className="min-h-screen p-4">
        <Alert tone="warning">Create a .env.local with your VITE_FIREBASE_* values, then restart the dev server.</Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gray-50 p-4">
      <div className="w-full max-w-7xl mx-auto">
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Form Fields */}
              <div className="space-y-4">
                <div className="space-y-4">
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

                  {/* Time Range */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Time *
                      </label>
                      <input 
                        type="time" 
                        value={startTime} 
                        onChange={(e) => setStartTime(e.target.value)} 
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        End Time *
                      </label>
                      <input 
                        type="time" 
                        value={endTime} 
                        onChange={(e) => setEndTime(e.target.value)} 
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Timezone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Timezone
                    </label>
                    <input 
                      value={timezone} 
                      onChange={(e) => setTimezone(e.target.value)} 
                      placeholder="e.g., Asia/Kolkata"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column - Links and Details */}
              <div className="space-y-4">
                {/* Meet Link */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meet Link *
                  </label>
                  <input 
                    value={meetUrl} 
                    onChange={(e) => setMeetUrl(e.target.value)} 
                    placeholder="https://meet.google.com/..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Greeting */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Greeting (Optional)
                  </label>
                  <input 
                    value={greeting} 
                    onChange={(e) => setGreeting(e.target.value)} 
                    placeholder="e.g., Good Morning Colleagues!"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  variant="primary" 
                  disabled={!canGenerate} 
                  onClick={() => preview && navigator.clipboard.writeText(preview)}
                  className="flex-1"
                >
                  Copy Text
                </Button>
              </div>
            </div>
          </div>

          {/* Preview Section */}
          {preview && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview</h3>
              <div className="max-h-96 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm text-gray-700 bg-gray-50 p-4 rounded-lg shadow-md leading-relaxed">{preview}</pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


