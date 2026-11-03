import {
  StrictMode,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { createRoot } from "react-dom/client";
import { family, title, UI } from "./family";
import { ReadinessDashboard } from "./readiness";
import { InventoryUpdates } from "./inventory-updates";
import { ReviewQueue } from "./review-queue";
import { ReadinessReviews } from "./readiness-review";
import { ImportRegistry } from "./import-registry";
import { ReadingRoom } from "./reading-room";
import { ConflictRecovery } from "./conflict-recovery";
import { writeDraft, removeDraft } from "./draft-storage.mjs";
import { useBrowserDrafts } from "./use-browser-drafts";
import type { StoredDraft } from "./draft-types";
import { WorkbenchSettings } from "./settings";
import { readPreferences } from "./preferences.mjs";
import { RevisionReview } from "./revisions";
import "@martlet/react/styles.css";
import "@krigsvold/react/styles.css";
import "@martlet/core/fonts.css";
import "@krigsvold/core/fonts.css";
import {
  categories,
  maturities,
  platforms,
  filterRecords,
  sortRecords,
  newDraft,
  toDraft,
  validateDraft,
  cleanDraft,
  compareDrafts,
} from "./contract.mjs";
import { api, ApiError } from "./api";
import type { ComponentRecord, Draft, HistoryEntry } from "./types";
import "./workbench.css";

const {
  AppShell,
  Button,
  Field,
  TextInput,
  Select,
  Textarea,
  Notice,
  Badge,
  DataTable,
  Dialog,
  Checkbox,
  Fieldset,
  ErrorSummary,
} = UI;
const initialRecordId = new URLSearchParams(location.search).get("record");
function storedMode(): "light" | "dark" {
  try {
    return localStorage.getItem("workbench-mode") === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}
function App() {
  const [preferences, setPreferences] = useState(() => {
    try {
      return readPreferences(localStorage);
    } catch {
      return readPreferences({
        getItem: () => {
          throw new Error("Storage unavailable");
        },
      });
    }
  });
  const [settingsDirty, setSettingsDirty] = useState(false);
  const queueEntryRequest = useRef<AbortController | null>(null);
  const [queueEntry, setQueueEntry] = useState<{
    id: string;
    failed: boolean;
  } | null>(null);
  const queueEntryError = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (queueEntry?.failed) queueEntryError.current?.focus();
  }, [queueEntry]);
  useEffect(() => () => queueEntryRequest.current?.abort(), []);
  const [checkingCreation, setCheckingCreation] = useState(false);
  const [creationCandidate, setCreationCandidate] =
    useState<ComponentRecord | null>(null);
  const [draftRestore, setDraftRestore] = useState<string | null>(null);
  const draftRequest = useRef<AbortController | null>(null);
  const [draftFailure, setDraftFailure] = useState("");
  const draftFeedback = useRef<HTMLDivElement>(null);
  const [queueSearch, setQueueSearch] = useState(location.search);
  const [mode, setMode] = useState(storedMode);
  const [records, setRecords] = useState<ComponentRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [query, setQuery] = useState("");
  const [maturity, setMaturity] = useState("");
  const [platform, setPlatform] = useState("");
  const [view, setView] = useState(
    [
      "inventory",
      "overview",
      "updates",
      "reading",
      "import",
      "review",
      "queue",
      "settings",
    ].includes(new URLSearchParams(location.search).get("view") ?? "")
      ? new URLSearchParams(location.search).get("view")!
      : preferences.value.defaultView,
  );
  const [evidence, setEvidence] = useState("");
  const [sortKey, setSortKey] = useState<"name" | "maturity" | "updatedAt">(
    "name",
  );
  const [direction, setDirection] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(preferences.value.pageSize);
  const [editing, setEditing] = useState(false);
  const [restoredBase, setRestoredBase] = useState<ComponentRecord | null>(
    null,
  );
  const [reviewDirty, setReviewDirty] = useState(false);
  const [draft, setDraft] = useState<Draft>(newDraft() as Draft);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [failure, setFailure] = useState("");
  const [conflict, setConflict] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const [recoveryOpen, setRecoveryOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [pending, setPending] = useState<(() => void) | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyError, setHistoryError] = useState("");
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyRetry, setHistoryRetry] = useState(0);
  const [draftSource, setDraftSource] = useState<number | null>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLElement>(null);
  const pendingFocus = useRef<"editor" | "main" | null>(null);
  useLayoutEffect(() => {
    const target = pendingFocus.current;
    if (target === "editor") editorRef.current?.focus();
    if (target === "main") document.getElementById("main")?.focus();
    pendingFocus.current = null;
  });
  const selected = records.find((record) => record.id === selectedId) ?? null;
  const editingBase =
    editing && restoredBase?.id === selectedId ? restoredBase : selected;
  const dirty =
    settingsDirty ||
    reviewDirty ||
    recoveryOpen ||
    (editing &&
      (conflict ||
        uncertain ||
        JSON.stringify(draft) !==
          JSON.stringify(editingBase ? toDraft(editingBase) : newDraft())));
  const filtered = filterRecords(
    records,
    query,
    maturity,
    platform,
    evidence,
  ) as ComponentRecord[];
  const ordered = sortRecords(
    filtered,
    sortKey,
    direction,
  ) as ComponentRecord[];
  const pageCount = Math.max(1, Math.ceil(ordered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visibleRecords = ordered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  useEffect(
    () => setPage(1),
    [query, maturity, platform, evidence, sortKey, direction, pageSize],
  );

  const {
    activeDraftId,
    storedDrafts,
    storageFailure,
    invalidDraftKeys,
    draftProtected,
    setStorageFailure,
    refreshStoredDrafts,
    forgetActiveDraft,
    protectDraftCopy,
    discardStoredDraft,
  } = useBrowserDrafts({
    editing,
    draft,
    editingBase,
    uncertain,
    saving,
    enabled: preferences.value.protectDrafts,
  });
  useEffect(() => () => draftRequest.current?.abort(), []);
  useLayoutEffect(() => {
    if (draftFailure) draftFeedback.current?.focus();
  }, [draftFailure]);
  async function restoreDraft(item: StoredDraft) {
    cancelQueueEntry();
    draftRequest.current?.abort();
    const controller = new AbortController();
    draftRequest.current = controller;
    setDraftRestore(item.id);
    setDraftFailure("");
    try {
      const latest = item.recordId
        ? await api.get(item.recordId, controller.signal)
        : null;
      if (controller.signal.aborted) return;
      if (
        latest &&
        (latest.id !== item.recordId || latest.revision < item.baseRevision!)
      )
        throw new Error("The editing base does not match this registry.");
      // A restored copy has its own key so another tab cannot overwrite it.
      activeDraftId.current = crypto.randomUUID();
      if (latest) {
        setRecords((previous) =>
          [
            ...previous.filter((record) => record.id !== latest.id),
            latest,
          ].sort((a, b) => a.name.localeCompare(b.name)),
        );
      }
      setSelectedId(item.recordId);
      setDraft(item.draft);
      setView("inventory");
      setEditing(true);
      clearFeedback();
      setRestoredBase(
        latest
          ? { ...latest, ...item.baseDraft!, revision: item.baseRevision! }
          : null,
      );
      const changedBase =
        latest &&
        (latest.revision !== item.baseRevision ||
          compareDrafts(latest, item.baseDraft!).length > 0);
      setConflict(!!changedBase);
      setUncertain(item.uncertain);
      if (changedBase || item.uncertain)
        setFailure(
          latest
            ? "Your browser draft is restored. Compare with the latest saved record before saving again."
            : "Your browser draft is restored, but a previous save may have completed. Check the saved inventory before retrying creation.",
        );
      else
        setMessage(
          "Browser draft restored. Review it, then save it to the registry.",
        );
      // Remove the offered copy only after protecting the independent restored copy.
      if (preferences.value.protectDrafts) {
        try {
          writeDraft(localStorage, {
            ...item,
            id: activeDraftId.current,
            savedAt: new Date().toISOString(),
          });
          removeDraft(localStorage, item.id);
        } catch {
          setStorageFailure(
            "The original recovery copy is retained because browser storage could not be updated.",
          );
        }
      } else {
        // Retain the offered copy until Save or an explicit discard. Further edits are memory-only.
        activeDraftId.current = item.id;
      }
      refreshStoredDrafts();
      pendingFocus.current = "editor";
    } catch {
      if (!controller.signal.aborted)
        setDraftFailure(
          "The editing base could not be loaded from this registry. The browser draft is retained; check the server and retry Restore draft.",
        );
    } finally {
      if (!controller.signal.aborted) setDraftRestore(null);
    }
  }
  async function load() {
    setLoading(true);
    setLoadError("");
    try {
      const result = await api.list();
      setRecords(result);
      setSelectedId(
        result.find((record) => record.id === initialRecordId)?.id ??
          result[0]?.id ??
          null,
      );
    } catch {
      setLoadError(
        "The registry could not be loaded. Check that the local server is running, then retry.",
      );
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("workbench-mode", mode);
    } catch {
      /* Appearance is optional; data is stored on the server. */
    }
    document.documentElement.style.colorScheme = mode;
  }, [mode]);
  useEffect(() => {
    document.title =
      view === "reading" && selected
        ? `${selected.name} · ${title} specification`
        : `${title} · Component registry`;
  }, [view, selected?.name]);
  useEffect(() => {
    const url = new URL(location.href);
    selectedId
      ? url.searchParams.set("record", selectedId)
      : url.searchParams.delete("record");
    url.searchParams.set("view", view);
    window.history.replaceState(null, "", url);
    setHistory([]);
    setHistoryError("");
    if (!selectedId || view !== "inventory") {
      setHistoryLoading(false);
      return;
    }
    setHistoryLoading(true);
    let active = true;
    api
      .history(selectedId)
      .then((result) => {
        if (active) setHistory(result);
      })
      .catch(() => {
        if (active) setHistoryError("Revision history could not be loaded.");
      })
      .finally(() => {
        if (active) setHistoryLoading(false);
      });
    return () => {
      active = false;
    };
  }, [selectedId, selected?.revision, view, historyRetry]);
  useEffect(() => {
    if (!dirty) return;
    const guard = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, [dirty]);
  useLayoutEffect(() => {
    if (Object.keys(errors).length || failure) summaryRef.current?.focus();
  }, [errors, failure]);
  function clearFeedback() {
    setRestoredBase(null);
    setDraftSource(null);
    setCreationCandidate(null);
    setErrors({});
    setFailure("");
    setConflict(false);
    setUncertain(false);
    setRecoveryOpen(false);
    setMessage("");
  }
  function cancelQueueEntry() {
    queueEntryRequest.current?.abort();
    queueEntryRequest.current = null;
    setQueueEntry(null);
    draftRequest.current?.abort();
    setDraftRestore(null);
    setDraftFailure("");
  }
  async function openQueueRecord(id: string) {
    cancelQueueEntry();
    const controller = new AbortController();
    queueEntryRequest.current = controller;
    setQueueEntry({ id, failed: false });
    try {
      const record = await api.get(id, controller.signal);
      if (controller.signal.aborted) return;
      if (record.id !== id) throw new Error("Unexpected record identity");
      setRecords((previous) =>
        [...previous.filter((item) => item.id !== id), record].sort((a, b) =>
          a.name.localeCompare(b.name),
        ),
      );
      setSelectedId(id);
      setView("review");
      setEditing(false);
      clearFeedback();
      setQueueEntry(null);
      pendingFocus.current = "main";
    } catch {
      if (!controller.signal.aborted) setQueueEntry({ id, failed: true });
    }
  }
  function guard(action: () => void) {
    if (saving) return;
    if (dirty)
      setPending(() => () => {
        forgetActiveDraft();
        cancelQueueEntry();
        action();
      });
    else {
      cancelQueueEntry();
      action();
    }
  }
  function selectRecord(record: ComponentRecord) {
    guard(() => {
      setSelectedId(record.id);
      setEditing(false);
      setDraftSource(null);
      clearFeedback();
      pendingFocus.current = "editor";
    });
  }
  function openReading() {
    guard(() => {
      setView("reading");
      setEditing(false);
      clearFeedback();
      pendingFocus.current = "main";
    });
  }
  function navigateView(next: string) {
    guard(() => {
      setView(next);
      setEditing(false);
      clearFeedback();
      pendingFocus.current = "main";
    });
  }
  function review(
    filters: { maturity?: string; platform?: string; evidence?: string } = {},
  ) {
    setMaturity(filters.maturity ?? "");
    setPlatform(filters.platform ?? "");
    setEvidence(filters.evidence ?? "");
    setQuery("");
    setView("inventory");
    setPage(1);
  }
  function sort(key: "name" | "maturity" | "updatedAt") {
    setDirection(key === sortKey && direction === "asc" ? "desc" : "asc");
    setSortKey(key);
  }
  function startNew() {
    guard(() => {
      setSelectedId(null);
      setView("inventory");
      setDraft(newDraft() as Draft);
      setEditing(true);
      clearFeedback();
      pendingFocus.current = "editor";
    });
  }
  function edit() {
    if (selected) {
      setDraft(toDraft(selected) as Draft);
      setEditing(true);
      clearFeedback();
      pendingFocus.current = "editor";
    }
  }
  function useRevision(entry: HistoryEntry) {
    guard(() => {
      setDraft(toDraft(entry.snapshot) as Draft);
      setEditing(true);
      clearFeedback();
      setDraftSource(entry.revision);
      pendingFocus.current = "editor";
    });
  }
  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((previous) => ({ ...previous, [key]: value }));
    setMessage("");
  }
  async function reloadRecord() {
    if (!selectedId) return;
    try {
      const record = await api.get(selectedId);
      setRecords((previous) =>
        previous.map((item) => (item.id === record.id ? record : item)),
      );
      setDraft(toDraft(record) as Draft);
      setEditing(false);
      clearFeedback();
      setMessage("Loaded the latest saved revision.");
      pendingFocus.current = "editor";
    } catch {
      setFailure(
        "The saved record could not be loaded. Your draft is still here.",
      );
    }
  }
  async function checkCreation() {
    const controller = new AbortController();
    draftRequest.current?.abort();
    draftRequest.current = controller;
    setSaving(true);
    setCheckingCreation(true);
    setCreationCandidate(null);
    setFailure("");
    try {
      const inventory = await api.list(controller.signal);
      if (controller.signal.aborted) return;
      const name = draft.name.trim();
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      const match = inventory.find(
        (record) =>
          record.id === slug ||
          record.name.toLowerCase() === name.toLowerCase(),
      );
      setRecords(inventory);
      if (match && compareDrafts(match, cleanDraft(draft)).length === 0) {
        setSelectedId(match.id);
        setEditing(false);
        forgetActiveDraft();
        clearFeedback();
        setMessage(
          `Your draft matches saved component ${match.name}, revision ${match.revision}. No new save was made.`,
        );
        pendingFocus.current = "editor";
      } else if (match) {
        setCreationCandidate(match);
        setFailure(
          "A saved component uses this name or identifier but has different fields. Your draft is retained. Choose to compare it as an edit, or change the name and check again.",
        );
      } else {
        setUncertain(false);
        setMessage(
          "No saved component currently matches this name or identifier. Review your draft before retrying creation; the server still checks name uniqueness.",
        );
      }
    } catch {
      if (!controller.signal.aborted)
        setFailure(
          "The saved inventory could not be checked. Your draft is retained and creation remains locked; retry the check.",
        );
    } finally {
      if (!controller.signal.aborted) {
        setSaving(false);
        setCheckingCreation(false);
      }
    }
  }
  async function save(event: FormEvent) {
    event.preventDefault();
    if (saving || conflict || uncertain) return;
    setFailure("");
    setConflict(false);
    setMessage("");
    const fields = validateDraft(draft);
    setErrors(fields);
    if (Object.keys(fields).length) return;
    protectDraftCopy(true); // Persist the uncertain marker before a write can leave this tab.
    setSaving(true);
    try {
      const record = await api.save(draft, editingBase);
      setRecords((previous) =>
        [...previous.filter((item) => item.id !== record.id), record].sort(
          (a, b) => a.name.localeCompare(b.name),
        ),
      );
      setSelectedId(record.id);
      setEditing(false);
      setRestoredBase(null);
      forgetActiveDraft();
      setDraftSource(null);
      setErrors({});
      setMessage(
        `${record.name} saved. Revision ${record.revision} is stored in the registry.`,
      );
      pendingFocus.current = "editor";
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors(error.fields);
        setConflict(error.status === 409);
        setUncertain(error.status >= 500);
        setFailure(error.message);
      } else {
        setUncertain(true);
        setFailure(
          selected
            ? "The save could not be confirmed. Your draft is still here. Compare with the latest saved record before saving again."
            : "The save could not be confirmed. Your draft is still here. Check the saved inventory before retrying creation.",
        );
      }
    } finally {
      setSaving(false);
    }
  }
  const currentImplementations =
    selected?.implementations.filter((item) => item.family === family) ?? [];
  const field = (
    key: keyof Draft,
    label: string,
    hint?: string,
    rows?: number,
  ) => (
    <Field id={`spec-${key}`} label={label} hint={hint} error={errors[key]}>
      {(props) =>
        rows ? (
          <Textarea
            {...props}
            name={key}
            rows={rows}
            value={draft[key] as string}
            disabled={saving}
            onChange={(event) => update(key, event.target.value)}
          />
        ) : (
          <TextInput
            {...props}
            name={key}
            value={draft[key] as string}
            disabled={saving}
            onChange={(event) => update(key, event.target.value)}
          />
        )
      }
    </Field>
  );

  const familyHref = (next: string) => {
    const params = new URLSearchParams(queueSearch);
    params.set("view", view);
    if (selectedId) params.set("record", selectedId);
    else params.delete("record");
    return `/${next}/?${params}`;
  };
  return (
    <div className={family} {...{ [`data-${family}`]: mode }}>
      <AppShell
        brand={title}
        navigation={
          <>
            <a
              href={familyHref("martlet")}
              aria-current={family === "martlet" ? "page" : undefined}
            >
              Martlet
            </a>
            <a
              href={familyHref("krigsvold")}
              aria-current={family === "krigsvold" ? "page" : undefined}
            >
              Krigsvold
            </a>
          </>
        }
        utilities={
          <>
            <a className="export-link" href="/api/export" download>
              Export registry ↗
            </a>
            <Button
              variant="quiet"
              onClick={() =>
                setMode((previous) => (previous === "light" ? "dark" : "light"))
              }
            >
              Use {mode === "light" ? "dark" : "light"} mode
            </Button>
          </>
        }
      >
        <div className="page-intro">
          <p className="eyebrow">Design workbench / 01</p>
          <div className="intro-line">
            <div>
              <h1>
                {view === "settings"
                  ? "Workspace settings"
                  : view === "overview"
                    ? "System overview"
                    : view === "updates"
                      ? "Inventory updates"
                      : view === "queue"
                        ? "Review queue"
                        : view === "review"
                          ? "Readiness reviews"
                          : view === "import"
                            ? "Import specifications"
                            : view === "reading"
                              ? "Reading room"
                              : "Component registry"}
              </h1>
              <p className="lede">A place to make the systems useful.</p>
            </div>
            <Button
              onClick={startNew}
              disabled={loading || !!loadError || saving}
            >
              Add component
            </Button>
          </div>
          <p className="intro-copy">
            Keep specifications, implementation coverage, and decisions
            together. Both family views share this registry.
          </p>
        </div>
        <nav aria-label="Workspace sections" className="view-navigation">
          {[
            ["overview", "Overview"],
            ["inventory", "Inventory"],
            ["updates", "Inventory updates"],
            ["reading", "Reading room"],
            ["import", "Import specifications"],
            ["review", "Readiness reviews"],
            ["queue", "Review queue"],
            ["settings", "Settings"],
          ].map(([key, label]) => (
            <a
              key={key}
              href={`?view=${key}${selectedId ? "&record=" + selectedId : ""}`}
              aria-current={view === key ? "page" : undefined}
              onClick={(event) => {
                event.preventDefault();
                navigateView(key);
              }}
            >
              {label}
            </a>
          ))}
        </nav>
        <div className="registry-meta">
          <p>
            <strong>{records.length}</strong> components{" "}
            <span aria-hidden="true">/</span>{" "}
            <strong>
              {records.filter((record) => record.maturity === "stable").length}
            </strong>{" "}
            stable
          </p>
          <p>Local SQLite registry · Experimental application</p>
        </div>
        {storageFailure && <Notice kind="error">{storageFailure}</Notice>}
        {!loading &&
          !editing &&
          !reviewDirty &&
          !settingsDirty &&
          storedDrafts.length > 0 && (
            <section className="stack" aria-labelledby="browser-drafts-title">
              <h2 id="browser-drafts-title">
                Recover unfinished specifications
              </h2>
              <p>
                These browser copies have not been committed to the registry.
                Restore a copy to review it, or discard it. Copies belong to
                this browser address; confirm you are using the intended
                registry.
              </p>
              <ul className="stack">
                {storedDrafts.map((item) => (
                  <li key={item.id}>
                    <strong>{item.draft.name || "Unnamed component"}</strong>
                    {" · "}
                    {new Date(item.savedAt).toLocaleString("en-US", {
                      timeZone: "America/New_York",
                      timeZoneName: "short",
                    })}
                    {item.recordId
                      ? ` · editing revision ${item.baseRevision}`
                      : " · new component"}
                    <div className="actions">
                      <Button
                        disabled={!!draftRestore || !!loadError || saving}
                        onClick={() => void restoreDraft(item)}
                        aria-label={`Restore draft ${item.draft.name || "Unnamed component"}`}
                      >
                        Restore draft
                      </Button>
                      <Button
                        disabled={!!draftRestore || saving}
                        variant="secondary"
                        onClick={() => discardStoredDraft(item)}
                        aria-label={`Discard draft ${item.draft.name || "Unnamed component"}`}
                      >
                        Discard draft
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
              {draftRestore && (
                <Notice>
                  <p>Loading the draft’s editing base…</p>
                  <Button variant="secondary" onClick={cancelQueueEntry}>
                    Cancel restoring draft
                  </Button>
                </Notice>
              )}
              {draftFailure && (
                <ErrorSummary
                  ref={draftFeedback}
                  title="Draft could not be restored"
                >
                  <p>{draftFailure}</p>
                </ErrorSummary>
              )}
            </section>
          )}
        {invalidDraftKeys.length > 0 && (
          <Notice kind="error">
            <p>
              Some browser recovery copies are unreadable or use an unsupported
              format. They have been retained.
            </p>
            <Button
              variant="secondary"
              onClick={() => {
                try {
                  for (const key of invalidDraftKeys)
                    localStorage.removeItem(key);
                  refreshStoredDrafts();
                } catch {
                  setStorageFailure(
                    "Unreadable recovery copies could not be removed.",
                  );
                }
              }}
            >
              Discard unreadable recovery copies
            </Button>
          </Notice>
        )}
        {queueEntry &&
          (queueEntry.failed ? (
            <ErrorSummary
              ref={queueEntryError}
              title="Review could not be opened"
            >
              <p>
                The saved record could not be loaded. Your selection and queue
                filters are retained.
              </p>
              <div className="actions">
                <Button onClick={() => void openQueueRecord(queueEntry.id)}>
                  Retry opening review
                </Button>
                <Button variant="secondary" onClick={cancelQueueEntry}>
                  Cancel opening review
                </Button>
              </div>
            </ErrorSummary>
          ) : (
            <Notice>
              <p>Opening the latest saved record…</p>
              <Button variant="secondary" onClick={cancelQueueEntry}>
                Cancel opening review
              </Button>
            </Notice>
          ))}
        {loading ? (
          <Notice>Loading the component registry…</Notice>
        ) : loadError ? (
          <div className="stack">
            <Notice kind="error">{loadError}</Notice>
            <Button onClick={() => void load()}>Retry loading</Button>
          </div>
        ) : view === "settings" ? (
          <WorkbenchSettings
            value={preferences.value}
            issue={preferences.issue}
            onDirty={setSettingsDirty}
            onCleared={refreshStoredDrafts}
            onSaved={(value) => {
              setPreferences({ value, issue: "" });
              setPageSize(value.pageSize);
            }}
          />
        ) : view === "queue" ? (
          <ReviewQueue
            onLocationChange={setQueueSearch}
            onOpen={(id) =>
              guard(() => {
                void openQueueRecord(id);
              })
            }
          />
        ) : view === "review" ? (
          <ReadinessReviews
            records={records}
            record={selected}
            onSelect={selectRecord}
            onUpdated={(record) =>
              setRecords((previous) =>
                previous.map((item) => (item.id === record.id ? record : item)),
              )
            }
            onEdit={() =>
              guard(() => {
                setView("inventory");
                edit();
              })
            }
            onDirty={setReviewDirty}
            onBusy={setSaving}
            onGuard={guard}
          />
        ) : view === "import" ? (
          <ImportRegistry onApplied={setRecords} onBusy={setSaving} />
        ) : view === "reading" ? (
          <ReadingRoom
            records={records}
            record={selected}
            onSelect={(id) => {
              setSelectedId(id);
              clearFeedback();
            }}
            onUpdated={(record) =>
              setRecords((previous) =>
                previous.map((item) => (item.id === record.id ? record : item)),
              )
            }
            onEdit={() => {
              setView("inventory");
              edit();
            }}
          />
        ) : view === "updates" ? (
          <InventoryUpdates onApplied={setRecords} onBusy={setSaving} />
        ) : view === "overview" ? (
          <ReadinessDashboard
            records={records}
            onReview={review}
            onInspect={(record) => {
              setView("inventory");
              selectRecord(record);
            }}
          />
        ) : (
          <div
            className={`workspace ${recoveryOpen ? "workspace--recovery" : ""}`}
          >
            <section className="collection" aria-labelledby="collection-title">
              <div className="section-heading">
                <h2 id="collection-title">The inventory</h2>
                <p>Find a component, then review its contract.</p>
              </div>
              <div className="filters">
                <Field label="Search components">
                  {(props) => (
                    <TextInput
                      {...props}
                      type="search"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Name, purpose, or category"
                    />
                  )}
                </Field>
                <Field label="Maturity">
                  {(props) => (
                    <Select
                      {...props}
                      value={maturity}
                      onChange={(event) => setMaturity(event.target.value)}
                    >
                      <option value="">All stages</option>
                      {maturities.map((value) => (
                        <option key={value}>{value}</option>
                      ))}
                    </Select>
                  )}
                </Field>
                <Field
                  label="Target platform"
                  hint="Targets describe intent, not released support."
                >
                  {(props) => (
                    <Select
                      {...props}
                      value={platform}
                      onChange={(event) => setPlatform(event.target.value)}
                    >
                      <option value="">All platforms</option>
                      {platforms.map((value) => (
                        <option key={value}>{value}</option>
                      ))}
                    </Select>
                  )}
                </Field>
                <Field label="Usage evidence">
                  {(props) => (
                    <Select
                      {...props}
                      value={evidence}
                      onChange={(event) => setEvidence(event.target.value)}
                    >
                      <option value="">All evidence states</option>
                      <option value="missing">Missing evidence</option>
                      <option value="recorded">Evidence recorded</option>
                    </Select>
                  )}
                </Field>
              </div>
              <p className="result-count" role="status">
                {ordered.length
                  ? `${(currentPage - 1) * pageSize + 1}–${Math.min(currentPage * pageSize, ordered.length)}`
                  : "0"}{" "}
                of {filtered.length} matching components · Sorted by{" "}
                {sortKey === "updatedAt" ? "updated date" : sortKey},{" "}
                {direction === "asc" ? "ascending" : "descending"}
              </p>
              {filtered.length ? (
                <>
                  <DataTable caption="Component specifications">
                    <thead>
                      <tr>
                        <th
                          scope="col"
                          aria-sort={
                            sortKey === "name"
                              ? direction === "asc"
                                ? "ascending"
                                : "descending"
                              : undefined
                          }
                        >
                          <button
                            className="sort-button"
                            onClick={() => sort("name")}
                          >
                            Component{" "}
                            <span aria-hidden="true">
                              {sortKey === "name"
                                ? direction === "asc"
                                  ? "↑"
                                  : "↓"
                                : "↕"}
                            </span>
                          </button>
                        </th>
                        <th
                          scope="col"
                          aria-sort={
                            sortKey === "maturity"
                              ? direction === "asc"
                                ? "ascending"
                                : "descending"
                              : undefined
                          }
                        >
                          <button
                            className="sort-button"
                            onClick={() => sort("maturity")}
                          >
                            Stage{" "}
                            <span aria-hidden="true">
                              {sortKey === "maturity"
                                ? direction === "asc"
                                  ? "↑"
                                  : "↓"
                                : "↕"}
                            </span>
                          </button>
                        </th>
                        <th scope="col">Targets</th>
                        <th
                          scope="col"
                          aria-sort={
                            sortKey === "updatedAt"
                              ? direction === "asc"
                                ? "ascending"
                                : "descending"
                              : undefined
                          }
                        >
                          <button
                            className="sort-button"
                            onClick={() => sort("updatedAt")}
                          >
                            Updated{" "}
                            <span aria-hidden="true">
                              {sortKey === "updatedAt"
                                ? direction === "asc"
                                  ? "↑"
                                  : "↓"
                                : "↕"}
                            </span>
                          </button>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleRecords.map((record) => (
                        <tr
                          key={record.id}
                          data-selected={record.id === selectedId}
                        >
                          <th scope="row">
                            <button
                              className="record-link"
                              type="button"
                              aria-label={`Inspect ${record.name}`}
                              aria-current={
                                record.id === selectedId ? "true" : undefined
                              }
                              onClick={() => selectRecord(record)}
                              disabled={saving}
                            >
                              <span className="record-name">{record.name}</span>
                              <span className="record-category">
                                {record.category}
                              </span>
                            </button>
                          </th>
                          <td>
                            <Badge>{record.maturity}</Badge>
                          </td>
                          <td className="target-cell">
                            {record.targets.join(", ")}
                          </td>
                          <td className="updated-cell">
                            <time dateTime={record.updatedAt}>
                              {new Date(record.updatedAt).toLocaleDateString(
                                "en-US",
                              )}
                            </time>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </DataTable>
                  <nav className="pagination" aria-label="Inventory pages">
                    <Button
                      variant="secondary"
                      disabled={currentPage === 1}
                      onClick={() => setPage(currentPage - 1)}
                    >
                      Previous page
                    </Button>
                    <span>
                      Page {currentPage} of {pageCount}
                    </span>
                    <Button
                      variant="secondary"
                      disabled={currentPage === pageCount}
                      onClick={() => setPage(currentPage + 1)}
                    >
                      Next page
                    </Button>
                    <Field label="Components per page">
                      {(props) => (
                        <Select
                          {...props}
                          value={pageSize}
                          onChange={(event) =>
                            setPageSize(Number(event.target.value))
                          }
                        >
                          <option value="10">10</option>
                          <option value="25">25</option>
                          <option value="50">50</option>
                        </Select>
                      )}
                    </Field>
                  </nav>
                </>
              ) : (
                <div className="empty">
                  <h3>No components match</h3>
                  <p>Try a broader search or clear the filters.</p>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setQuery("");
                      setMaturity("");
                      setPlatform("");
                      setEvidence("");
                    }}
                  >
                    Clear filters
                  </Button>
                </div>
              )}
            </section>
            <section
              className="editor stack"
              aria-labelledby="editor-title"
              tabIndex={-1}
              ref={editorRef}
            >
              <div className="editor-heading">
                <div>
                  <p className="eyebrow">
                    {editing
                      ? selected
                        ? "Edit specification"
                        : "New specification"
                      : "Component specification"}
                  </p>
                  <h2 id="editor-title">
                    {editing
                      ? draft.name || "New component"
                      : (selected?.name ?? "Choose a component")}
                  </h2>
                </div>
                {selected && !editing && (
                  <div className="actions">
                    <Button variant="secondary" onClick={openReading}>
                      Read specification
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => navigateView("review")}
                    >
                      Review readiness
                    </Button>
                    <Button variant="secondary" onClick={edit}>
                      Edit specification
                    </Button>
                  </div>
                )}
              </div>
              {checkingCreation && (
                <Notice>
                  <p>Checking the saved inventory…</p>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      draftRequest.current?.abort();
                      setCheckingCreation(false);
                      setSaving(false);
                      setFailure(
                        "The inventory check was cancelled. Your draft is retained; check again before saving.",
                      );
                    }}
                  >
                    Cancel inventory check
                  </Button>
                </Notice>
              )}
              {editing && (
                <p className="small muted">
                  {draftProtected
                    ? "Draft protected in this browser. Save specification commits it to the registry."
                    : preferences.value.protectDrafts
                      ? "Changes are not yet saved to the registry."
                      : "Browser draft protection is off. Save specification before leaving this page."}
                </p>
              )}
              {message && <Notice kind="success">{message}</Notice>}
              {!recoveryOpen && (Object.keys(errors).length > 0 || failure) && (
                <ErrorSummary
                  ref={summaryRef}
                  title={failure || "The specification needs a few changes."}
                  errors={Object.entries(errors).map(([key, value]) => ({
                    message: value,
                    targetId: `spec-${key}`,
                  }))}
                >
                  {editing && selected && (conflict || uncertain) && (
                    <Button
                      variant="secondary"
                      onClick={() => setRecoveryOpen(true)}
                    >
                      Compare with latest saved record
                    </Button>
                  )}
                  {editing && !selected && uncertain && (
                    <div className="actions">
                      <Button
                        disabled={checkingCreation}
                        onClick={() => void checkCreation()}
                      >
                        Check saved inventory
                      </Button>
                      {creationCandidate && (
                        <Button
                          onClick={() => {
                            setSelectedId(creationCandidate.id);
                            setConflict(true);
                            setRecoveryOpen(true);
                            setCreationCandidate(null);
                          }}
                        >
                          Compare as an edit of {creationCandidate.name}
                        </Button>
                      )}
                    </div>
                  )}
                  {selected && (conflict || uncertain) && (
                    <Button
                      variant="secondary"
                      onClick={() => guard(() => void reloadRecord())}
                    >
                      Reload saved record
                    </Button>
                  )}
                </ErrorSummary>
              )}
              {recoveryOpen && selected ? (
                <ConflictRecovery
                  base={editingBase ?? selected}
                  draft={draft}
                  onReturn={() => {
                    setRecoveryOpen(false);
                    pendingFocus.current = "editor";
                  }}
                  onAccept={(latest, resolved) => {
                    setRecords((previous) =>
                      previous.map((item) =>
                        item.id === latest.id ? latest : item,
                      ),
                    );
                    setDraft(resolved);
                    clearFeedback();
                    const changed =
                      compareDrafts(latest, cleanDraft(resolved)).length > 0;
                    setEditing(changed);
                    if (!changed) forgetActiveDraft();
                    setMessage(
                      changed
                        ? `Choices prepared as a draft based on revision ${latest.revision}. Review the fields, then save; nothing has been written yet.`
                        : `Your draft matches saved revision ${latest.revision}. No new save was made.`,
                    );
                    pendingFocus.current = "editor";
                  }}
                />
              ) : editing ? (
                <form
                  noValidate
                  onSubmit={save}
                  className="stack"
                  aria-busy={saving}
                >
                  <p className="muted">
                    {selected
                      ? `Editing saved revision ${editingBase?.revision}${draftSource ? ` using revision ${draftSource} as a draft` : ""}.`
                      : "Create a shared component contract."}{" "}
                    {dirty
                      ? "You have unsaved changes."
                      : "Name, summary, target platforms, and acceptance criteria are required."}
                  </p>
                  {field(
                    "name",
                    "Component name",
                    "Use the public API name, for example TextInput.",
                  )}
                  {field(
                    "summary",
                    "Summary",
                    "Describe the task this component helps someone complete.",
                    3,
                  )}
                  <div className="form-pair">
                    <Field
                      id="spec-category"
                      label="Category"
                      error={errors.category}
                    >
                      {(props) => (
                        <Select
                          {...props}
                          value={draft.category}
                          disabled={saving}
                          onChange={(event) =>
                            update("category", event.target.value)
                          }
                        >
                          {categories.map((value) => (
                            <option key={value}>{value}</option>
                          ))}
                        </Select>
                      )}
                    </Field>
                    <Field
                      id="spec-maturity"
                      label="Maturity stage"
                      hint="Stable requires evidence; deprecated requires migration guidance."
                      error={errors.maturity}
                    >
                      {(props) => (
                        <Select
                          {...props}
                          value={draft.maturity}
                          disabled={saving}
                          onChange={(event) =>
                            update(
                              "maturity",
                              event.target.value as Draft["maturity"],
                            )
                          }
                        >
                          {maturities.map((value) => (
                            <option key={value}>{value}</option>
                          ))}
                        </Select>
                      )}
                    </Field>
                  </div>
                  <Fieldset
                    id="spec-targets"
                    tabIndex={-1}
                    legend="Target platforms"
                    hint="Planned reach. Released implementations are recorded separately."
                    error={errors.targets}
                    disabled={saving}
                  >
                    <div className="platform-options">
                      {platforms.map((value) => (
                        <Checkbox
                          key={value}
                          label={value}
                          name="targets"
                          checked={draft.targets.includes(value)}
                          onChange={(event) =>
                            update(
                              "targets",
                              event.target.checked
                                ? [...draft.targets, value]
                                : draft.targets.filter(
                                    (item) => item !== value,
                                  ),
                            )
                          }
                        />
                      ))}
                    </div>
                  </Fieldset>
                  {field(
                    "acceptanceCriteria",
                    "Acceptance criteria",
                    "One verifiable requirement per line. These are requirements, not claims that checks passed.",
                    5,
                  )}
                  {field(
                    "evidence",
                    "Usage and verification evidence",
                    "Record real consumers, tasks, check results, and known limitations before marking stable.",
                    4,
                  )}
                  <div className="family-notes">
                    <h3>Family decisions</h3>
                    <p className="muted">
                      Shared behavior can support different composition and
                      emphasis.
                    </p>
                    {field("martletNotes", "Martlet notes", undefined, 3)}
                    {field("krigsvoldNotes", "Krigsvold notes", undefined, 3)}
                  </div>
                  {field(
                    "migration",
                    "Migration guidance",
                    "Required when deprecating a contract. Identify the replacement and the transition.",
                    3,
                  )}
                  <div className="actions">
                    <Button
                      type="submit"
                      disabled={saving || conflict || uncertain}
                    >
                      {saving ? "Saving…" : "Save specification"}
                    </Button>
                    <Button
                      variant="quiet"
                      disabled={saving}
                      onClick={() =>
                        guard(() => {
                          setEditing(false);
                          clearFeedback();
                          pendingFocus.current = "editor";
                          if (!selected) setSelectedId(records[0]?.id ?? null);
                        })
                      }
                    >
                      Cancel editing
                    </Button>
                  </div>
                </form>
              ) : selected ? (
                <>
                  <div className="record-state">
                    <Badge>{selected.maturity}</Badge>
                    <span>
                      {selected.category} · Revision {selected.revision}
                    </span>
                  </div>
                  <p className="spec-summary">{selected.summary}</p>
                  <dl className="spec-details">
                    <div>
                      <dt>Target platforms</dt>
                      <dd>{selected.targets.join(", ")}</dd>
                    </div>
                    <div>
                      <dt>Last recorded</dt>
                      <dd>
                        <time dateTime={selected.updatedAt}>
                          {new Date(selected.updatedAt).toLocaleString("en-US")}
                        </time>
                      </dd>
                    </div>
                  </dl>
                  <section className="stack compact">
                    <h3>{title} implementations</h3>
                    {currentImplementations.length ? (
                      <ul className="implementations">
                        {currentImplementations.map((item) => (
                          <li key={`${item.platform}/${item.package}`}>
                            <strong>{item.platform}</strong>
                            <span>
                              {item.package} {item.version}
                            </span>
                            <span className="muted">
                              {item.state === "published"
                                ? "Published package"
                                : "Experimental workspace package; unpublished"}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="muted">
                        No implementation is recorded yet.
                      </p>
                    )}
                    <p className="small muted">
                      Availability records the current package inventory.
                      Maturity requires separate evidence.
                    </p>
                  </section>
                  <section className="stack compact">
                    <h3>Acceptance criteria</h3>
                    <ul className="criteria">
                      {selected.acceptanceCriteria
                        .split("\n")
                        .filter(Boolean)
                        .map((line, index) => (
                          <li key={index}>{line}</li>
                        ))}
                    </ul>
                  </section>
                  <section className="stack compact">
                    <h3>Usage and verification evidence</h3>
                    <p className="multiline">
                      {selected.evidence ||
                        "No usage evidence recorded yet. This contract remains experimental."}
                    </p>
                  </section>
                  <section className="stack compact">
                    <h3>{title} decisions</h3>
                    <p className="multiline">
                      {family === "martlet"
                        ? selected.martletNotes
                        : selected.krigsvoldNotes}
                    </p>
                  </section>
                  {selected.migration && (
                    <section className="stack compact">
                      <h3>Migration guidance</h3>
                      <p className="multiline">{selected.migration}</p>
                    </section>
                  )}
                  <RevisionReview
                    current={selected}
                    entries={history}
                    loading={historyLoading}
                    error={historyError}
                    onRetry={() => setHistoryRetry((value) => value + 1)}
                    onUse={useRevision}
                  />
                </>
              ) : (
                <p>Choose a component from the inventory or add a new one.</p>
              )}
            </section>
          </div>
        )}
        <footer className="workbench-footer">
          <p>Martlet & Krigsvold · Free software, shared in full.</p>
          <p>
            Specifications are working contracts. Real use decides what
            survives.
          </p>
        </footer>
      </AppShell>
      <Dialog
        open={pending !== null}
        title="Discard unsaved changes?"
        onDismiss={() => setPending(null)}
      >
        <p>
          Your changes have not been saved. Keep editing, or discard this draft
          to continue.
        </p>
        <div className="actions">
          <Button
            variant="secondary"
            autoFocus
            onClick={() => setPending(null)}
          >
            Keep editing
          </Button>
          <Button
            onClick={() => {
              const action = pending;
              setPending(null);
              action?.();
            }}
          >
            Discard changes
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
