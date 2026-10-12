"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, UsersRound } from "lucide-react";
import Badge from "../ui/badge";
import Button from "../ui/button";
import Card from "../ui/card";
import EmptyState from "../ui/empty-state";
import Input from "../ui/input";
import Modal from "../ui/modal";
import PageHeader from "../ui/page-header";
import Select from "../ui/select";
import { getInitialPlans, getPlanMemberCounts, getPlans, savePlan, togglePlanStatus } from "../../lib/plansService";

const blankValues = { name: "", price: "", duration: "1", unit: "months", description: "" };

function durationLabel(days) {
  if (days % 30 === 0) {
    const months = days / 30;
    return `${months} ${months === 1 ? "month" : "months"}`;
  }
  return `${days} ${days === 1 ? "day" : "days"}`;
}

function formatCurrency(amount) {
  return `PKR ${Number(amount).toLocaleString("en-PK")}`;
}

function valuesFor(plan) {
  const months = plan.durationDays % 30 === 0;
  return {
    name: plan.name,
    price: String(plan.price),
    duration: String(months ? plan.durationDays / 30 : plan.durationDays),
    unit: months ? "months" : "days",
    description: plan.description || "",
  };
}

export default function PlansManager() {
  const [plans, setPlans] = useState(getInitialPlans);
  const [memberCounts, setMemberCounts] = useState(getPlanMemberCounts);
  const [editingPlan, setEditingPlan] = useState(null);
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState(blankValues);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPlans(getPlans());
      setMemberCounts(getPlanMemberCounts());
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const days = useMemo(() => Number(values.duration) * (values.unit === "months" ? 30 : 1), [values.duration, values.unit]);

  function openNewPlan() {
    setEditingPlan(null);
    setValues(blankValues);
    setErrors({});
    setOpen(true);
  }

  function openEditPlan(plan) {
    setEditingPlan(plan);
    setValues(valuesFor(plan));
    setErrors({});
    setOpen(true);
  }

  function updateValue(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function validate() {
    const next = {};
    if (!values.name.trim()) next.name = "Enter a plan name.";
    else if (plans.some((plan) => plan.id !== editingPlan?.id && plan.name.trim().toLowerCase() === values.name.trim().toLowerCase())) {
      next.name = "A plan with this name already exists.";
    }
    if (!values.price.trim() || !Number.isFinite(Number(values.price)) || Number(values.price) <= 0) {
      next.price = "Enter a price greater than zero.";
    }
    if (!values.duration.trim() || !Number.isInteger(Number(values.duration)) || Number(values.duration) <= 0) {
      next.duration = "Enter a positive whole number.";
    }
    return next;
  }

  function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    savePlan({ name: values.name, price: values.price, durationDays: days, description: values.description }, editingPlan?.id);
    setPlans(getPlans());
    setOpen(false);
  }

  function handleToggle(plan) {
    togglePlanStatus(plan.id);
    setPlans(getPlans());
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Plans"
        description="Create and manage the membership plans available at your gym."
        actions={<Button onClick={openNewPlan}><Plus size={16} aria-hidden="true" />Add Plan</Button>}
      />

      {plans.length === 0 ? (
        <Card className="p-5 md:p-6">
          <EmptyState
            icon={<UsersRound size={25} strokeWidth={1.7} />}
            title="No plans yet"
            description="Add a membership plan to make it available to your members."
            action={<Button onClick={openNewPlan}><Plus size={15} aria-hidden="true" />Add Plan</Button>}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 items-stretch gap-5 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan.id} className="flex min-w-0 flex-col p-5 md:p-6">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-lg font-semibold text-ink">{plan.name}</h2>
                <Badge tone={plan.status === "Active" ? "success" : "neutral"}>{plan.status}</Badge>
              </div>
              <p className="mt-4 text-2xl font-semibold tracking-tight text-ink">{formatCurrency(plan.price)}</p>
              <p className="mt-1 text-sm text-ink-muted">{durationLabel(plan.durationDays)}</p>
              {plan.description && <p className="mt-4 min-h-10 text-sm leading-6 text-ink-muted">{plan.description}</p>}
              <div className="mt-5 flex items-center gap-2 border-t border-line pt-4 text-sm text-ink-muted">
                <UsersRound size={16} aria-hidden="true" />
                <span><strong className="font-semibold text-ink">{memberCounts[plan.id] || 0}</strong> {(memberCounts[plan.id] || 0) === 1 ? "member" : "members"}</span>
              </div>
              <div className="mt-auto flex flex-wrap gap-2 pt-5">
                <Button variant="secondary" size="sm" onClick={() => openEditPlan(plan)}>Edit</Button>
                <Button variant="secondary" size="sm" onClick={() => handleToggle(plan)}>{plan.status === "Active" ? "Deactivate" : "Activate"}</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editingPlan ? "Edit Plan" : "Add Plan"}
        description={editingPlan ? "Update the membership plan details." : "Set the price and duration for a membership plan."}
      >
        <form className="space-y-5" onSubmit={handleSubmit} noValidate>
          <Input id="plan-name" label="Plan name" required autoComplete="off" value={values.name} onChange={(event) => updateValue("name", event.target.value)} error={errors.name} />
          <Input id="plan-price" label="Price (PKR)" type="number" min="0.01" step="any" inputMode="decimal" required value={values.price} onChange={(event) => updateValue("price", event.target.value)} error={errors.price} />
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3">
            <Input id="plan-duration" label="Duration" type="number" min="1" step="1" inputMode="numeric" required value={values.duration} onChange={(event) => updateValue("duration", event.target.value)} error={errors.duration} />
            <Select id="plan-duration-unit" label="Unit" value={values.unit} onChange={(event) => updateValue("unit", event.target.value)}>
              <option value="days">Days</option>
              <option value="months">Months</option>
            </Select>
          </div>
          <label className="ui-field">
            <span className="ui-label">Description (optional)</span>
            <textarea id="plan-description" className="ui-input min-h-24 py-2" rows={3} value={values.description} onChange={(event) => updateValue("description", event.target.value)} />
          </label>
          <div className="flex flex-col-reverse gap-3 border-t border-line pt-5 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit">{editingPlan ? "Save Changes" : "Add Plan"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
