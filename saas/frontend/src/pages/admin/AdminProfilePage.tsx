import { useCallback, useState, type FormEvent } from 'react';
import { changePasswordRequest, setPasswordRequest } from '../../api/auth';
import { Button } from '../../components/ui/Button';
import { FormFeedback } from '../../components/ui/FormFeedback';
import { PasswordInput } from '../../components/ui/PasswordInput';
import { useAuth } from '../../hooks/useAuth';
import { getRequestErrorMessage } from '../../lib/errors';

export function AdminProfilePage() {
  const { user, refreshUser } = useAuth();
  const [copiedId, setCopiedId] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [pwdSuccess, setPwdSuccess] = useState<string | null>(null);
  const [pwdSubmitting, setPwdSubmitting] = useState(false);
  const [addPassword, setAddPassword] = useState('');
  const [addPasswordConfirm, setAddPasswordConfirm] = useState('');
  const [addPwdError, setAddPwdError] = useState<string | null>(null);
  const [addPwdSubmitting, setAddPwdSubmitting] = useState(false);
  /** Shown under "Change password" after first-time set + refresh (set-password UI unmounts). */
  const [passwordSetupSuccessMessage, setPasswordSetupSuccessMessage] = useState<string | null>(null);

  const copyIdentifier = useCallback(async () => {
    const id = user?.userId;
    if (!id) return;
    try {
      await navigator.clipboard.writeText(id);
      setCopiedId(true);
      window.setTimeout(() => setCopiedId(false), 2000);
    } catch {
      /* clipboard may be denied */
    }
  }, [user?.userId]);

  const submitChangePassword = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setPwdError(null);
      setPwdSuccess(null);
      if (newPassword !== confirmNewPassword) {
        setPwdError('New passwords do not match');
        return;
      }
      if (newPassword.length < 8) {
        setPwdError('New password must be at least 8 characters');
        return;
      }
      setPwdSubmitting(true);
      try {
        const res = await changePasswordRequest(currentPassword, newPassword, confirmNewPassword);
        setPasswordSetupSuccessMessage(null);
        setPwdSuccess(res.message);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      } catch (err) {
        setPwdError(getRequestErrorMessage(err));
      } finally {
        setPwdSubmitting(false);
      }
    },
    [currentPassword, newPassword, confirmNewPassword],
  );

  const submitSetPassword = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setAddPwdError(null);
      if (addPassword !== addPasswordConfirm) {
        setAddPwdError('New passwords do not match');
        return;
      }
      if (addPassword.length < 8) {
        setAddPwdError('Password must be at least 8 characters');
        return;
      }
      setAddPwdSubmitting(true);
      try {
        const res = await setPasswordRequest(addPassword, addPasswordConfirm);
        setAddPassword('');
        setAddPasswordConfirm('');
        await refreshUser();
        setPasswordSetupSuccessMessage(res.message);
      } catch (err) {
        setAddPwdError(getRequestErrorMessage(err));
      } finally {
        setAddPwdSubmitting(false);
      }
    },
    [addPassword, addPasswordConfirm, refreshUser],
  );

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-primary">Account</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">Profile</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Your account details for this workspace.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm dark:border-slate-700/80 dark:bg-slate-900/80 dark:shadow-none">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Identity</h2>
        <dl className="mt-4 space-y-4">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-500">Identifier</dt>
            <dd className="mt-1 flex flex-wrap items-center gap-2">
              <code className="break-all rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                {user?.userId ?? '—'}
              </code>
              {user?.userId ? (
                <button
                  type="button"
                  onClick={copyIdentifier}
                  className="shrink-0 rounded-lg border border-slate-200/90 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  {copiedId ? 'Copied' : 'Copy'}
                </button>
              ) : null}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-500">Username</dt>
            <dd className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">@{user?.username ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-500">Email</dt>
            <dd className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">{user?.email ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-500">Email status</dt>
            <dd className="mt-1">
              {user?.emailVerified ? (
                <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                  Verified
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:text-amber-300">
                  Not verified
                </span>
              )}
            </dd>
          </div>
        </dl>
      </div>

      {user?.hasPassword ? (
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm dark:border-slate-700/80 dark:bg-slate-900/80 dark:shadow-none">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Change password</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Enter your current password, then choose a new one.
          </p>
          <form className="mt-4 space-y-4" onSubmit={submitChangePassword}>
            <PasswordInput
              name="currentPassword"
              label="Current password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
            <PasswordInput
              name="newPassword"
              label="New password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={8}
              required
            />
            <PasswordInput
              name="confirmNewPassword"
              label="Confirm new password"
              autoComplete="new-password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              minLength={8}
              required
            />
            <FormFeedback variant="error" message={pwdError} />
            <FormFeedback
              variant="success"
              message={
                pwdError ? null : pwdSuccess ?? passwordSetupSuccessMessage
              }
            />
            <Button type="submit" disabled={pwdSubmitting}>
              {pwdSubmitting ? 'Updating…' : 'Update password'}
            </Button>
          </form>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm dark:border-slate-700/80 dark:bg-slate-900/80 dark:shadow-none">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Set a password</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            You signed in with Google. Add a password if you want to sign in with email and password as well.
          </p>
          <form className="mt-4 space-y-4" onSubmit={submitSetPassword}>
            <PasswordInput
              name="addPassword"
              label="New password"
              autoComplete="new-password"
              value={addPassword}
              onChange={(e) => setAddPassword(e.target.value)}
              minLength={8}
              required
            />
            <PasswordInput
              name="addPasswordConfirm"
              label="Confirm new password"
              autoComplete="new-password"
              value={addPasswordConfirm}
              onChange={(e) => setAddPasswordConfirm(e.target.value)}
              minLength={8}
              required
            />
            <FormFeedback variant="error" message={addPwdError} />
            <Button type="submit" disabled={addPwdSubmitting}>
              {addPwdSubmitting ? 'Saving…' : 'Set password'}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
