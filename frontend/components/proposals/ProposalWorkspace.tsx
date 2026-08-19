"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/Input";
import { LoadingState } from "@/components/ui/LoadingState";
import { Select } from "@/components/ui/Select";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/hooks/useToast";
import { extractErrorMessage, extractFieldErrors } from "@/lib/api";
import { listCompanies } from "@/services/companies";
import {
  ProposalInput,
  deleteProposal,
  getProposal,
  getProposalHistory,
  getProposalObservations,
  resendProposal,
  sendProposal,
  sendProposalEmailNow,
  updateProposal,
  uploadProposalAttachment,
} from "@/services/proposals";
import { listUsers } from "@/services/users";
import { Company, Observation, Proposal, ProposalHistoryItem, User } from "@/types";
import { formatDateTime } from "@/utils/format";

interface ProposalWorkspaceProps {
  proposalId: string;
  backHref: string;
  canDelete?: boolean;
  canReassignManager?: boolean;
}

const EDITABLE_STATUSES = ["DRAFT", "CHANGES_REQUESTED"];

export function ProposalWorkspace({
  proposalId,
  backHref,
  canDelete = false,
  canReassignManager = false,
}: ProposalWorkspaceProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [history, setHistory] = useState<ProposalHistoryItem[]>([]);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [managers, setManagers] = useState<User[]>([]);

  const [form, setForm] = useState<ProposalInput | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSendConfirm, setShowSendConfirm] = useState(false);

  const load = async () => {
    setIsLoading(true);
    setError("");
    try {
      const [proposalData, historyData, observationsData, companiesData, managersData] = await Promise.all([
        getProposal(proposalId),
        getProposalHistory(proposalId),
        getProposalObservations(proposalId),
        listCompanies({ page_size: "100" }),
        canReassignManager ? listUsers({ role: "MANAGER", page_size: "100" }) : Promise.resolve({ results: [] as User[] }),
      ]);
      setProposal(proposalData);
      setHistory(historyData);
      setObservations(observationsData);
      setCompanies(companiesData.results);
      setManagers(managersData.results);
      setForm({
        title: proposalData.title,
        company: proposalData.company,
        manager: proposalData.manager ?? "",
        message: proposalData.message,
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
  }, [proposalId]);

  const isEditable = proposal ? EDITABLE_STATUSES.includes(proposal.status) : false;

  const handleSave = async () => {
    if (!form) return;
    setFormErrors({});
    setIsSaving(true);
    try {
      await updateProposal(proposalId, form);
      showToast("Proposal updated successfully.", "success");
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

  const handleSend = async () => {
    setIsSending(true);
    try {
      const isResubmit = proposal?.status === "CHANGES_REQUESTED";
      const data = await sendProposal(proposalId);
      showToast(isResubmit ? "Proposal resubmitted for review." : "Proposal sent for review.", "success");
      setShowSendConfirm(false);
      setProposal(data.proposal);
      load();
    } catch (e) {
      showToast(extractErrorMessage(e), "error");
    } finally {
      setIsSending(false);
    }
  };

  const handleResend = async () => {
    setIsSending(true);
    try {
      await resendProposal(proposalId);
      showToast("Review link resent successfully.", "success");
      load();
    } catch (e) {
      showToast(extractErrorMessage(e), "error");
    } finally {
      setIsSending(false);
    }
  };

  const handleCopyLink = async () => {
    if (!proposal?.review_url) return;
    try {
      await navigator.clipboard.writeText(proposal.review_url);
      showToast("Review link copied to clipboard.", "success");
    } catch {
      showToast("Could not copy the link. Please copy it manually.", "error");
    }
  };

  const handleSendEmail = async () => {
    setIsSendingEmail(true);
    try {
      await sendProposalEmailNow(proposalId);
      showToast("Email sent successfully.", "success");
      load();
    } catch (e) {
      showToast(extractErrorMessage(e), "error");
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteProposal(proposalId);
      showToast("Proposal deleted.", "success");
      router.push(backHref);
    } catch (e) {
      showToast(extractErrorMessage(e), "error");
    }
  };

  const handleUpload = async (file: File) => {
    try {
      await uploadProposalAttachment(proposalId, file);
      showToast("Attachment uploaded.", "success");
      load();
    } catch (e) {
      showToast(extractErrorMessage(e), "error");
    }
  };

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!proposal || !form) return null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{proposal.title}</h2>
          <p className="text-sm text-gray-500">{proposal.company_detail?.company_name}</p>
        </div>
        <StatusBadge status={proposal.status} />
      </div>

      <div className="flex flex-wrap gap-2">
        {proposal.status === "DRAFT" && (
          <Button onClick={() => setShowSendConfirm(true)}>Send Proposal</Button>
        )}
        {proposal.status === "CHANGES_REQUESTED" && (
          <Button onClick={() => setShowSendConfirm(true)}>Update &amp; Resubmit</Button>
        )}
        {(proposal.status === "SENT" || proposal.status === "PENDING_REVIEW") && (
          <Button variant="secondary" onClick={handleResend} isLoading={isSending}>
            Resend Review Link
          </Button>
        )}
        {canDelete && (
          <Button variant="danger" onClick={() => setShowDeleteConfirm(true)}>
            Delete Proposal
          </Button>
        )}
      </div>

      {proposal.review_url && (
        <div className="flex flex-col gap-2 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
          <div className="flex-1 truncate rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-600">
            {proposal.review_url}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={handleCopyLink}>
              Copy Link
            </Button>
            {proposal.company_user_email && (
              <Button variant="secondary" size="sm" onClick={handleSendEmail} isLoading={isSendingEmail}>
                Send via Email
              </Button>
            )}
            {proposal.whatsapp_link && (
              <a href={proposal.whatsapp_link} target="_blank" rel="noreferrer">
                <Button variant="secondary" size="sm">
                  Send via WhatsApp
                </Button>
              </a>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
          <Input
            label="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            error={formErrors.title}
            disabled={!isEditable}
          />
          <Select
            label="Company"
            value={form.company}
            onChange={(e) => setForm({ ...form, company: e.target.value })}
            error={formErrors.company}
            options={companies.map((c) => ({ label: c.company_name, value: c.id }))}
            disabled={!isEditable}
          />
          <Input
            label="Company Login"
            value={
              proposal.company_user_name
                ? `${proposal.company_user_name} (${proposal.company_user_email})`
                : "—"
            }
            disabled
          />
          {canReassignManager ? (
            <Select
              label="Assign Manager"
              placeholder="Select a manager"
              value={form.manager ?? ""}
              onChange={(e) => setForm({ ...form, manager: e.target.value })}
              error={formErrors.manager}
              options={managers.map((m) => ({ label: m.name, value: m.id }))}
              disabled={!isEditable}
            />
          ) : (
            <Input label="Manager" value={proposal.manager_name ?? "—"} disabled />
          )}
          <Textarea
            label="Message"
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            error={formErrors.message}
            rows={5}
            disabled={!isEditable}
          />
          {isEditable && (
            <div className="flex justify-end">
              <Button onClick={handleSave} isLoading={isSaving}>
                Save Changes
              </Button>
            </div>
          )}

          <div className="mt-2 border-t border-gray-100 pt-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Attachments</p>
            <ul className="mt-2 flex flex-col gap-1">
              {proposal.attachments.length === 0 && <li className="text-sm text-gray-400">No attachments</li>}
              {proposal.attachments.map((att) => (
                <li key={att.id}>
                  <a href={att.file} target="_blank" rel="noreferrer" className="text-sm text-blue-600 underline">
                    {att.file_name}
                  </a>
                </li>
              ))}
            </ul>
            <input
              type="file"
              className="mt-3 text-sm"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUpload(file);
              }}
            />
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-400">Observations</p>
            {observations.length === 0 ? (
              <p className="text-sm text-gray-400">No observations yet.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {observations.map((obs) => (
                  <li key={obs.id} className="rounded-lg bg-gray-50 p-3 text-sm">
                    <p className="text-gray-700">{obs.observation}</p>
                    <p className="mt-1 text-xs text-gray-400">
                      {obs.submitted_by_name} · {formatDateTime(obs.created_at)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-400">History</p>
            <ul className="flex flex-col gap-3">
              {history.map((h) => (
                <li key={h.id} className="text-sm">
                  <p className="font-medium text-gray-800">{h.action}</p>
                  <p className="text-xs text-gray-400">
                    {h.performed_by_name} · {formatDateTime(h.created_at)}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showSendConfirm}
        onClose={() => setShowSendConfirm(false)}
        onConfirm={handleSend}
        title={proposal.status === "CHANGES_REQUESTED" ? "Resubmit Proposal" : "Send Proposal"}
        message="This will generate a secure review link and notify the company user by email and WhatsApp. Continue?"
        confirmLabel={proposal.status === "CHANGES_REQUESTED" ? "Resubmit" : "Send"}
        isLoading={isSending}
      />

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Proposal"
        message="This action cannot be undone. Are you sure you want to permanently delete this proposal?"
        confirmLabel="Delete"
        isDangerous
      />
    </div>
  );
}
