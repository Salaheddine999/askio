import React, { useCallback, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { Bot, Check, Copy, KeyRound, Trash2 } from "./icons";
import { apiRequest } from "../utils/api";
import { reportClientError } from "../utils/monitoring";
import { useT } from "../i18n";
import { settingsMessages } from "../i18n/messages/settings";
import { focusRing, primaryButton, secondaryButton } from "../pages/dashboard/styles";

// Settings → Connect your AI: the MCP server address, the AI apps connected
// by signing in ("Allow access", see api/_lib/oauth.js) and the API keys
// developer tools use instead (see api/mcp.js). A key is shown once, right
// after it's made; the server keeps only its hash.

/** The most keys an account can have; the server enforces it (api/_lib/apiKeys.js). */
const MAX_KEYS = 5;

type ApiKey = { id: string; name: string; hint: string; createdAt: number | null; lastUsedAt: number | null };
type NewKey = { key: string; id: string; name: string; hint: string };
type ConnectedApp = { id: string; name: string; connectedAt: number | null; lastUsedAt: number | null };

const dangerButton = `inline-flex h-9 items-center gap-2 rounded-lg bg-red-600 px-3.5 text-button text-white transition-colors hover:bg-red-700 disabled:opacity-60 ${focusRing}`;

const inputClass =
  "h-10 w-full rounded-lg border border-ink-120 bg-ink-25 px-3 text-body-sm text-ink-900 placeholder:text-ink-425 focus:border-ink-900 focus:outline-none focus:ring-2 focus:ring-ink-900/10 disabled:opacity-60 dark:border-ink-780 dark:bg-ink-875 dark:text-ink-130 dark:focus:border-ink-325 dark:focus:ring-ink-130/10";

const codeClass =
  "min-w-0 flex-1 overflow-x-auto whitespace-nowrap rounded-lg border border-ink-120 bg-ink-30 px-3 py-2 font-mono text-caption text-ink-805 dark:border-ink-780 dark:bg-ink-875 dark:text-ink-130";

const CopyLine: React.FC<{ text: string; copyLabel: string; copiedLabel: string }> = ({ text, copyLabel, copiedLabel }) => {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be refused; the text is selectable by hand.
    }
  };
  return (
    <div className="flex items-center gap-2">
      {/* Code and addresses read left to right in every language. */}
      <code dir="ltr" className={codeClass}>
        {text}
      </code>
      <button type="button" onClick={copy} className={`${secondaryButton} shrink-0`}>
        {copied ? <Check size={15} /> : <Copy size={15} />}
        {copied ? copiedLabel : copyLabel}
      </button>
    </div>
  );
};

const ApiKeysSettings: React.FC = () => {
  const t = useT(settingsMessages);
  const [keys, setKeys] = useState<ApiKey[] | null>(null);
  const [apps, setApps] = useState<ConnectedApp[] | null>(null);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState<NewKey | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const serverUrl = `${window.location.origin}/api/mcp`;
  const formatDate = (ms: number) => new Date(ms).toLocaleDateString(t.lang, { year: "numeric", month: "short", day: "numeric" });

  const load = useCallback(async () => {
    try {
      const { keys: list } = await apiRequest<{ keys: ApiKey[] }>("/api/account/api-keys-list", { authRequired: true });
      setKeys(list);
    } catch (error) {
      reportClientError(error, { area: "api-keys" });
      setKeys([]);
      toast.error(t("aiLoadFailed"));
    }
    // `t` changes with the language; the list doesn't depend on it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadApps = useCallback(async () => {
    try {
      const { apps: list } = await apiRequest<{ apps: ConnectedApp[] }>("/api/account/oauth-apps-list", { authRequired: true });
      setApps(list);
    } catch (error) {
      reportClientError(error, { area: "oauth-apps" });
      setApps([]);
      toast.error(t("aiAppsLoadFailed"));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void load();
    void loadApps();
  }, [load, loadApps]);

  const disconnect = async (id: string) => {
    setRevokingId(id);
    try {
      await apiRequest("/api/account/oauth-apps-revoke", { authRequired: true, body: { id } });
      setApps((current) => (current || []).filter((app) => app.id !== id));
      toast.success(t("aiDisconnected"));
    } catch (error) {
      reportClientError(error, { area: "oauth-apps" });
      toast.error(t("aiDisconnectFailed"));
    } finally {
      setRevokingId(null);
      setConfirmingId(null);
    }
  };

  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || creating) return;
    setCreating(true);
    try {
      const created = await apiRequest<NewKey>("/api/account/api-keys-create", {
        authRequired: true,
        body: { name: name.trim() },
      });
      setNewKey(created);
      setName("");
      setKeys((current) => [
        { id: created.id, name: created.name, hint: created.hint, createdAt: Date.now(), lastUsedAt: null },
        ...(current || []),
      ]);
    } catch (error) {
      reportClientError(error, { area: "api-keys" });
      toast.error(t("aiCreateFailed"));
    } finally {
      setCreating(false);
    }
  };

  const revoke = async (id: string) => {
    setRevokingId(id);
    try {
      await apiRequest("/api/account/api-keys-revoke", { authRequired: true, body: { id } });
      setKeys((current) => (current || []).filter((key) => key.id !== id));
      if (newKey?.id === id) setNewKey(null);
      toast.success(t("aiRevoked"));
    } catch (error) {
      reportClientError(error, { area: "api-keys" });
      toast.error(t("aiRevokeFailed"));
    } finally {
      setRevokingId(null);
      setConfirmingId(null);
    }
  };

  const atLimit = (keys?.length ?? 0) >= MAX_KEYS;
  const copyLabels = { copyLabel: t("aiCopy"), copiedLabel: t("aiCopied") };

  return (
    <>
      <div className="px-5 py-4 sm:px-6">
        <p className="text-body-sm font-medium text-fg">{t("aiServerUrl")}</p>
        <p className="mb-2 mt-0.5 text-caption text-fg-subtle">{t("aiServerUrlHint")}</p>
        <CopyLine text={serverUrl} {...copyLabels} />
      </div>

      <div className="px-5 py-4 sm:px-6">
        <p className="text-body-sm font-medium text-fg">{t("aiApps")}</p>
        <p className="mt-0.5 text-caption text-fg-subtle">{t("aiAppsHint")}</p>

        {apps !== null && apps.length === 0 && <p className="mt-3 text-body-sm text-fg-subtle">{t("aiNoApps")}</p>}

        {apps !== null && apps.length > 0 && (
          <ul className="mt-3 divide-y divide-ink-70 rounded-lg border border-ink-120 dark:divide-ink-780 dark:border-ink-780">
            {apps.map((app) => (
              <li key={app.id} className="flex flex-col gap-2 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-2.5">
                  <Bot size={15} className="shrink-0 text-fg-subtle" />
                  <div className="min-w-0">
                    <p className="truncate text-body-sm font-medium text-fg">{app.name}</p>
                    <p className="text-caption text-fg-subtle">
                      {app.connectedAt ? t("aiConnected", { date: formatDate(app.connectedAt) }) : ""}
                      {app.connectedAt && app.lastUsedAt ? " · " : ""}
                      {app.lastUsedAt ? t("aiLastUsed", { date: formatDate(app.lastUsedAt) }) : ""}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  {confirmingId === app.id ? (
                    <>
                      <button type="button" onClick={() => setConfirmingId(null)} className={secondaryButton}>
                        {t("cancel")}
                      </button>
                      <button type="button" disabled={revokingId === app.id} onClick={() => void disconnect(app.id)} className={dangerButton}>
                        {t("aiDisconnectConfirm")}
                      </button>
                    </>
                  ) : (
                    <button type="button" onClick={() => setConfirmingId(app.id)} className={secondaryButton}>
                      {t("aiDisconnect")}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="px-5 py-4 sm:px-6">
        <p className="text-body-sm font-medium text-fg">{t("aiKeys")}</p>
        <p className="mt-0.5 text-caption text-fg-subtle">{t("aiKeysHint")}</p>

        {newKey && (
          <div className="mt-3 space-y-3 rounded-lg border border-ink-120 bg-ink-30 p-3 dark:border-ink-780 dark:bg-ink-875">
            <div>
              <p className="text-body-sm font-medium text-fg">{t("aiKeyCreatedTitle")}</p>
              <p className="mt-0.5 text-caption text-fg-subtle">{t("aiKeyCreatedHint")}</p>
            </div>
            <CopyLine text={newKey.key} {...copyLabels} />
            <div>
              <p className="mb-1.5 text-caption text-fg-subtle">{t("aiClaudeCodeLabel")}</p>
              <CopyLine
                text={`claude mcp add --transport http askio ${serverUrl} --header "Authorization: Bearer ${newKey.key}"`}
                {...copyLabels}
              />
            </div>
            <div>
              <p className="mb-1.5 text-caption text-fg-subtle">{t("aiOtherLabel")}</p>
              <CopyLine text={`Authorization: Bearer ${newKey.key}`} {...copyLabels} />
            </div>
            <div className="flex justify-end">
              <button type="button" onClick={() => setNewKey(null)} className={secondaryButton}>
                {t("aiDone")}
              </button>
            </div>
          </div>
        )}

        {keys !== null && keys.length === 0 && <p className="mt-3 text-body-sm text-fg-subtle">{t("aiNoKeys")}</p>}

        {keys !== null && keys.length > 0 && (
          <ul className="mt-3 divide-y divide-ink-70 rounded-lg border border-ink-120 dark:divide-ink-780 dark:border-ink-780">
            {keys.map((key) => (
              <li key={key.id} className="flex flex-col gap-2 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-2.5">
                  <KeyRound size={15} className="shrink-0 text-fg-subtle" />
                  <div className="min-w-0">
                    <p className="truncate text-body-sm font-medium text-fg">
                      {key.name}{" "}
                      <code dir="ltr" className="font-mono text-caption font-normal text-fg-subtle">
                        {key.hint}
                      </code>
                    </p>
                    <p className="text-caption text-fg-subtle">
                      {key.createdAt ? t("aiCreated", { date: formatDate(key.createdAt) }) : ""}
                      {key.createdAt ? " · " : ""}
                      {key.lastUsedAt ? t("aiLastUsed", { date: formatDate(key.lastUsedAt) }) : t("aiNeverUsed")}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  {confirmingId === key.id ? (
                    <>
                      <button type="button" onClick={() => setConfirmingId(null)} className={secondaryButton}>
                        {t("cancel")}
                      </button>
                      <button
                        type="button"
                        disabled={revokingId === key.id}
                        onClick={() => void revoke(key.id)}
                        className={dangerButton}
                      >
                        {t("aiRevokeConfirm")}
                      </button>
                    </>
                  ) : (
                    <button type="button" onClick={() => setConfirmingId(key.id)} className={secondaryButton}>
                      <Trash2 size={15} />
                      {t("aiRevoke")}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        {atLimit ? (
          <p className="mt-3 text-caption text-fg-subtle">{t("aiKeyLimit", { count: MAX_KEYS })}</p>
        ) : (
          <form onSubmit={create} className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="min-w-0 flex-1">
              <span className="mb-1.5 block text-body-sm font-medium text-fg">{t("aiKeyName")}</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("aiKeyNamePlaceholder")}
                maxLength={60}
                className={inputClass}
              />
            </label>
            <button type="submit" disabled={!name.trim() || creating || keys === null} className={primaryButton}>
              {creating ? t("aiCreating") : t("aiCreateKey")}
            </button>
          </form>
        )}
      </div>
    </>
  );
};

export default ApiKeysSettings;
