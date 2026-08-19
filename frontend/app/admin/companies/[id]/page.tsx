"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/Input";
import { LoadingState } from "@/components/ui/LoadingState";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/hooks/useToast";
import { extractErrorMessage, extractFieldErrors } from "@/lib/api";
import {
  CompanyInput,
  deleteCompany,
  getCompany,
  permanentlyDeleteCompany,
  resendCompanyInvite,
  updateCompany,
} from "@/services/companies";
import { Company } from "@/types";

export default function CompanyDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { showToast } = useToast();

  const [company, setCompany] = useState<Company | null>(null);
  const [form, setForm] = useState<CompanyInput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const load = async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await getCompany(params.id);
      setCompany(data);
      setForm({
        company_name: data.company_name,
        contact_person: data.contact_person,
        email: data.email,
        phone: data.phone,
        address: data.address,
        status: data.status,
      });
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const handleSave = async () => {
    if (!form) return;
    setFormErrors({});
    setIsSaving(true);
    try {
      await updateCompany(params.id, form);
      showToast("Company updated successfully.", "success");
      load();
    } catch (e) {
      const fieldErrors = extractFieldErrors(e);
      if (fieldErrors) {
        setFormErrors(fieldErrors);
      }
      showToast(extractErrorMessage(e), "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleResendInvite = async () => {
    setIsSendingInvite(true);
    try {
      await resendCompanyInvite(params.id);
      showToast("Invite email sent.", "success");
      load();
    } catch (e) {
      showToast(extractErrorMessage(e), "error");
    } finally {
      setIsSendingInvite(false);
    }
  };

  const handleDeactivate = async () => {
    try {
      await deleteCompany(params.id);
      showToast("Company deactivated.", "success");
      router.push("/admin/companies");
    } catch (e) {
      showToast(extractErrorMessage(e), "error");
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await permanentlyDeleteCompany(params.id);
      showToast("Company permanently deleted.", "success");
      router.push("/admin/companies");
    } catch (e) {
      showToast(extractErrorMessage(e), "error");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!company || !form) return null;

  return (
    <div className="flex max-w-xl flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">{company.company_name}</h2>
        <div className="mt-1 flex items-center gap-2">
          <p className="text-sm text-gray-500">Review portal login: {company.email}</p>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${
              company.login_status === "active"
                ? "bg-green-50 text-green-700"
                : company.login_status === "invite_pending"
                ? "bg-amber-50 text-amber-700"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            {company.login_status === "active"
              ? "Password set"
              : company.login_status === "invite_pending"
              ? "Invite pending"
              : "No login"}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <Input
          label="Company Name"
          value={form.company_name}
          onChange={(e) => setForm({ ...form, company_name: e.target.value })}
          error={formErrors.company_name}
        />
        <Input
          label="Contact Person Name"
          value={form.contact_person}
          onChange={(e) => setForm({ ...form, contact_person: e.target.value })}
          error={formErrors.contact_person}
        />
        <Input
          label="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          error={formErrors.email}
        />
        <Input
          label="Phone"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          error={formErrors.phone}
        />
        <Input
          label="Address"
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
          error={formErrors.address}
        />
        <Select
          label="Status"
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value as "ACTIVE" | "INACTIVE" })}
          options={[
            { label: "Active", value: "ACTIVE" },
            { label: "Inactive", value: "INACTIVE" },
          ]}
        />
        <div className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2">
          <p className="text-xs text-gray-500">
            {company.login_status === "active"
              ? "Send a new link to let them reset their password."
              : "Resend the password-setup link to this company's email."}
          </p>
          <Button variant="secondary" size="sm" onClick={handleResendInvite} isLoading={isSendingInvite}>
            {company.login_status === "active" ? "Reset Password" : "Resend Invite"}
          </Button>
        </div>

        <div className="mt-2 flex justify-between">
          <div className="flex gap-2">
            <Button variant="danger" onClick={() => setShowDeactivateConfirm(true)}>
              Deactivate Company
            </Button>
            <Button variant="danger" onClick={() => setShowDeleteConfirm(true)}>
              Delete Permanently
            </Button>
          </div>
          <Button onClick={handleSave} isLoading={isSaving}>
            Save Changes
          </Button>
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeactivateConfirm}
        onClose={() => setShowDeactivateConfirm(false)}
        onConfirm={handleDeactivate}
        title="Deactivate Company"
        message="This will mark the company as inactive. You can reactivate it later. Continue?"
        confirmLabel="Deactivate"
        isDangerous
      />

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Permanently Delete Company"
        message={
          company.proposal_count > 0
            ? `This will permanently delete ${company.company_name} AND all ${company.proposal_count} of its proposal(s), including their history and observations. This cannot be undone. Use Deactivate instead if you might need this data again.`
            : `This will permanently delete ${company.company_name} and cannot be undone. Use Deactivate instead if you might need this data again.`
        }
        confirmLabel="Delete Permanently"
        isDangerous
        isLoading={isDeleting}
      />
    </div>
  );
}
