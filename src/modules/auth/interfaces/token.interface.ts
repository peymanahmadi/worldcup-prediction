export interface TokenPayload {
  userId: string;
  phone: string;
  sessionId: string;
}

export interface DeviceInfo {
  userAgent?: string;
  ip?: string;
  platform?: string;
  browser?: string;
}

export interface SessionInfo {
  id: string;
  deviceInfo: DeviceInfo;
  createdAt: Date;
  lastUsedAt: Date | null;
  expiresAt: Date;
  isActive: boolean;
}
