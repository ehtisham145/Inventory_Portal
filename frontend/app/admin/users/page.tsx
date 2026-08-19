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
import { Select } from "@/components/ui/Select";
import { useToast } from "@/hooks/useToast";
import { extractErrorMessage, extractFieldErrors } from "@/lib/api";
import {
  UserInput,
  bulkDeleteUsers,
  deleteUser,
  listUsers,
  permanentlyDeleteUser,
  updateUser,
} from "@/services/users";
import { User, UserRole } from "@/types";
import { formatDate } from "@/utils/format";
import { isValidEmail, required } from "@/utils/validators";

const ROLE_LABELS: Record<UserRole, string> = {
  MAIN_ADMIN: "Main Admin",
  MANAGER: "Manager",
  COMPANY_USER: "Company User",
};

const ROLE_FILTER_OPTIONS = [
  { label: "Main Admin", value: "MAIN_ADMIN" },
  { label: "Manager", value: "MANAGER" },
  { label: "Company User", value: "COMPANY_USER" },
];

const ROLE_BADGE_STYLES: Record<UserRole, string> = {
  MAIN_ADMIN: "bg-purple-50 text-purple-700",
  MANAGER: "bg-blue-50 text-blue-700",
  COMPANY_USER: "bg-teal-50 text-teal-700",
};

type EditForm = Pick<UserInput, "name" | "email" | "phone" | "password">;

export default function AllUsersPage() {
  const { showToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState<EditForm>({ name: "", email: "", phone: "", password: "" });
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
      const params: Record<string, string> = { page: String(targetPage) };
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
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
  }, [search, roleFilter]);

  const openEdit = (user: User) => {
    setEditingUser(user);
    setForm({ name: user.name, email: user.email, phone: user.phone, password: "" });
    setFormErrors({});
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!required(form.name ?? "")) errs.name = "Name is required.";
    if (!isValidEmail(form.email ?? "")) errs.email = "Enter a valid email address.";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!editingUser || !validate()) return;
    setIsSubmitting(true);
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;
      await updateUser(editingUser.id, payload);
      showToast("User updated successfully.", "success");
      setEditingUser(null);
      load(page);
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
      showToast("User deactivated.", "success");
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
      showToast("User permanently deleted.", "success");
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
          ? `${deleted_count} deleted, ${skipped_count} skipped (your own account and Main Admins can't be deleted this way).`
          : `${deleted_count} user(s) deleted.`,
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
      header: "Role",
      render: (u) => (
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${ROLE_BADGE_STYLES[u.role]}`}>
          {ROLE_LABELS[u.role]}
        </span>
      ),
    },
    { header: "Company", render: (u) => u.company_name || "—" },
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
          {u.role !== "MAIN_ADMIN" && u.is_active && (
            <button
              className="text-sm font-medium text-red-600 hover:underline"
              onClick={() => setDeactivateTarget(u)}
            >
              Deactivate
            </button>
          )}
          {u.role !== "MAIN_ADMIN" && (
            <button className="text-sm font-medium text-red-600 hover:underline" onClick={() => setDeleteTarget(u)}>
              Delete
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Input placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-64" />
          <Select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            placeholder="All roles"
            options={ROLE_FILTER_OPTIONS}
            className="w-44"
          />
        </div>
        {selectedIds.size > 0 && (
          <Button variant="danger" onClick={() => setShowBulkDeleteConfirm(true)}>
            Delete Selected ({selectedIds.size})
          </Button>
        )}
      </div>

      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={() => load(page)} />
      ) : users.length === 0 ? (
        <EmptyState title="No users found" />
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
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        title={`Edit ${editingUser ? ROLE_LABELS[editingUser.role] : "User"}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditingUser(null)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSave} isLoading={isSubmitting}>
              Save Changes
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            error={formErrors.name}
          />
          <Input
            label="Email"
            type="email"
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
          <div>
            <Input
              label="New Password (leave blank to keep current)"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              error={formErrors.password}
            />
            {!formErrors.password && (
              <p className="mt-1 text-xs text-gray-400">
                At least 8 characters. Avoid all-numeric or common passwords.
              </p>
            )}
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={!!deactivateTarget}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={handleDeactivate}
        title="Deactivate User"
        message={`Are you sure you want to deactivate ${deactivateTarget?.name}? They will no longer be able to log in.`}
        confirmLabel="Deactivate"
        isDangerous
      />

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Permanently Delete User"
        message={`This will permanently delete ${deleteTarget?.name} and cannot be undone.`}
        confirmLabel="Delete Permanently"
        isDangerous
        isLoading={isDeleting}
      />

      <ConfirmModal
        isOpen={showBulkDeleteConfirm}
        onClose={() => setShowBulkDeleteConfirm(false)}
        onConfirm={handleBulkDelete}
        title="Delete Selected Users"
        message={`This will permanently delete ${selectedIds.size} selected user(s). This cannot be undone.`}
        confirmLabel="Delete Permanently"
        isDangerous
        isLoading={isBulkDeleting}
      />
    </div>
  );
}
