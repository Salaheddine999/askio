import React, { useEffect, useState } from "react";
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import { format } from "date-fns";
import { toast } from "react-hot-toast";
import { Ban, Copy, RotateCcw, Trash2, X } from "../../components/icons";
import { apiRequest } from "../../utils/api";
import { Skeleton } from "../../components/Skeleton";
import { focusRing, primaryButton, secondaryButton } from "../dashboard/ui";
import { AdminChatbot, AdminUser, fetchAccountDetail, fetchUser } from "./data";
import { PlanBadge, UsageBar } from "./parts";
import { AiIcon } from "../../components/icons";

type Confirm = "suspend" | "delete" | null;

/** Chatbots listed before "Show all", so a big account doesn't make the panel endless. */
const BOTS_SHOWN = 8;

const inputClass =
  "w-full rounded-lg border border-ink-120 bg-ink-25 px-3 text-body-sm text-ink-900 placeholder:text-ink-425 focus:border-ink-900 focus:outline-none focus:ring-2 focus:ring-ink-900/10 dark:border-ink-780 dark:bg-ink-875 dark:text-ink-130 dark:focus:border-ink-325";

const Detail: React.FC<{ label: string; children: React.ReactNode; copy?: string }> = ({ label, children, copy }) => (
  <div className="flex items-start justify-between gap-4 py-2.5">
    <dt className="shrink-0 text-body-sm text-fg-subtle">{label}</dt>
    <dd className="flex min-w-0 items-center gap-1.5 text-end text-body-sm text-fg">
      <span className="truncate">{children}</span>
      {copy && (
        <button
          type="button"
          aria-label={`Copy ${label}`}
          onClick={() => navigator.clipboard.writeText(copy).then(() => toast.success("Copied"), () => undefined)}
          className={`shrink-0 rounded p-0.5 text-ink-425 hover:text-fg ${focusRing}`}
        >
          <Copy size={13} />
        </button>
      )}
    </dd>
  </div>
);

interface Props {
  uid: string | null;
  onClose: () => void;
  /** Called after an action, with the updated account or null once deleted. */
  onChanged: (uid: string, user: AdminUser | null) => void;
}

const AccountPanel: React.FC<Props> = ({ uid, onClose, onChanged }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [chatbots, setChatbots] = useState<AdminChatbot[] | null>(null);
  const [aiReplies, setAiReplies] = useState(0);
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [reason, setReason] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [showAllBots, setShowAllBots] = useState(false);

  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    setLoading(true);
    setConfirm(null);
    setShowAllBots(false);
    Promise.all([fetchUser(uid), fetchAccountDetail(uid)])
      .then(([u, detail]) => {
        if (cancelled) return;
        setUser(u);
        setChatbots(detail.chatbots);
        setAiReplies(detail.aiReplies);
      })
      .catch((error) => {
        console.error("Failed to load account:", error);
        if (!cancelled) toast.error("Couldn't load this account.");
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [uid]);

  const run = async (action: "admin-suspend" | "admin-unsuspend" | "admin-delete") => {
    if (!user) return;
    setBusy(true);
    try {
      await apiRequest(`/api/account/${action}`, {
        authRequired: true,
        body: { uid: user.uid, reason, confirmEmail },
      });
      if (action === "admin-delete") {
        toast.success(`Deleted ${user.email}`);
        onChanged(user.uid, null);
        onClose();
        return;
      }
      const [fresh, detail] = await Promise.all([fetchUser(user.uid), fetchAccountDetail(user.uid)]);
      setUser(fresh);
      setChatbots(detail.chatbots);
      onChanged(user.uid, fresh);
      setConfirm(null);
      setReason("");
      toast.success(action === "admin-suspend" ? "Account suspended" : "Account restored");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "That didn't work. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const periodEnd = user?.currentPeriodEnd ? new Date(user.currentPeriodEnd) : null;

  return (
    <Dialog open={uid !== null} onClose={onClose} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-ink-900/30" />
      <div className="fixed inset-0 flex justify-end">
        <DialogPanel className="flex h-full w-full max-w-md flex-col border-s border-ink-120 bg-ink-25 shadow-lg dark:border-ink-780 dark:bg-ink-850">
          <div className="flex items-start justify-between gap-4 border-b border-ink-70 px-5 py-4 dark:border-ink-780">
            <div className="min-w-0">
              <DialogTitle className="truncate text-body font-semibold text-ink-900 dark:text-ink-70">
                {user?.email || (loading ? "Loading…" : "Account")}
              </DialogTitle>
              {user && (
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <PlanBadge user={user} />
                  {user.displayName && (
                    <span className="truncate text-caption text-fg-subtle">{user.displayName}</span>
                  )}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className={`rounded-lg p-1.5 text-ink-545 hover:bg-ink-70 hover:text-ink-900 dark:text-ink-325 dark:hover:bg-ink-790 ${focusRing}`}
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4">
            {loading || !user ? (
              <div className="space-y-3">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-5 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                {user.suspended && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-body-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200">
                    Suspended. They can sign in to see why and contact you, but their chatbots are hidden and changes
                    are paused.
                    {user.suspendedReason && <span className="mt-1 block text-caption opacity-80">“{user.suspendedReason}”</span>}
                  </div>
                )}

                <dl className="divide-y divide-ink-70 dark:divide-ink-780">
                  <Detail label="Joined">{user.createdAt ? format(user.createdAt, "MMM d, yyyy") : "—"}</Detail>
                  <Detail label="Subscription">
                    {user.subscriptionStatus.charAt(0).toUpperCase() + user.subscriptionStatus.slice(1).replace("_", " ")}
                  </Detail>
                  {periodEnd && !Number.isNaN(periodEnd.getTime()) && (
                    <Detail label={user.subscriptionStatus === "cancelled" ? "Access until" : "Renews"}>
                      {format(periodEnd, "MMM d, yyyy")}
                    </Detail>
                  )}
                  {user.subscriptionId && (
                    <Detail label="Lemon subscription" copy={user.subscriptionId}>
                      <span className="font-mono text-caption">{user.subscriptionId}</span>
                    </Detail>
                  )}
                  {user.customerId && (
                    <Detail label="Lemon customer" copy={user.customerId}>
                      <span className="font-mono text-caption">{user.customerId}</span>
                    </Detail>
                  )}
                  <Detail label="User ID" copy={user.uid}>
                    <span className="font-mono text-caption">{user.uid}</span>
                  </Detail>
                </dl>

                <div>
                  <p className="mb-2 text-label text-fg">AI replies this month</p>
                  <UsageBar used={aiReplies} limit={user.aiReplyLimit} />
                </div>

                <div>
                  <p className="mb-2 text-label text-fg">
                    Chatbots <span className="font-normal text-ink-425">· {chatbots?.length ?? 0}</span>
                  </p>
                  {chatbots && chatbots.length > 0 ? (
                    <ul className="divide-y divide-ink-70 rounded-xl border border-ink-70 dark:divide-ink-780 dark:border-ink-780">
                      {(showAllBots ? chatbots : chatbots.slice(0, BOTS_SHOWN)).map((bot) => (
                        <li key={bot.id} className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                          <div className="min-w-0">
                            <p className="truncate text-body-sm font-medium text-fg" title={bot.name}>
                              {bot.name}
                            </p>
                            <p className="truncate text-caption text-fg-subtle">
                              {bot.faqCount} questions
                              {bot.lastUpdated ? ` · edited ${format(bot.lastUpdated, "MMM d")}` : ""}
                            </p>
                          </div>
                          {bot.aiEnabled && (
                            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-ink-70 px-2 py-0.5 text-caption text-ink-605 dark:bg-ink-790 dark:text-ink-325">
                              <AiIcon size={11} /> AI
                            </span>
                          )}
                        </li>
                      ))}
                      {chatbots.length > BOTS_SHOWN && (
                        <li>
                          <button
                            type="button"
                            onClick={() => setShowAllBots((v) => !v)}
                            className={`w-full px-3.5 py-2.5 text-start text-caption font-medium text-ink-605 hover:text-ink-900 dark:text-ink-325 dark:hover:text-ink-130 ${focusRing}`}
                          >
                            {showAllBots ? "Show fewer" : `Show all ${chatbots.length}`}
                          </button>
                        </li>
                      )}
                    </ul>
                  ) : (
                    <p className="text-body-sm text-fg-subtle">No chatbots yet.</p>
                  )}
                </div>

                {confirm === "suspend" && (
                  <div className="space-y-3 rounded-xl border border-ink-120 p-4 dark:border-ink-780">
                    <p className="text-body-sm text-fg">
                      Their chatbots stop showing on their sites and they can't make changes. They can still sign in,
                      where they'll see the reason below and how to contact you, and manage billing or delete their
                      account. Billing isn't touched; cancel or refund in Lemon Squeezy if needed.
                    </p>
                    <p className="text-label text-fg">
                      Reason <span className="font-normal text-ink-425">· shown to them</span>
                    </p>
                    <textarea
                      rows={3}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      maxLength={500}
                      placeholder="e.g. Your chatbot was sharing links to a fake login page, which breaks our Terms."
                      aria-label="Reason, shown to them"
                      className={`${inputClass} resize-none py-2`}
                    />
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => setConfirm(null)} className={secondaryButton}>
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={busy || reason.trim().length < 10}
                        onClick={() => run("admin-suspend")}
                        className={`${primaryButton} !bg-red-600 hover:!bg-red-700 !text-white`}
                      >
                        {busy ? "Suspending…" : "Suspend account"}
                      </button>
                    </div>
                  </div>
                )}

                {confirm === "delete" && (
                  <div className="space-y-3 rounded-xl border border-red-200 p-4 dark:border-red-900/60">
                    <p className="text-body-sm text-fg">
                      This cancels their subscription and permanently deletes the account, its chatbots and all
                      visitor data. It can't be undone. Type <span className="font-medium">{user.email}</span> to confirm.
                    </p>
                    <input
                      value={confirmEmail}
                      onChange={(e) => setConfirmEmail(e.target.value)}
                      placeholder={user.email}
                      autoComplete="off"
                      className={`${inputClass} h-10`}
                    />
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => setConfirm(null)} className={secondaryButton}>
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={busy || confirmEmail.trim().toLowerCase() !== user.email.toLowerCase()}
                        onClick={() => run("admin-delete")}
                        className={`${primaryButton} !bg-red-600 hover:!bg-red-700 !text-white`}
                      >
                        {busy ? "Deleting…" : "Delete forever"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {user && !loading && confirm === null && (
            <div className="flex flex-wrap justify-end gap-2 border-t border-ink-70 px-5 py-3 dark:border-ink-780">
              {user.suspended ? (
                <button type="button" disabled={busy} onClick={() => run("admin-unsuspend")} className={secondaryButton}>
                  <RotateCcw size={15} />
                  {busy ? "Restoring…" : "Unsuspend"}
                </button>
              ) : (
                <button type="button" onClick={() => setConfirm("suspend")} className={secondaryButton}>
                  <Ban size={15} />
                  Suspend
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setConfirmEmail("");
                  setConfirm("delete");
                }}
                className={`${secondaryButton} !text-red-600 hover:!bg-red-50 dark:!text-red-400 dark:hover:!bg-red-950/30`}
              >
                <Trash2 size={15} />
                Delete
              </button>
            </div>
          )}
        </DialogPanel>
      </div>
    </Dialog>
  );
};

export default AccountPanel;
