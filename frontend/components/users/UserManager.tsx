"use client";

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
import {
  UserInput,
  bulkDeleteUsers,
  createUser,
  deleteUser,
  listUsers,
  permanentlyDeleteUser,
  updateUser,
} from "@/services/users";
import { User } from "@/types";
import { formatDate } from "@/utils/format";
import { isValidEmail, required } from "@/utils/validators";

function emptyForm(): UserInput {
  return { name: "", email: "", phone: "", role: "MANAGER", company: null, password: "" };
}

/** Manages Manager accounts. Company logins are managed automatically via the Company itself. */
export function UserManager() {
  const { showToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<UserInput>(emptyForm());
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const load = async (targetPage = page) => {
    setIsLoading(true);
    setError("");
    setSelectedIds(new Set());
    try {
      const params: Record<string, string> = { page: String(targetPage), role: "MANAGER" };
      if (search) params.search = search;
      const data = await listUsers(params);
      setUsers(data.results);
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

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setFormErrors({});
    setShowModal(true);
  };

  const openEdit = (user: User) => {
    setEditingId(user.id);
    setForm({ name: user.name, email: user.email, phone: user.phone, role: "MANAGER", company: null, password: "" });
    setFormErrors({});
    setShowModal(true);
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!required(form.name)) errs.name = "Name is required.";
    if (!isValidEmail(form.email)) errs.email = "Enter a valid email address.";
    if (!editingId && !form.password) errs.password = "Password is required.";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const payload = { ...form };
      if (editingId && !payload.password) delete payload.password;
      if (editingId) {
        await updateUser(editingId, payload);
        showToast("Manager updated successfully.", "success");
      } else {
        await createUser(payload);
        showToast("Manager created successfully.", "success");
      }
      setShowModal(false);
      load(editingId ? page : 1);
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

  const handleDeactivate = async () => {
    if (!deactivateTarget) return;
    try {
      await deleteUser(deactivateTarget.id);
      showToast("Manager deactivated.", "success");
      setDeactivateTarget(null);
      load(page);
    } catch (e) {
      showToast(extractErrorMessage(e), "error");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await permanentlyDeleteUser(deleteTarget.id);
      showToast("Manager permanently deleted.", "success");
      setDeleteTarget(null);
      load(1);
    } catch (e) {
      showToast(extractErrorMessage(e), "error");
    } finally {
      setIsDeleting(false);
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
    setSelectedIds((prev) => (users.every((u) => prev.has(u.id)) ? new Set() : new Set(users.map((u) => u.id))));
  };

  const handleBulkDelete = async () => {
    setIsBulkDeleting(true);
    try {
      const { deleted_count, skipped_count } = await bulkDeleteUsers(Array.from(selectedIds));
      showToast(
        skipped_count > 0
          ? `${deleted_count} deleted, ${skipped_count} skipped (your own account can't be deleted this way).`
          : `${deleted_count} manager(s) deleted.`,
        "success"
      );
      setShowBulkDeleteConfirm(false);
      load(1);
    } catch (e) {
      showToast(extractErrorMessage(e), "error");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const columns: Column<User>[] = [
    { header: "Name", render: (u) => <span className="font-medium text-gray-900">{u.name}</span> },
    { header: "Email", render: (u) => u.email },
    { header: "Phone", render: (u) => u.phone || "—" },
    {
      header: "Status",
      render: (u) => (
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${
            u.is_active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
          }`}
        >
          {u.is_active ? "Active" : "Inactive"}
        </span>
      ),
    },
    { header: "Created", render: (u) => formatDate(u.created_at) },
    {
      header: "Actions",
      render: (u) => (
        <div className="flex gap-3">
          <button className="text-sm font-medium text-blue-600 hover:underline" onClick={() => openEdit(u)}>
            Edit
          </button>
          {u.is_active && (
            <button
              className="text-sm font-medium text-red-600 hover:underline"
              onClick={() => setDeactivateTarget(u)}
            >
              Deactivate
            </button>
          )}
          <button className="text-sm font-medium text-red-600 hover:underline" onClick={() => setDeleteTarget(u)}>
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Input placeholder="Search managers..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-64" />
        <div className="flex gap-2">
          {selectedIds.size > 0 && (
            <Button variant="danger" onClick={() => setShowBulkDeleteConfirm(true)}>
              Delete Selected ({selectedIds.size})
            </Button>
          )}
          <Button onClick={openCreate}>Add Manager</Button>
        </div>
      </div>

      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={() => load(page)} />
      ) : users.length === 0 ? (
        <EmptyState title="No managers yet" />
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <DataTable
            columns={columns}
            rows={users}
            keyField={(u) => u.id}
            selection={{ selectedIds, onToggleRow: toggleRow, onToggleAll: toggleAll }}
          />
          <Pagination
            page={page}
            hasNext={users.length > 0 && page * 20 < count}
            hasPrevious={page > 1}
            onPageChange={load}
            totalCount={count}
          />
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingId ? "Edit Manager" : "Add Manager"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} isLoading={isSubmitting}>
              {editingId ? "Save Changes" : "Create Manager"}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={formErrors.name} />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            error={formErrors.email}
          />
          <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <div>
            <Input
              label={editingId ? "New Password (leave blank to keep current)" : "Password"}
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              error={formErrors.password}
            />
            {!formErrors.password && (
              <p className="mt-1 text-xs text-gray-400">
                At least 8 characters. Avoid all-numeric or common passwords (e.g. &quot;12345678&quot;).
              </p>
            )}
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={!!deactivateTarget}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={handleDeactivate}
        title="Deactivate Manager"
        message={`Are you sure you want to deactivate ${deactivateTarget?.name}? They will no longer be able to log in.`}
        confirmLabel="Deactivate"
        isDangerous
      />

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Permanently Delete Manager"
        message={`This will permanently delete ${deleteTarget?.name} and cannot be undone. Their proposal history stays intact. Use Deactivate instead if you might need this account again.`}
        confirmLabel="Delete Permanently"
        isDangerous
        isLoading={isDeleting}
      />

      <ConfirmModal
        isOpen={showBulkDeleteConfirm}
        onClose={() => setShowBulkDeleteConfirm(false)}
        onConfirm={handleBulkDelete}
        title="Delete Selected Managers"
        message={`This will permanently delete ${selectedIds.size} selected manager(s). This cannot be undone.`}
        confirmLabel="Delete Permanently"
        isDangerous
        isLoading={isBulkDeleting}
      />
    </div>
  );
}
