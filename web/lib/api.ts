// Typed API client for the OmniMarkIt FastAPI backend.
// JWT is stored in localStorage and attached to every request.

const BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:8000";

const TOKEN_KEY = "omnimarkit_token";

/** Base URL of the API — useful for building absolute links to /uploads files. */
export function apiBase(): string {
  return BASE;
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}
export function setToken(t: string) {
  window.localStorage.setItem(TOKEN_KEY, t);
}
export function clearToken() {
  window.localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const detail =
      (data && (data.detail || data.message)) || `Request failed (${res.status})`;
    const msg = Array.isArray(detail)
      ? detail.map((d: any) => d.msg || JSON.stringify(d)).join("; ")
      : String(detail);
    throw new ApiError(res.status, msg);
  }
  return data as T;
}

// ---- Types (mirror the backend Pydantic schemas) ----
export type Role = "student" | "tutor" | "admin";

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  phone?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Subject {
  id: string;
  name: string;
  category: string;
}

export interface Tutor {
  id: string;
  user_id: string;
  display_name: string;
  headline?: string | null;
  bio?: string | null;
  hourly_rate_cents: number;
  timezone: string;
  vetting_status: string;
  avg_rating: number; // x100
  total_reviews: number;
  total_sessions: number;
  subjects: { subject: Subject }[];
}

export interface SessionRow {
  id: string;
  student_id: string;
  tutor_id: string;
  subject_id: string;
  start_time: string;
  duration_minutes: number;
  price_cents: number;
  status: string;
  video_room_url?: string | null;
  created_at: string;
  tutor_name?: string;
  student_name?: string;
  subject_name?: string;
}

export interface Review {
  id: string;
  session_id: string;
  tutor_id: string;
  student_id: string;
  rating: number;
  comment?: string | null;
  tutor_response?: string | null;
  created_at: string;
  student_name?: string;
}

export interface Conversation {
  id: string;
  student_id: string;
  tutor_id: string;
  student_unread_count: number;
  tutor_unread_count: number;
  last_message_at?: string | null;
  other_party_name?: string | null;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

export interface Notification {
  id: string;
  kind: string;
  title: string;
  body?: string | null;
  is_read: boolean;
  created_at: string;
}

export interface Availability {
  id: string;
  weekday: number;
  start_minute: number;
  end_minute: number;
  timezone: string;
}

export interface Payment {
  id: string;
  session_id: string | null;
  amount_cents: number;
  platform_fee_cents: number;
  discount_cents: number;
  status: string;
  created_at: string;
}

export interface Earnings {
  gross_cents: number;
  platform_fees_cents: number;
  net_payout_cents: number;
  paid_out_cents: number;
  available_cents: number;
  payment_count: number;
}

export interface Payout {
  id: string;
  amount_cents: number;
  status: string;
  period_start?: string | null;
  period_end?: string | null;
  created_at: string;
}

export interface BillingPlan {
  id: string;
  name: string;
  description?: string | null;
  price_cents: number;
  sessions_included: number;
  is_active: boolean;
}

export interface Subscription {
  id: string;
  plan_id: string;
  status: string;
  current_period_end?: string | null;
  created_at: string;
  plan?: BillingPlan | null;
}

export interface Dispute {
  id: string;
  session_id?: string | null;
  payment_id?: string | null;
  raised_by_id: string;
  against_id?: string | null;
  category: string;
  description: string;
  status: string;
  resolution?: string | null;
  refund_amount_cents?: number | null;
  resolved_at?: string | null;
  created_at: string;
}

export interface VettingState {
  id: string;
  tutor_id: string;
  status: string;
  background_check_status: string;
  reviewer_note?: string | null;
}

export interface Credential {
  id: string;
  kind: string;
  title: string;
  institution?: string | null;
  file_url?: string | null;
  status: string;
  created_at: string;
}

export interface Material {
  id: string;
  session_id: string;
  uploader_id: string;
  title: string;
  file_url?: string | null;
  kind: string;
  created_at: string;
}

export interface Flag {
  id: string;
  session_id: string;
  reporter_id: string;
  reason: string;
  detail?: string | null;
  status: string;
  legal_hold: boolean;
  created_at: string;
}

export interface AdminAction {
  id: string;
  admin_id: string;
  action: string;
  target_type: string;
  target_id: string;
  note?: string | null;
  created_at: string;
}

export interface StudentProfile {
  id: string;
  user_id: string;
  grade_level?: string | null;
  bio?: string | null;
  timezone: string;
}

export interface AvailabilityException {
  id: string;
  date: string;
  is_available: boolean;
  start_minute?: number | null;
  end_minute?: number | null;
  reason?: string | null;
}

export interface VettingDetail {
  vetting_status: string;
  background_check_status: string;
  id_status: string;
  id_document_type?: string | null;
  teaching_philosophy?: string | null;
  credentials: Credential[];
}

export interface Recording {
  id: string;
  session_id: string;
  uploader_id: string;
  file_url: string;
  duration_seconds?: number | null;
  size_bytes?: number | null;
  free_until: string;
  price_cents: number;
  created_at: string;
  granted: boolean;
  in_free_window: boolean;
  is_paid: boolean;
  can_view: boolean;
  requires_payment: boolean;
  student_id?: string | null;
  student_name?: string | null;
  tutor_user_id?: string | null;
  tutor_name?: string | null;
  subject_name?: string | null;
  granted_user_ids: string[];
}

export interface AppConfig {
  jitsi_domain: string;
  recording_free_days: number;
  recording_price_cents: number;
  stripe_enabled: boolean;
}

interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

// Multipart PDF upload (separate from the JSON request helper).
export async function uploadPdf(file: File): Promise<{ url: string; filename: string }> {
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    throw new ApiError(400, "Only PDF files are allowed");
  }
  const form = new FormData();
  form.append("file", file);
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE}/api/uploads/pdf`, {
    method: "POST",
    headers, // no Content-Type — the browser sets the multipart boundary
    body: form,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new ApiError(res.status, (data && data.detail) || "Upload failed");
  }
  return data;
}

// Upload a recorded video blob (multipart) for a session.
export async function uploadRecording(
  sessionId: string,
  blob: Blob
): Promise<Recording> {
  const form = new FormData();
  const ext = blob.type.includes("mp4") ? "mp4" : "webm";
  form.append("file", blob, `recording.${ext}`);
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE}/api/recordings/session/${sessionId}`, {
    method: "POST",
    headers,
    body: form,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new ApiError(res.status, (data && data.detail) || "Upload failed");
  return data;
}

// Fetch a permission-gated recording as a playable object URL (sends the JWT).
export async function recordingObjectUrl(recordingId: string): Promise<string> {
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE}/api/recordings/${recordingId}/view`, { headers });
  if (!res.ok) {
    let detail = `Cannot view (${res.status})`;
    try {
      const j = await res.json();
      detail = j.detail || detail;
    } catch {
      /* ignore */
    }
    throw new ApiError(res.status, detail);
  }
  return URL.createObjectURL(await res.blob());
}

// ---- API surface ----
export const api = {
  // auth
  register: (b: {
    email: string;
    password: string;
    full_name: string;
    role: Role;
    stripe_account_id?: string;
  }) => request<AuthResponse>("POST", "/api/auth/register", b),
  login: (b: { email: string; password: string }) =>
    request<AuthResponse>("POST", "/api/auth/login", b),
  me: () => request<User>("GET", "/api/auth/me"),
  appConfig: () => request<AppConfig>("GET", "/api/config"),
  updateMe: (b: { full_name?: string; phone?: string }) =>
    request<User>("PATCH", "/api/auth/me", b),
  changePassword: (b: { current_password: string; new_password: string }) =>
    request<void>("POST", "/api/auth/change-password", b),
  forgotPassword: (email: string) =>
    request<{ message: string; reset_token?: string }>(
      "POST",
      "/api/auth/forgot-password",
      { email }
    ),
  resetPassword: (token: string, new_password: string) =>
    request<void>("POST", "/api/auth/reset-password", { token, new_password }),

  // student profile
  myStudentProfile: () => request<StudentProfile>("GET", "/api/students/me"),
  updateStudentProfile: (b: {
    grade_level?: string;
    bio?: string;
    timezone?: string;
  }) => request<StudentProfile>("PATCH", "/api/students/me", b),

  // subjects + tutors
  subjects: () => request<Subject[]>("GET", "/api/subjects/"),
  createCustomSubject: (name: string) =>
    request<Subject>("POST", "/api/subjects/custom", { name }),
  searchTutors: (params: { q?: string; subject_id?: string; max_rate_cents?: number }) => {
    const qs = new URLSearchParams();
    if (params.q) qs.set("q", params.q);
    if (params.subject_id) qs.set("subject_id", params.subject_id);
    if (params.max_rate_cents) qs.set("max_rate_cents", String(params.max_rate_cents));
    const s = qs.toString();
    return request<Tutor[]>("GET", `/api/tutors/${s ? "?" + s : ""}`);
  },
  tutor: (id: string) => request<Tutor>("GET", `/api/tutors/${id}`),
  tutorReviews: (id: string) => request<Review[]>("GET", `/api/tutors/${id}/reviews`),
  tutorAvailability: (id: string) =>
    request<Availability[]>("GET", `/api/tutors/${id}/availability`),

  // tutor self-service
  myTutorProfile: () => request<Tutor>("GET", "/api/tutors/me"),
  updateTutorProfile: (b: Record<string, unknown>) =>
    request<Tutor>("PATCH", "/api/tutors/me", b),
  earnings: () => request<Earnings>("GET", "/api/payments/earnings"),

  // tutor vetting pipeline
  myVettingState: () => request<VettingState>("GET", "/api/vetting/me"),
  myCredentials: () => request<Credential[]>("GET", "/api/vetting/me/credentials"),
  submitCredential: (b: {
    kind: string;
    title: string;
    institution?: string;
    file_url?: string;
  }) => request<Credential>("POST", "/api/vetting/me/credentials", b),
  submitIdVerification: (b: { document_type: string; document_url?: string }) =>
    request<unknown>("POST", "/api/vetting/me/id-verification", b),
  submitTeachingApproach: (b: {
    philosophy?: string;
    experience_years?: string;
    specialties?: string;
  }) => request<unknown>("POST", "/api/vetting/me/teaching-approach", b),
  startBackgroundCheck: () =>
    request<VettingState>("POST", "/api/vetting/me/background-check"),

  // sessions
  sessions: () => request<SessionRow[]>("GET", "/api/sessions/"),
  session: (id: string) => request<SessionRow>("GET", `/api/sessions/${id}`),
  bookSession: (b: {
    tutor_id: string;
    subject_id: string;
    start_time: string;
    duration_minutes: number;
  }) => request<SessionRow>("POST", "/api/sessions/", b),
  setSessionStatus: (id: string, status: string) =>
    request<SessionRow>("PATCH", `/api/sessions/${id}/status`, { status }),
  cancelSession: (id: string, reason?: string) =>
    request<SessionRow>("POST", `/api/sessions/${id}/cancel`, { reason }),
  rescheduleSession: (id: string, start_time: string) =>
    request<SessionRow>("POST", `/api/sessions/${id}/reschedule`, { start_time }),

  // shared whiteboard
  getWhiteboard: (id: string) =>
    request<{ data: string }>("GET", `/api/sessions/${id}/whiteboard`),
  putWhiteboard: (id: string, data: string) =>
    request<{ data: string }>("PUT", `/api/sessions/${id}/whiteboard`, { data }),

  // recordings
  sessionRecordings: (id: string) =>
    request<Recording[]>("GET", `/api/recordings/session/${id}`),
  myRecordings: () => request<Recording[]>("GET", "/api/recordings/mine"),
  purchaseRecording: (id: string) =>
    request<Recording>("POST", `/api/recordings/${id}/purchase`),

  // session materials + flags
  materials: (id: string) =>
    request<Material[]>("GET", `/api/sessions/${id}/materials`),
  addMaterial: (id: string, b: { title: string; file_url?: string; kind?: string }) =>
    request<Material>("POST", `/api/sessions/${id}/materials`, b),
  flagSession: (id: string, b: { reason: string; detail?: string }) =>
    request<Flag>("POST", `/api/sessions/${id}/flag`, b),

  // payments + reviews
  pay: (session_id: string, promo_code?: string, simulate_failure = false) =>
    request<Payment>("POST", "/api/payments/", {
      session_id,
      promo_code,
      simulate_failure,
    }),
  myPayments: () => request<Payment[]>("GET", "/api/payments/"),
  review: (b: { session_id: string; rating: number; comment?: string }) =>
    request<Review>("POST", "/api/reviews/", b),
  respondToReview: (reviewId: string, response: string) =>
    request<Review>("POST", `/api/reviews/${reviewId}/respond`, { response }),

  // tutor availability management
  myAvailability: () => request<Availability[]>("GET", "/api/tutors/me/availability"),
  addAvailability: (b: { weekday: number; start_minute: number; end_minute: number }) =>
    request<Availability>("POST", "/api/tutors/me/availability", b),
  deleteAvailability: (slotId: string) =>
    request<void>("DELETE", `/api/tutors/me/availability/${slotId}`),
  myExceptions: () =>
    request<AvailabilityException[]>("GET", "/api/scheduling/me/exceptions"),
  addException: (b: {
    date: string;
    is_available: boolean;
    reason?: string;
  }) => request<AvailabilityException>("POST", "/api/scheduling/me/exceptions", b),

  // payouts + payment methods
  payouts: () => request<Payout[]>("GET", "/api/payments/payouts"),
  requestPayout: () => request<Payout>("POST", "/api/payments/payouts"),

  // billing
  plans: () => request<BillingPlan[]>("GET", "/api/billing/plans"),
  subscribe: (plan_id: string) =>
    request<Subscription>("POST", "/api/billing/subscribe", { plan_id }),
  mySubscription: () => request<Subscription | null>("GET", "/api/billing/subscription"),
  cancelSubscription: () => request<void>("DELETE", "/api/billing/subscription"),

  // disputes
  myDisputes: () => request<Dispute[]>("GET", "/api/disputes/"),
  createDispute: (b: {
    category: string;
    description: string;
    session_id?: string;
    payment_id?: string;
  }) => request<Dispute>("POST", "/api/disputes/", b),

  // messaging
  conversations: () => request<Conversation[]>("GET", "/api/conversations/"),
  startConversation: (tutor_user_id: string) =>
    request<Conversation>("POST", "/api/conversations/", { tutor_user_id }),
  messages: (cid: string) =>
    request<Message[]>("GET", `/api/conversations/${cid}/messages`),
  sendMessage: (cid: string, body: string) =>
    request<Message>("POST", `/api/conversations/${cid}/messages`, { body }),

  // notifications
  notifications: () => request<Notification[]>("GET", "/api/notifications/"),
  markNotificationRead: (id: string) =>
    request<Notification>("POST", `/api/notifications/${id}/read`),

  // admin
  vettingQueue: () => request<Tutor[]>("GET", "/api/admin/vetting-queue"),
  decideVetting: (tutorId: string, decision: "approve" | "reject", note?: string) =>
    request<Tutor>("POST", `/api/admin/tutors/${tutorId}/vetting`, { decision, note }),
  adminUsers: (role?: string) =>
    request<User[]>("GET", `/api/admin/users${role ? "?role=" + role : ""}`),
  setUserActive: (userId: string, is_active: boolean) =>
    request<User>("POST", `/api/admin/users/${userId}/active`, { is_active }),
  adminDisputes: (status?: string) =>
    request<Dispute[]>("GET", `/api/admin/disputes${status ? "?status=" + status : ""}`),
  resolveDispute: (
    disputeId: string,
    b: { decision: "resolved" | "rejected"; resolution: string; refund_amount_cents?: number }
  ) => request<Dispute>("POST", `/api/admin/disputes/${disputeId}/resolve`, b),
  flaggedSessions: () => request<Flag[]>("GET", "/api/admin/flagged-sessions"),
  resolveFlag: (flagId: string, legal_hold: boolean) =>
    request<Flag>("POST", `/api/admin/flags/${flagId}/resolve?legal_hold=${legal_hold}`),
  adminActions: () => request<AdminAction[]>("GET", "/api/admin/actions"),
  tutorCredentials: (tutorId: string) =>
    request<Credential[]>("GET", `/api/admin/tutors/${tutorId}/credentials`),
  tutorVettingDetail: (tutorId: string) =>
    request<VettingDetail>("GET", `/api/admin/tutors/${tutorId}/vetting-detail`),
  adminRecordings: () => request<Recording[]>("GET", "/api/admin/recordings"),
  grantRecording: (recordingId: string, user_id: string) =>
    request<Recording>("POST", `/api/admin/recordings/${recordingId}/grant`, { user_id }),
  revokeRecording: (recordingId: string, user_id: string) =>
    request<void>("POST", `/api/admin/recordings/${recordingId}/revoke`, { user_id }),
  dbOverview: () =>
    request<{ tables: Record<string, number>; total_tables: number }>(
      "GET",
      "/api/admin/db-overview"
    ),
};
