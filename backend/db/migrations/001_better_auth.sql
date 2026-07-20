CREATE TABLE IF NOT EXISTS auth_users (
  id VARCHAR(191) PRIMARY KEY,
  name TEXT NOT NULL,
  email VARCHAR(255) NOT NULL,
  `emailVerified` BOOLEAN NOT NULL DEFAULT FALSE,
  image TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  role VARCHAR(32) NOT NULL DEFAULT 'visitor',
  `twoFactorEnabled` BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE KEY auth_users_email_unique (email),
  CONSTRAINT auth_users_role_check CHECK (role IN ('visitor', 'staff', 'admin'))
);

CREATE TABLE IF NOT EXISTS auth_sessions (
  id VARCHAR(191) PRIMARY KEY,
  `expiresAt` DATETIME(3) NOT NULL,
  token VARCHAR(255) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `ipAddress` TEXT NULL,
  `userAgent` TEXT NULL,
  `userId` VARCHAR(191) NOT NULL,
  UNIQUE KEY auth_sessions_token_unique (token),
  KEY auth_sessions_user_id_idx (`userId`),
  KEY auth_sessions_expires_at_idx (`expiresAt`),
  CONSTRAINT auth_sessions_user_fk
    FOREIGN KEY (`userId`) REFERENCES auth_users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS auth_accounts (
  id VARCHAR(191) PRIMARY KEY,
  `accountId` TEXT NOT NULL,
  `providerId` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `accessToken` TEXT NULL,
  `refreshToken` TEXT NULL,
  `idToken` TEXT NULL,
  `accessTokenExpiresAt` DATETIME(3) NULL,
  `refreshTokenExpiresAt` DATETIME(3) NULL,
  scope TEXT NULL,
  password TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY auth_accounts_provider_account_unique (`providerId`, `accountId`(191)),
  KEY auth_accounts_user_id_idx (`userId`),
  CONSTRAINT auth_accounts_user_fk
    FOREIGN KEY (`userId`) REFERENCES auth_users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS auth_verifications (
  id VARCHAR(191) PRIMARY KEY,
  identifier VARCHAR(255) NOT NULL,
  value TEXT NOT NULL,
  `expiresAt` DATETIME(3) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY auth_verifications_identifier_idx (identifier),
  KEY auth_verifications_expires_at_idx (`expiresAt`)
);

CREATE TABLE IF NOT EXISTS auth_two_factors (
  id VARCHAR(191) PRIMARY KEY,
  secret VARCHAR(255) NOT NULL,
  `backupCodes` TEXT NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT TRUE,
  `failedVerificationCount` INT NOT NULL DEFAULT 0,
  `lockedUntil` DATETIME(3) NULL,
  KEY auth_two_factors_secret_idx (secret),
  KEY auth_two_factors_user_id_idx (`userId`),
  CONSTRAINT auth_two_factors_user_fk
    FOREIGN KEY (`userId`) REFERENCES auth_users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS auth_rate_limits (
  id VARCHAR(191) PRIMARY KEY,
  `key` VARCHAR(255) NOT NULL,
  `count` INT NOT NULL,
  `lastRequest` BIGINT NOT NULL,
  UNIQUE KEY auth_rate_limits_key_unique (`key`)
);
