export type UserRole = "MAIN_ADMIN" | "MANAGER" | "COMPANY_USER";

export type ProposalStatus =
  | "DRAFT"
  | "SENT"
  | "PENDING_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "CHANGES_REQUESTED"
  | "RESUBMITTED";

export type CompanyStatus = "ACTIVE" | "INACTIVE";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  company: string | null;
  company_name: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: string;
  company_name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  status: CompanyStatus;
  user_count: number;
  login_email: string | null;
  login_status: "active" | "invite_pending" | "none";
  proposal_count: number;
  created_at: string;
  updated_at: string;
}

export interface ProposalAttachment {
  id: string;
  file: string;
  file_name: string;
  uploaded_at: string;
}

export interface Proposal {
  id: string;
  title: string;
  company: string;
  company_detail?: Company;
  company_user: string | null;
  company_user_name: string | null;
  company_user_email: string | null;
  manager: string | null;
  manager_name: string | null;
  message: string;
  status: ProposalStatus;
  created_by: string | null;
  created_by_name: string | null;
  attachments: ProposalAttachment[];
  review_url: string | null;
  whatsapp_link: string | null;
  created_at: string;
  updated_at: string;
  sent_at: string | null;
  approved_at: string | null;
  rejected_at: string | null;
}

export interface Observation {
  id: string;
  proposal: string;
  submitted_by: string | null;
  submitted_by_name: string;
  observation: string;
  created_at: string;
}

export interface ProposalHistoryItem {
  id: string;
  proposal: string;
  proposal_title: string;
  action: string;
  old_status: string;
  new_status: string;
  performed_by: string | null;
  performed_by_name: string;
  notes: string;
  created_at: string;
}

export interface ReviewProposal {
  id: string;
  title: string;
  company_name: string;
  contact_person: string;
  phone: string;
  message: string;
  status: ProposalStatus;
  attachments: ProposalAttachment[];
  observations: Observation[];
  sent_at: string | null;
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface AdminDashboard {
  total_companies: number;
  total_managers: number;
  total_company_users: number;
  total_proposals: number;
  pending_review: number;
  approved: number;
  rejected: number;
  changes_requested: number;
  recent_activity: ProposalHistoryItem[];
}

export interface ManagerDashboard {
  my_proposals: number;
  pending_review: number;
  approved: number;
  rejected: number;
  changes_requested: number;
  recent_activity: ProposalHistoryItem[];
}

export interface CompanyDashboard {
  pending_review: number;
  approved: number;
  rejected: number;
  changes_requested: number;
}

export interface ApiError {
  error: {
    message: string;
    details?: Record<string, string[]> | null;
  };
}
