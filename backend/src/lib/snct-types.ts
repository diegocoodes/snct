export type UserRole =
  | "admin"
  | "staff"
  | "avaliador"
  | "professor"
  | "visitante"
  | "aluno";

export type RoleCodigo =
  | "ADMINISTRADOR"
  | "STAFF"
  | "AVALIADOR"
  | "PROFESSOR"
  | "VISITANTE"
  | "ALUNO";

export type CheckinMetodo = "QRCODE" | "NOME" | "EMAIL" | "CPF" | "MANUAL";

export type StoredUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleId: number;
  roleCodigo: RoleCodigo;
  roleNome?: string;
  telefone?: string;
  cpf?: string;
  dataNascimento?: string;
  foto?: string;
  aceitouDireitoImagem?: boolean;
  dataAceiteDireitoImagem?: string;
  qrCodeHash?: string;
  visitorHash?: string;
  ativo?: boolean;
  age?: number;
  emailVerified?: boolean;
  twoFactorEnabled?: boolean;
  createdAt: string;
  checkedInAt?: string;
  giftDeliveredAt?: string;
  privacyAcceptedAt?: string;
  privacyVersion?: string;
  guardianConsentAt?: string;
  qrExpiresAt?: string;
  qrRevokedAt?: string;
  checkinHoje?: boolean;
};

export type PublicUser = StoredUser;

export type StaffUserView = {
  id: string;
  nomeCompleto: string;
  email: string;
  telefoneMascarado: string;
  cpfMascarado: string;
  foto?: string;
  role: UserRole;
  roleCodigo: RoleCodigo;
  roleNome: string;
  ativo: boolean;
  checkinHoje: boolean;
  historicoCheckins: CheckinRecord[];
};

export type CheckinRecord = {
  id: string;
  usuarioId: string;
  dataCheckin: string;
  horarioCheckin: string;
  realizadoPorUsuarioId: string;
  metodo: CheckinMetodo;
  createdAt: string;
};

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
  dadosAnteriores?: Record<string, unknown> | null;
  dadosNovos?: Record<string, unknown> | null;
  createdAt: string;
};

export type RoleChangeRecord = {
  id: number;
  usuarioId: string;
  roleAnteriorId: number | null;
  roleNovaId: number;
  roleAnteriorCodigo?: RoleCodigo | null;
  roleNovaCodigo?: RoleCodigo;
  alteradoPorUsuarioId: string | null;
  motivo?: string | null;
  createdAt: string;
};
