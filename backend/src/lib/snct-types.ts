export type UserRole = "visitor" | "staff" | "admin";

export type StoredUser = {
  id: string;
  name: string;
  email: string;
  age?: number;
  role: UserRole;
  emailVerified?: boolean;
  twoFactorEnabled?: boolean;
  visitorHash?: string;
  createdAt: string;
  checkedInAt?: string;
  giftDeliveredAt?: string;
  privacyAcceptedAt?: string;
  privacyVersion?: string;
  guardianConsentAt?: string;
  qrExpiresAt?: string;
  qrRevokedAt?: string;
};

export type PublicUser = StoredUser;

export type ManagedEvent = {
  id: string;
  date: string;
  time: string;
  title: string;
  location: string;
};

export type ManagedPartner = {
  id: string;
  name: string;
  logo: string;
};

export type ManagedNoticeDocument = {
  id: string;
  name: string;
  storageName: string;
  mimeType: string;
  size: number;
};

export type ManagedNotice = {
  id: string;
  title: string;
  registration: string;
  status: "aberto" | "encerrado";
  documents: ManagedNoticeDocument[];
};

export type SiteSettings = {
  eventEdition: string;
  heroImageUrl: string;
};

export type SnctStore = {
  users: StoredUser[];
  events: ManagedEvent[];
  notices: ManagedNotice[];
  partners: ManagedPartner[];
  settings: SiteSettings;
};

export type SessionData = {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  emailVerified: boolean;
  mfaEnabled: boolean;
  expiresAt: number;
};

export type AuditLog = {
  id: number;
  actorId: string | null;
  actorRole: UserRole | null;
  action: string;
  entity: string;
  entityId: string | null;
  outcome: "success" | "failure" | "blocked";
  metadata: Record<string, unknown>;
  createdAt: string;
};
