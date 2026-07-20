export type UserRole = "visitor" | "staff" | "admin";

export type StoredUser = {
  id: string;
  name: string;
  email: string;
  age?: number;
  role: Exclude<UserRole, "admin">;
  passwordHash: string;
  visitorHash?: string;
  createdAt: string;
  checkedInAt?: string;
  giftDeliveredAt?: string;
};

export type PublicUser = Omit<StoredUser, "passwordHash">;

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
  expiresAt: number;
};
