"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Logo } from "@/components/layout/Logo";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { Modal } from "@/components/ui/Modal";
import { ObservationForm } from "@/components/proposals/ObservationForm";
import { ProposalDetails } from "@/components/proposals/ProposalDetails";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { extractErrorMessage } from "@/lib/api";
import { approveProposal, getReviewProposal, rejectProposal, requestProposalChanges } from "@/services/review";
import { ReviewProposal } from "@/types";

type ViewState = "loading" | "ready" | "error" | "approved" | "rejected" | "changes_submitted";

export default function ReviewPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;

  const [state, setState] = useState<ViewState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [proposal, setProposal] = useState<ReviewProposal | null>(null);

  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showChangesModal, setShowChangesModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasAcknowledged, setHasAcknowledged] = useState(false);

  const load = async () => {
    setState("loading");
    setHasAcknowledged(false);
    try {
      const data = await getReviewProposal(token);
      setProposal(data);
      if (data.status === "APPROVED") setState("approved");
      else if (data.status === "REJECTED") setState("rejected");
      else if (data.status === "CHANGES_REQUESTED") setState("changes_submitted");
      else setState("ready");
    } catch (error) {
      setErrorMessage(extractErrorMessage(error));
      setState("error");
    }
  };

  useEffect(() => {
    if (token) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      await approveProposal(token);
      setState("approved");
      setShowApproveConfirm(false);
    } catch (error) {
      setErrorMessage(extractErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      setRejectError("Please tell us why you are rejecting this proposal.");
      return;
    }
    setIsSubmitting(true);
    try {
      await rejectProposal(token, rejectReason.trim());
      setState("rejected");
      setShowRejectModal(false);
    } catch (error) {
      setRejectError(extractErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestChanges = async (observation: string) => {
    setIsSubmitting(true);
    try {
      await requestProposalChanges(token, observation);
      setState("changes_submitted");
      setShowChangesModal(false);
    } catch (error) {
      setErrorMessage(extractErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="mb-3 flex justify-center">
          <Logo size="md" />
        </div>
        <p className="mb-6 flex items-center justify-center gap-1.5 text-center text-xs text-gray-400">
          <span aria-hidden="true">🔒</span> Secure review link · Your response is encrypted and shared only with Al
          Merak
        </p>

        {state === "loading" && <LoadingState label="Loading your proposal..." />}

        {state === "error" && <ErrorState message={errorMessage} onRetry={load} />}

        {state === "approved" && (
          <SuccessPanel
            title="Proposal Approved Successfully"
            message="Thank you. Al Merak has been notified of your approval."
          />
        )}

        {state === "rejected" && (
          <SuccessPanel title="Proposal Rejected" message="Thank you for your feedback. Al Merak has been notified." />
        )}

        {state === "changes_submitted" && (
          <SuccessPanel
            title="Your change request has been submitted successfully."
            message="Al Merak will review your observations and get back to you with an updated proposal."
          />
        )}

        {state === "ready" && proposal && (
          <div className="flex flex-col gap-6">
            <ProposalDetails proposal={proposal} />

            {proposal.observations.length > 0 && (
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Previous Observations</p>
                <ul className="mt-3 flex flex-col gap-3">
                  {proposal.observations.map((obs) => (
                    <li key={obs.id} className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                      {obs.observation}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <label
              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 shadow-sm transition-colors ${
                hasAcknowledged ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50"
              }`}
            >
              <input
                type="checkbox"
                checked={hasAcknowledged}
                onChange={(e) => setHasAcknowledged(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-gray-900 focus:ring-gray-900/20"
              />
              <span className="text-sm text-gray-700">
                I confirm that I have read, understood, and approve the content above, and I am authorized to make
                this decision on behalf of the company.
              </span>
            </label>

            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <p className="mb-4 text-sm font-medium text-gray-900">What would you like to do?</p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  variant="success"
                  size="lg"
                  className="flex-1"
                  onClick={() => setShowApproveConfirm(true)}
                  disabled={!hasAcknowledged}
                >
                  ✓ Approve
                </Button>
                <Button
                  variant="secondary"
                  className="flex-1"
                  disabled={!hasAcknowledged}
                  onClick={() => {
                    setRejectReason("");
                    setRejectError("");
                    setShowRejectModal(true);
                  }}
                >
                  Reject
                </Button>
                <Button
                  variant="ghost"
                  className="flex-1"
                  disabled={!hasAcknowledged}
                  onClick={() => setShowChangesModal(true)}
                >
                  Request Changes
                </Button>
              </div>
              {!hasAcknowledged ? (
                <p className="mt-4 text-center text-xs text-gray-400">
                  Please check the confirmation box above to enable these actions.
                </p>
              ) : (
                <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-gray-400">
                  <span aria-hidden="true">🔒</span> Your decision is recorded securely and Al Merak is notified
                  immediately.
                </p>
              )}
            </div>
          </div>
        )}

        {state === "ready" && !proposal && <EmptyState title="Proposal not found" />}
      </div>

      <ConfirmModal
        isOpen={showApproveConfirm}
        onClose={() => setShowApproveConfirm(false)}
        onConfirm={handleApprove}
        title="Confirm Approval"
        message="Are you sure you want to approve this proposal?"
        confirmLabel="Confirm Approval"
        isLoading={isSubmitting}
      />

      <Modal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        title="Reject Proposal"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowRejectModal(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleReject} isLoading={isSubmitting}>
              Confirm Rejection
            </Button>
          </>
        }
      >
        <Textarea
          label="Please tell us why you are rejecting this proposal."
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          error={rejectError}
          rows={4}
          required
        />
      </Modal>

      <Modal isOpen={showChangesModal} onClose={() => setShowChangesModal(false)} title="Request Changes">
        <ObservationForm
          onSubmit={handleRequestChanges}
          onCancel={() => setShowChangesModal(false)}
          isSubmitting={isSubmitting}
        />
      </Modal>
    </div>
  );
}

function SuccessPanel({ title, message }: { title: string; message: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-gray-200 bg-white p-10 text-center shadow-sm">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-2xl text-green-600">
        ✓
      </span>
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      <p className="max-w-sm text-sm text-gray-500">{message}</p>
    </div>
  );
}
