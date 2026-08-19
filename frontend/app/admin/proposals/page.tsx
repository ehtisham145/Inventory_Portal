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
import { Select } from "@/components/ui/Select";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Textarea } from "@/components/ui/Textarea";
import { CompanyPicker, NEW_COMPANY_VALUE } from "@/components/proposals/CompanyPicker";
import { useToast } from "@/hooks/useToast";
import { extractErrorMessage, extractFieldErrors } from "@/lib/api";
import { CompanyInput, createCompany, listCompanies } from "@/services/companies";
import { ProposalInput, bulkDeleteProposals, createProposal, listProposals, sendProposal } from "@/services/proposals";
import { listUsers } from "@/services/users";
import { Company, Proposal, User } from "@/types";
import { DEFAULT_PROPOSAL_TITLE, FTA_CONFIRMATION_MESSAGE_BILINGUAL, MESSAGE_TEMPLATES } from "@/utils/messageTemplates";
import { STATUS_LABELS } from "@/utils/status";
import { formatDate } from "@/utils/format";
import { isValidEmail, required } from "@/utils/validators";

const STATUS_OPTIONS = Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label }));
const emptyForm: ProposalInput = {
  title: DEFAULT_PROPOSAL_TITLE,
  company: "",
  manager: "",
  message: FTA_CONFIRMATION_MESSAGE_BILINGUAL,
};
const emptyNewCompany: CompanyInput = { company_name: "", contact_person: "", email: "", phone: "", address: "" };

export default function AdminProposalsPage() {
  const { showToast } = useToast();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [companies, setCompanies] = useState<Company[]>([]);
  const [managers, setManagers] = useState<User[]>([]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState<ProposalInput>(emptyForm);
  const [newCompanyData, setNewCompanyData] = useState<CompanyInput>(emptyNewCompany);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSendingAfterCreate, setIsSendingAfterCreate] = useState(false);

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
      if (statusFilter) params.status = statusFilter;
      const data = await listProposals(params);
      setProposals(data.results);
      setCount(data.count);
      setPage(targetPage);
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setIsLoading(false);
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
      proposals.every((p) => prev.has(p.id)) ? new Set() : new Set(proposals.map((p) => p.id))
    );
  };

  const handleBulkDelete = async () => {
    setIsBulkDeleting(true);
    try {
      const { deleted_count } = await bulkDeleteProposals(Array.from(selectedIds));
      showToast(`${deleted_count} proposal(s) deleted.`, "success");
      setShowBulkDeleteConfirm(false);
      load(1);
    } catch (e) {
      showToast(extractErrorMessage(e), "error");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter]);

  const openCreate = async () => {
    setForm(emptyForm);
    setNewCompanyData(emptyNewCompany);
    setFormErrors({});
    setShowCreateModal(true);
    try {
      const [companiesData, managersData] = await Promise.all([
        listCompanies({ page_size: "100", status: "ACTIVE" }),
        listUsers({ role: "MANAGER", page_size: "100" }),
      ]);
      setCompanies(companiesData.results);
      setManagers(managersData.results);
    } catch {
      showToast("Could not load companies or managers.", "error");
    }
  };

  const isNewCompanyMode = form.company === NEW_COMPANY_VALUE;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!required(form.title)) errs.title = "Title is required.";
    if (!required(form.company)) errs.company = "Company is required.";
    if (isNewCompanyMode) {
      if (!required(newCompanyData.company_name)) errs.company_name = "Company name is required.";
      if (!required(newCompanyData.contact_person)) errs.contact_person = "Contact person is required.";
      if (!isValidEmail(newCompanyData.email)) errs.email = "Enter a valid email address.";
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreate = async () => {
    if (!validate()) return;
    setIsSendingAfterCreate(true);
    let proposal;
    try {
      let companyId = form.company;
      if (isNewCompanyMode) {
        const company = await createCompany(newCompanyData);
        companyId = company.id;
      }
      proposal = await createProposal({ ...form, company: companyId });
    } catch (e) {
      const fieldErrors = extractFieldErrors(e);
      if (fieldErrors) {
        setFormErrors((prev) => ({ ...prev, ...fieldErrors }));
      }
      showToast(extractErrorMessage(e), "error");
      setIsSendingAfterCreate(false);
      return;
    }

    // The proposal (and any new company) exists at this point regardless of what happens next.
    setShowCreateModal(false);
    load(1);

    try {
      await sendProposal(proposal.id);
      showToast("Proposal created and sent to the company.", "success");
    } catch (e) {
      showToast(`Proposal was created as a draft, but could not be sent: ${extractErrorMessage(e)}`, "error");
    }
    setIsSendingAfterCreate(false);
  };

  const columns: Column<Proposal>[] = [
    {
      header: "Proposal",
      render: (p) => <span className="font-medium text-gray-900">{p.company_detail?.company_name || "—"}</span>,
    },
    { header: "Manager", render: (p) => p.manager_name || "—" },
    { header: "Status", render: (p) => <StatusBadge status={p.status} /> },
    { header: "Updated", render: (p) => formatDate(p.updated_at) },
    {
      header: "Actions",
      render: (p) => (
        <Link href={`/admin/proposals/${p.id}`} className="text-sm font-medium text-blue-600 hover:underline">
          View
        </Link>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Input placeholder="Search proposals..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-64" />
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            placeholder="All statuses"
            options={STATUS_OPTIONS}
            className="w-48"
          />
        </div>
        <div className="flex gap-2">
          {selectedIds.size > 0 && (
            <Button variant="danger" onClick={() => setShowBulkDeleteConfirm(true)}>
              Delete Selected ({selectedIds.size})
            </Button>
          )}
          <Button onClick={openCreate}>Create Confirmation</Button>
        </div>
      </div>

      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={() => load(page)} />
      ) : proposals.length === 0 ? (
        <EmptyState title="No proposals yet" description="Create a proposal to get started." />
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <DataTable
            columns={columns}
            rows={proposals}
            keyField={(p) => p.id}
            selection={{ selectedIds, onToggleRow: toggleRow, onToggleAll: toggleAll }}
          />
          <Pagination
            page={page}
            hasNext={proposals.length > 0 && page * 20 < count}
            hasPrevious={page > 1}
            onPageChange={load}
            totalCount={count}
          />
        </div>
      )}

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Confirmation"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setShowCreateModal(false)}
              disabled={isSendingAfterCreate}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate} isLoading={isSendingAfterCreate}>
              Create &amp; Send Email
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} error={formErrors.title} />
          <CompanyPicker
            companies={companies}
            selectedCompanyId={form.company}
            onSelectCompany={(companyId) => setForm({ ...form, company: companyId })}
            newCompanyData={newCompanyData}
            onNewCompanyDataChange={setNewCompanyData}
            errors={formErrors}
          />
          <Select
            label="Assign Manager"
            placeholder="Select a manager"
            value={form.manager ?? ""}
            onChange={(e) => setForm({ ...form, manager: e.target.value })}
            error={formErrors.manager}
            options={managers.map((m) => ({ label: m.name, value: m.id }))}
          />
          <Select
            label="Message Template"
            placeholder="Start from a template (optional)"
            value=""
            onChange={(e) => {
              const template = MESSAGE_TEMPLATES.find((t) => t.label === e.target.value);
              if (template) setForm({ ...form, message: template.value });
            }}
            options={MESSAGE_TEMPLATES.map((t) => ({ label: t.label, value: t.label }))}
          />
          <Textarea
            label="Message"
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            error={formErrors.message}
            rows={4}
          />
        </div>
      </Modal>

      <ConfirmModal
        isOpen={showBulkDeleteConfirm}
        onClose={() => setShowBulkDeleteConfirm(false)}
        onConfirm={handleBulkDelete}
        title="Delete Selected Proposals"
        message={`This will permanently delete ${selectedIds.size} selected proposal(s), including their history and observations. This cannot be undone.`}
        confirmLabel="Delete Permanently"
        isDangerous
        isLoading={isBulkDeleting}
      />
    </div>
  );
}
