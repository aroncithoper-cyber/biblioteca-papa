export const ADMIN_EMAILS = [
  "aroncithoper@gmail.com",
  "e_perezleon@hotmail.com",
] as const;

export function isAdminEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  const normalized = email.toLowerCase();
  return (ADMIN_EMAILS as readonly string[]).includes(normalized);
}
