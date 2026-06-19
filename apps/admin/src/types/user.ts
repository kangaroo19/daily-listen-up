import type { Timestamp } from 'firebase/firestore';

export type AdminUser = {
  userId: string;
  userKey: string;
  loggedInAt: Timestamp | null;
};
