import { useEffect, useMemo, useState } from "react";
import { collection, addDoc, onSnapshot, serverTimestamp, doc, deleteDoc, updateDoc, deleteField } from "firebase/firestore";
import type { Batch, Person, Student } from "../types";
import { db, isFirebaseConfigured } from "../firebase";
import Button from "../components/Button";
import Alert from "../components/Alert";

function newId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export default function BatchesPage() {
  const [code, setCode] = useState("");
  const [defaultMeetUrl, setDefaultMeetUrl] = useState("");
  const [trainers, setTrainers] = useState<Person[]>([]);
  const [coordinators, setCoordinators] = useState<Person[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  const [trainerName, setTrainerName] = useState("");
  const [trainerPhone, setTrainerPhone] = useState("");
  const [coordName, setCoordName] = useState("");
  const [coordPhone, setCoordPhone] = useState("");
  const [studentName, setStudentName] = useState("");
  const [studentPhone, setStudentPhone] = useState("");
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isLoadingList, setIsLoadingList] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [alertMsg, setAlertMsg] = useState<string>("");
  const [alertTone, setAlertTone] = useState<"success"|"error"|"info"|"warning">("info");
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured || !db) return;
    const unsub = onSnapshot(
      collection(db, "batches"),
      (snap) => {
        const list: Batch[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
        list.sort((a, b) => b.createdAt - a.createdAt);
        setBatches(list);
        setIsLoadingList(false);
      },
      (err) => {
        setIsLoadingList(false);
        setAlertTone("error");
        setAlertMsg(`${(err as any)?.code ?? "error"}: ${(err as any)?.message ?? "Failed to load"}`);
      }
    );
    return () => unsub();
  }, []);

  const canSave = useMemo(
    () => code.trim().length > 0 && students.length > 0,
    [code, students]
  );

  async function handleSaveBatch() {
    if (!canSave) return;
    try {
      setIsSaving(true);
      setAlertMsg("");
      if (!db) return;
      const now = Date.now();
      const clean = <T extends { [k: string]: any }>(obj: T): T => {
        const out: any = {};
        Object.entries(obj).forEach(([k, v]) => {
          if (v !== undefined) out[k] = v;
        });
        return out as T;
      };
      const cleanPeople = (arr: { id: string; name: string; phone?: string }[]) =>
        arr.map(p => clean({ id: p.id, name: p.name, phone: p.phone }));

      if (editingId) {
        const payload: any = {
          code: code.trim(),
          trainers: cleanPeople(trainers),
          coordinators: cleanPeople(coordinators),
          students: cleanPeople(students),
          updatedAt: now,
          ts: serverTimestamp(),
        };
        if (defaultMeetUrl.trim()) payload.defaultMeetUrl = defaultMeetUrl.trim();
        else payload.defaultMeetUrl = deleteField();
        await updateDoc(doc(db, "batches", editingId), payload);
        setAlertTone("success");
        setAlertMsg("Batch updated successfully.");
      } else {
        await addDoc(collection(db, "batches"), clean({
          code: code.trim(),
          defaultMeetUrl: defaultMeetUrl.trim() || undefined,
          trainers: cleanPeople(trainers),
          coordinators: cleanPeople(coordinators),
          students: cleanPeople(students),
          createdAt: now,
          updatedAt: now,
          ts: serverTimestamp(),
        }));
        setAlertTone("success");
        setAlertMsg("Batch saved successfully.");
      }
      setCode("");
      setTrainers([]);
      setCoordinators([]);
      setStudents([]);
      setDefaultMeetUrl("");
      setEditingId(null);
    } catch (e) {
      setAlertTone("error");
      const code = (e as any)?.code ?? "error";
      const msg = (e as any)?.message ?? "Failed to save batch. Please try again.";
      setAlertMsg(`${code}: ${msg}`);
    } finally {
      setIsSaving(false);
      setTimeout(() => setAlertMsg(""), 3000);
    }
  }

  function beginEdit(b: Batch) {
    setEditingId(b.id);
    setCode(b.code);
    setDefaultMeetUrl(b.defaultMeetUrl ?? "");
    setTrainers(b.trainers);
    setCoordinators(b.coordinators);
    setStudents(b.students);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelEdit() {
    setEditingId(null);
    setCode("");
    setDefaultMeetUrl("");
    setTrainers([]);
    setCoordinators([]);
    setStudents([]);
  }

  function addTrainer() {
    const name = trainerName.trim();
    if (!name) return;
    const phone = trainerPhone.trim() || undefined;
    setTrainers((prev) => [...prev, { id: newId(), name, phone }]);
    setTrainerName("");
    setTrainerPhone("");
  }

  function addCoordinator() {
    const name = coordName.trim();
    if (!name) return;
    const phone = coordPhone.trim() || undefined;
    setCoordinators((prev) => [...prev, { id: newId(), name, phone }]);
    setCoordName("");
    setCoordPhone("");
  }

  function addStudent() {
    const name = studentName.trim();
    if (!name) return;
    const phone = studentPhone.trim() || undefined;
    setStudents((prev) => [...prev, { id: newId(), name, phone }]);
    setStudentName("");
    setStudentPhone("");
  }

  async function removeBatch(id: string) {
    if (!confirm("Delete this batch?")) return;
    if (!db) return;
    await deleteDoc(doc(db, "batches", id));
  }

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
      <h2 className="text-xl font-semibold">Batches</h2>
      {editingId && (
        <Alert tone="info">Editing existing batch. <button className="underline" onClick={cancelEdit}>Cancel</button></Alert>
      )}
      {alertMsg && <Alert tone={alertTone}>{alertMsg}</Alert>}
      <div className="grid gap-4">
        <label className="grid gap-1">
          <span className="text-sm text-gray-700">Batch code</span>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="e.g., BCR69 Group 2"
            className="w-full border rounded-md px-3 py-2"
          />
        </label>

        <label className="grid gap-1">
          <span className="text-sm text-gray-700">Default meet link (optional)</span>
          <input
            value={defaultMeetUrl}
            onChange={(e) => setDefaultMeetUrl(e.target.value)}
            placeholder="https://meet.google.com/..."
            className="w-full border rounded-md px-3 py-2"
          />
        </label>

        <div>
          <div className="flex items-center justify-between">
            <strong>Trainers</strong>
          </div>
          <div className="flex gap-2 mt-2 mb-2">
            <input value={trainerName} onChange={(e) => setTrainerName(e.target.value)} placeholder="Name" className="flex-1 border rounded-md px-3 py-2" />
            <input value={trainerPhone} onChange={(e) => setTrainerPhone(e.target.value)} placeholder="Phone (optional)" className="w-52 border rounded-md px-3 py-2" />
            <Button onClick={addTrainer}>Add</Button>
          </div>
          <ul className="space-y-1">
            {trainers.map((t) => (
              <li key={t.id} className="flex items-center justify-between">
                <span>{t.name} {t.phone ? `(${t.phone})` : ""}</span>
                <Button variant="danger" className="text-sm" onClick={() => setTrainers(trainers.filter(x => x.id !== t.id))}>Remove</Button>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <strong>Coordinators</strong>
          </div>
          <div className="flex gap-2 mt-2 mb-2">
            <input value={coordName} onChange={(e) => setCoordName(e.target.value)} placeholder="Name" className="flex-1 border rounded-md px-3 py-2" />
            <input value={coordPhone} onChange={(e) => setCoordPhone(e.target.value)} placeholder="Phone (optional)" className="w-52 border rounded-md px-3 py-2" />
            <Button onClick={addCoordinator}>Add</Button>
          </div>
          <ul className="space-y-1">
            {coordinators.map((c) => (
              <li key={c.id} className="flex items-center justify-between">
                <span>{c.name} {c.phone ? `(${c.phone})` : ""}</span>
                <Button variant="danger" className="text-sm" onClick={() => setCoordinators(coordinators.filter(x => x.id !== c.id))}>Remove</Button>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <strong>Students</strong>
          </div>
          <div className="flex gap-2 mt-2 mb-2">
            <input value={studentName} onChange={(e) => setStudentName(e.target.value)} placeholder="Name" className="flex-1 border rounded-md px-3 py-2" />
            <input value={studentPhone} onChange={(e) => setStudentPhone(e.target.value)} placeholder="Phone (optional)" className="w-52 border rounded-md px-3 py-2" />
            <Button onClick={addStudent}>Add</Button>
          </div>
          <ul className="space-y-1">
            {students.map((s) => (
              <li key={s.id} className="flex items-center justify-between">
                <span>{s.name} {s.phone ? `(${s.phone})` : ""}</span>
                <Button variant="danger" className="text-sm" onClick={() => setStudents(students.filter(x => x.id !== s.id))}>Remove</Button>
              </li>
            ))}
          </ul>
        </div>

        <Button variant="primary" disabled={!canSave || isSaving} onClick={handleSaveBatch}>{isSaving ? (editingId ? "Updating..." : "Saving...") : (editingId ? "Update Batch" : "Save Batch")}</Button>
      </div>

      <hr className="my-6" />

      <h3 className="font-semibold">Saved Batches</h3>
      {isLoadingList ? (
        <div className="text-sm text-gray-500">Loading batches...</div>
      ) : (
        <ul className="space-y-2">
          {batches.map((b) => (
            <li key={b.id} className="flex items-center justify-between">
              <span><strong>{b.code}</strong> — {b.students.length} students</span>
              <div className="flex items-center gap-2">
                <Button className="text-sm" onClick={() => beginEdit(b)}>Edit</Button>
                <Button variant="danger" className="text-sm" onClick={() => removeBatch(b.id)}>Delete</Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}


