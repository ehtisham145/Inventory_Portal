"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Column, DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/Input";
import { LoadingState } from "@/components/ui/LoadingState";
import { Modal } from "@/components/ui/Modal";
import { Pagination } from "@/components/ui/Pagination";
import { useToast } from "@/hooks/useToast";
import { extractErrorMessage, extractFieldErrors } from "@/lib/api";
import { CompanyInput, bulkDeleteCompanies, createCompany, listCompanies } from "@/services/companies";
import { Company } from "@/types";
import { formatDate } from "@/utils/format";
import { isValidEmail, required } from "@/utils/validators";

const emptyForm: CompanyInput = { company_name: "", contact_person: "", email: "", phone: "", address: "" };

export default function CompaniesPage() {
  const { showToast } = useToast();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState<CompanyInput>(emptyForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const load = async (targetPage = page) => {
    setIsLoading(true);
    setError("");
    setSelectedIds(new Set());
    try {
      const params: Record<string, string> = { page: String(targetPage) };
      if (search) params.search = search;
      const data = await listCompanies(params);
      setCompanies(data.results);
      setCount(data.count);
      setPage(targetPage);
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!required(form.company_name)) errs.company_name = "Company name is required.";
    if (!required(form.contact_person)) errs.contact_person = "Contact person is required.";
    if (!isValidEmail(form.email)) errs.email = "Enter a valid email address.";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreate = async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      await createCompany(form);
      showToast("Company created. An invite email was sent so they can set up their password.", "success");
      setShowCreateModal(false);
      setForm(emptyForm);
      load(1);
    } catch (e) {
      const fieldErrors = extractFieldErrors(e);
      if (fieldErrors) {
        setFormErrors((prev) => ({ ...prev, ...fieldErrors }));
      }
      showToast(extractErrorMessage(e), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelectedIds((prev) =>
      companies.every((c) => prev.has(c.id)) ? new Set() : new Set(companies.map((c) => c.id))
    );
  };

  const selectedProposalCount = companies
    .filter((c) => selectedIds.has(c.id))
    .reduce((sum, c) => sum + c.proposal_count, 0);

  const handleBulkDelete = async () => {
    setIsBulkDeleting(true);
    try {
      const { deleted_count, deleted_proposals } = await bulkDeleteCompanies(Array.from(selectedIds));
      showToast(`${deleted_count} compan(y/ies) and ${deleted_proposals} proposal(s) deleted.`, "success");
      setShowBulkDeleteConfirm(false);
      load(1);
    } catch (e) {
      showToast(extractErrorMessage(e), "error");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const columns: Column<Company>[] = [
    { header: "Company", render: (c) => <span className="font-medium text-gray-900">{c.company_name}</span> },
    { header: "Contact Person", render: (c) => c.contact_person },
    { header: "Email", render: (c) => c.email },
    {
      header: "Login",
      render: (c) => (
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${
            c.login_status === "active"
              ? "bg-green-50 text-green-700"
              : c.login_status === "invite_pending"
              ? "bg-amber-50 text-amber-700"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          {c.login_status === "active" ? "Active" : c.login_status === "invite_pending" ? "Invite Pending" : "None"}
        </span>
      ),
    },
    {
      header: "Status",
      render: (c) => (
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${
            c.status === "ACTIVE" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
          }`}
        >
          {c.status}
        </span>
      ),
    },
    { header: "Created", render: (c) => formatDate(c.created_at) },
    {
      header: "Actions",
      render: (c) => (
        <Link href={`/admin/companies/${c.id}`} className="text-sm font-medium text-blue-600 hover:underline">
          View
        </Link>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Input placeholder="Search companies..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-64" />
        <div className="flex gap-2">
          {selectedIds.size > 0 && (
            <Button variant="danger" onClick={() => setShowBulkDeleteConfirm(true)}>
              Delete Selected ({selectedIds.size})
            </Button>
          )}
          <Button onClick={() => setShowCreateModal(true)}>Add Company</Button>
        </div>
      </div>

      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={() => load(page)} />
      ) : companies.length === 0 ? (
        <EmptyState title="No companies yet" description="Add your first company to get started." />
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <DataTable
            columns={columns}
            rows={companies}
            keyField={(c) => c.id}
            selection={{ selectedIds, onToggleRow: toggleRow, onToggleAll: toggleAll }}
          />
          <Pagination
            page={page}
            hasNext={companies.length > 0 && page * 20 < count}
            hasPrevious={page > 1}
            onPageChange={load}
            totalCount={count}
          />
        </div>
      )}

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add Company"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleCreate} isLoading={isSubmitting}>
              Create Company
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
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
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            error={formErrors.email}
          />
          <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <p className="text-xs text-gray-400">
            An invite email will be sent to this address so the company can set up their own login password.
          </p>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={showBulkDeleteConfirm}
        onClose={() => setShowBulkDeleteConfirm(false)}
        onConfirm={handleBulkDelete}
        title="Delete Selected Companies"
        message={
          selectedProposalCount > 0
            ? `This will permanently delete ${selectedIds.size} selected compan(y/ies) AND all ${selectedProposalCount} of their proposal(s), including history and observations. This cannot be undone.`
            : `This will permanently delete ${selectedIds.size} selected compan(y/ies). This cannot be undone.`
        }
        confirmLabel="Delete Permanently"
        isDangerous
        isLoading={isBulkDeleting}
      />
    </div>
  );
}
