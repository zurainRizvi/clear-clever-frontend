import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";
import {
  createInsurerPolicy,
  updateInsurerPolicy,
  type InsurerPolicyDetail,
  type InsurerPolicySummary,
  type InsurerPolicyCategory,
} from "@/lib/insurer-api";
import { slugifyName } from "@/lib/provider-utils";

const CATEGORIES: InsurerPolicyCategory[] = ["home", "auto", "life", "pet"];

interface PolicyFormState {
  slug: string;
  name: string;
  category: InsurerPolicyCategory;
  description: string;
  premiumMonthlyPkr: string;
  premiumYearlyPkr: string;
  coverageSummary: string;
  features: string;
  deductiblePkr: string;
}

const emptyForm = (): PolicyFormState => ({
  slug: "",
  name: "",
  category: "home",
  description: "",
  premiumMonthlyPkr: "",
  premiumYearlyPkr: "",
  coverageSummary: "",
  features: "",
  deductiblePkr: "0",
});

export function ProviderPolicyFormDialog({
  open,
  policy,
  onClose,
  onSaved,
}: {
  open: boolean;
  policy?: InsurerPolicySummary | InsurerPolicyDetail | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<PolicyFormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const isEdit = !!policy;

  useEffect(() => {
    if (!open) return;
    if (policy && "description" in policy) {
      setForm({
        slug: policy.slug,
        name: policy.name,
        category: policy.category,
        description: policy.description,
        premiumMonthlyPkr: String(policy.premiumMonthlyPkr),
        premiumYearlyPkr: String(policy.premiumYearlyPkr),
        coverageSummary: policy.coverageSummary,
        features: policy.features.join("\n"),
        deductiblePkr: String(policy.deductiblePkr),
      });
    } else if (policy) {
      setForm({
        ...emptyForm(),
        slug: policy.slug,
        name: policy.name,
        category: policy.category,
        premiumMonthlyPkr: String(policy.premiumMonthlyPkr),
        premiumYearlyPkr: String(policy.premiumYearlyPkr),
      });
    } else {
      setForm(emptyForm());
    }
  }, [open, policy]);

  if (!open) return null;

  const update = (patch: Partial<PolicyFormState>) => setForm((prev) => ({ ...prev, ...patch }));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const monthly = Number(form.premiumMonthlyPkr);
    const yearly = Number(form.premiumYearlyPkr);
    const deductible = Number(form.deductiblePkr);
    const features = form.features
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    if (!form.name.trim() || !form.slug.trim() || features.length === 0) {
      toast.error("Complete all required fields and add at least one feature.");
      return;
    }

    const payload = {
      slug: form.slug.trim(),
      name: form.name.trim(),
      category: form.category,
      description: form.description.trim(),
      premiumMonthlyPkr: monthly,
      premiumYearlyPkr: yearly,
      coverageSummary: form.coverageSummary.trim(),
      features,
      deductiblePkr: deductible,
    };

    setSubmitting(true);
    try {
      if (isEdit && policy) {
        await updateInsurerPolicy(policy.id, payload);
        toast.success("Policy updated and resubmitted for approval");
      } else {
        await createInsurerPolicy(payload);
        toast.success("Policy submitted for admin approval");
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not save policy");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-popover text-popover-foreground border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold">{isEdit ? "Edit policy" : "Add new policy"}</h2>
          <button type="button" onClick={onClose} className="p-2 hover:bg-accent rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="p-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-2">Policy name</label>
              <input
                value={form.name}
                onChange={(e) => {
                  const name = e.target.value;
                  update({
                    name,
                    slug: isEdit ? form.slug : slugifyName(name),
                  });
                }}
                className="w-full px-4 py-3 bg-input-background border border-border rounded-xl"
                required
              />
            </div>
            <div>
              <label className="block text-sm mb-2">URL slug</label>
              <input
                value={form.slug}
                onChange={(e) => update({ slug: slugifyName(e.target.value) })}
                className="w-full px-4 py-3 bg-input-background border border-border rounded-xl"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm mb-2">Category</label>
            <select
              value={form.category}
              onChange={(e) => update({ category: e.target.value as InsurerPolicyCategory })}
              className="w-full px-4 py-3 bg-input-background border border-border rounded-xl"
            >
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm mb-2">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => update({ description: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 bg-input-background border border-border rounded-xl resize-none"
              required
            />
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm mb-2">Monthly premium (PKR)</label>
              <input
                type="number"
                min={0}
                value={form.premiumMonthlyPkr}
                onChange={(e) => update({ premiumMonthlyPkr: e.target.value })}
                className="w-full px-4 py-3 bg-input-background border border-border rounded-xl"
                required
              />
            </div>
            <div>
              <label className="block text-sm mb-2">Yearly premium (PKR)</label>
              <input
                type="number"
                min={0}
                value={form.premiumYearlyPkr}
                onChange={(e) => update({ premiumYearlyPkr: e.target.value })}
                className="w-full px-4 py-3 bg-input-background border border-border rounded-xl"
                required
              />
            </div>
            <div>
              <label className="block text-sm mb-2">Deductible (PKR)</label>
              <input
                type="number"
                min={0}
                value={form.deductiblePkr}
                onChange={(e) => update({ deductiblePkr: e.target.value })}
                className="w-full px-4 py-3 bg-input-background border border-border rounded-xl"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm mb-2">Coverage summary</label>
            <input
              value={form.coverageSummary}
              onChange={(e) => update({ coverageSummary: e.target.value })}
              className="w-full px-4 py-3 bg-input-background border border-border rounded-xl"
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-2">Features (one per line)</label>
            <textarea
              value={form.features}
              onChange={(e) => update({ features: e.target.value })}
              rows={4}
              placeholder={"Fire cover\nTheft cover"}
              className="w-full px-4 py-3 bg-input-background border border-border rounded-xl resize-none"
              required
            />
          </div>

          {isEdit ? (
            <p className="text-xs text-muted-foreground">
              Editing resets status to pending until an admin approves the policy again.
            </p>
          ) : null}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-border rounded-xl hover:bg-accent"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-primary text-primary-foreground rounded-xl disabled:opacity-50 inline-flex items-center gap-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {isEdit ? "Save changes" : "Submit for approval"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
