"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { UserRound } from "lucide-react";
import Button from "../ui/button";
import Card from "../ui/card";
import EmptyState from "../ui/empty-state";
import Input from "../ui/input";
import PageHeader from "../ui/page-header";
import Select from "../ui/select";
import { getTrainer, saveTrainer } from "../../lib/trainersService";

const blank = { fullName: "", email: "", phone: "", specialization: "", joiningDate: "", status: "active", profileImage: "", notes: "" };
function validate(value) {
  const errors = {};
  if (!value.fullName.trim()) errors.fullName = "Enter the trainer's full name.";
  if (!value.email.trim()) errors.email = "Enter an email address.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email.trim())) errors.email = "Enter a valid email address.";
  if (!value.phone.trim() || value.phone.replace(/\D/g, "").length < 7 || value.phone.replace(/\D/g, "").length > 15) errors.phone = "Enter a phone number with 7 to 15 digits.";
  if (!value.specialization.trim()) errors.specialization = "Enter a specialization.";
  if (!value.joiningDate) errors.joiningDate = "Choose a joining date.";
  if (value.profileImage && !/^https?:\/\//i.test(value.profileImage)) errors.profileImage = "Enter a valid http or https image URL.";
  return errors;
}

export default function TrainerForm({ trainerId = null, initialDate = "" }) {
  const router = useRouter(); const editing = Boolean(trainerId);
  const [value, setValue] = useState({ ...blank, joiningDate: initialDate }); const [errors, setErrors] = useState({}); const [loading, setLoading] = useState(editing); const [saving, setSaving] = useState(false); const [missing, setMissing] = useState(false); const [loadError, setLoadError] = useState(""); const [notice, setNotice] = useState("");
  useEffect(() => { if (!editing) return; let cancelled = false; getTrainer(trainerId).then(trainer => { if (!cancelled) setValue({ fullName: trainer.fullName, email: trainer.email, phone: trainer.phone, specialization: trainer.specialization, joiningDate: trainer.joiningDate, status: trainer.status, profileImage: trainer.profileImage, notes: trainer.notes }); }).catch(error => { if (!cancelled) { if (error.status === 400 || error.status === 404) setMissing(true); else setLoadError(error.message); } }).finally(() => { if (!cancelled) setLoading(false); }); return () => { cancelled = true; }; }, [editing, trainerId]);
  function update(field, next) { setValue(current => ({ ...current, [field]: next })); setErrors(current => ({ ...current, [field]: undefined })); setNotice(""); }
  async function submit(event) { event.preventDefault(); const found = validate(value); setErrors(found); if (Object.keys(found).length) return; setSaving(true); setLoadError(""); try { const saved = await saveTrainer(value, trainerId); if (editing) { setNotice("Trainer details saved."); setValue({ fullName: saved.fullName, email: saved.email, phone: saved.phone, specialization: saved.specialization, joiningDate: saved.joiningDate, status: saved.status, profileImage: saved.profileImage, notes: saved.notes }); } else { router.push(`/trainers/${saved.id}`); router.refresh(); } } catch (error) { setErrors(error.fields || {}); if (!Object.keys(error.fields || {}).length) setLoadError(error.message); } finally { setSaving(false); } }
  if (loading) return <Card className="p-6" role="status"><p className="text-sm text-ink-muted">Loading trainer…</p></Card>;
  if (missing) return <Card className="p-5"><EmptyState icon={<UserRound size={24}/>} title="Trainer not found" description="No trainer with this ID exists." action={<Button href="/trainers" variant="secondary">Back to trainers</Button>}/></Card>;
  if (loadError && editing && !value.fullName) return <Card className="p-6" role="alert"><p className="text-sm text-error">{loadError}</p><Button href="/trainers" variant="secondary">Back to trainers</Button></Card>;
  return <div className="space-y-6"><PageHeader title={editing ? "Edit Trainer" : "Add Trainer"} description={editing ? "Update this trainer's profile and status." : "Add a trainer to your coaching team."} actions={<Button href={editing ? `/trainers/${trainerId}` : "/trainers"} variant="secondary">Cancel</Button>}/><Card className="max-w-4xl p-5 md:p-7"><form className="space-y-6" onSubmit={submit} noValidate>{loadError && <p role="alert" className="text-sm text-error">{loadError}</p>}{notice && <p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-800">{notice}</p>}<div className="grid grid-cols-1 gap-x-5 gap-y-4 md:grid-cols-2"><Input id="trainer-name" label="Full name" autoComplete="name" required value={value.fullName} onChange={e => update("fullName", e.target.value)} error={errors.fullName}/><Input id="trainer-email" label="Email" type="email" autoComplete="email" required value={value.email} onChange={e => update("email", e.target.value)} error={errors.email}/><Input id="trainer-phone" label="Phone" type="tel" autoComplete="tel" required placeholder="+92 300 1234567" value={value.phone} onChange={e => update("phone", e.target.value)} error={errors.phone}/><Input id="trainer-specialization" label="Specialization" required placeholder="Strength training, yoga…" value={value.specialization} onChange={e => update("specialization", e.target.value)} error={errors.specialization}/><Input id="trainer-joining-date" label="Joining date" type="date" required value={value.joiningDate} onChange={e => update("joiningDate", e.target.value)} error={errors.joiningDate}/><Select id="trainer-status" label="Status" value={value.status} onChange={e => update("status", e.target.value)}><option value="active">Active</option><option value="inactive">Inactive</option></Select><Input id="trainer-profile-image" label="Profile image URL (optional)" type="url" placeholder="https://…" value={value.profileImage} onChange={e => update("profileImage", e.target.value)} error={errors.profileImage}/><label className="ui-field md:col-span-2"><span className="ui-label">Notes (optional)</span><textarea id="trainer-notes" rows={4} maxLength={2000} className="ui-input" value={value.notes} onChange={e => update("notes", e.target.value)}/></label></div><div className="flex justify-end gap-3 border-t border-line pt-5"><Button href={editing ? `/trainers/${trainerId}` : "/trainers"} variant="secondary">Cancel</Button><Button type="submit" disabled={saving}>{saving ? "Saving…" : editing ? "Save Changes" : "Add Trainer"}</Button></div></form></Card></div>;
}
