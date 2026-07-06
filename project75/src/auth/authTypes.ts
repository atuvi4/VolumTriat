export type AuthStatus = 'disabled' | 'loading' | 'signed_out' | 'signed_in' | 'error';

export interface ProjectUser {
  id: string;
  email: string | null;
}
