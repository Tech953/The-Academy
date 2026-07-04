const SAVED_EMAILS_KEY = 'academy-saved-email-ids';

export function loadSavedEmailIds(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(SAVED_EMAILS_KEY) || '[]')); }
  catch { return new Set(); }
}

export function persistSavedEmailIds(ids: Set<string>): void {
  localStorage.setItem(SAVED_EMAILS_KEY, JSON.stringify([...ids]));
}

export function toggleSavedEmailId(emailId: string): boolean {
  const ids = loadSavedEmailIds();
  const wasAdded = !ids.has(emailId);
  if (wasAdded) ids.add(emailId); else ids.delete(emailId);
  persistSavedEmailIds(ids);
  return wasAdded;
}

export function isEmailSaved(emailId: string): boolean {
  return loadSavedEmailIds().has(emailId);
}
