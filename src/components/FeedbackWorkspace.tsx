"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { AppRatingPanel } from "@/components/AppRatingPanel";
import { useFeedbackRetryWait } from "@/components/FeedbackTimers";
import {
  emptyFeedbackDraft, feedbackOrigin, feedbackReloadSafe, hasFeedbackDraft, loadFeedbackDraft,
  prepareFeedbackAttempt, recalledFeedbackDraft, rememberFeedbackDraft, saveFeedbackDraft,
  setFeedbackReloadUnsafe, FEEDBACK_DRAFT_KEY, FEEDBACK_DRAFT_TTL_MS, type FeedbackDraft,
} from "@/lib/feedback/client-draft";
import { feedbackRequest, FeedbackRequestError } from "@/lib/feedback/client-request";
import styles from "./Feedback.module.css";

export function FeedbackWorkspace({ clientCommit }: Readonly<{ clientCommit: string | null }>) {
  const [draft, setDraft] = useState(() => emptyFeedbackDraft("/", ""));
  const draftRef = useRef(draft);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState<string | null>(null);
  const [draftUnavailable, setDraftUnavailable] = useState(false);
  const [retryAt, setRetryAt] = useState<number | null>(null);
  const retryWait = useFeedbackRetryWait(retryAt);
  const persisted = useRef(true), writeBusy = useRef(false), ratingBusy = useRef(false), mounted = useRef(false);
  const requestController = useRef<AbortController | null>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null), receiptHeading = useRef<HTMLHeadingElement>(null), errorRef = useRef<HTMLDivElement>(null);

  const updateGuard = useCallback(() => {
    setFeedbackReloadUnsafe(writeBusy.current || ratingBusy.current || hasFeedbackDraft(draftRef.current) && !persisted.current);
  }, []);
  const persist = useCallback((value: FeedbackDraft) => {
    const next = { ...value, expiresAt: Date.now() + FEEDBACK_DRAFT_TTL_MS };
    draftRef.current = next;
    setDraft(next);
    try { persisted.current = saveFeedbackDraft(window.sessionStorage, next); }
    catch { persisted.current = false; }
    rememberFeedbackDraft(hasFeedbackDraft(next) ? next : null, persisted.current);
    setDraftUnavailable(!persisted.current && hasFeedbackDraft(next));
    updateGuard();
  }, [updateGuard]);

  useEffect(() => {
    mounted.current = true;
    async function restore() {
      const origin = feedbackOrigin(new URLSearchParams(window.location.search).get("from"));
      let restored = recalledFeedbackDraft();
      try { restored ??= loadFeedbackDraft(window.sessionStorage); } catch { /* Memory-only fallback. */ }
      if (!mounted.current) return;
      persist(restored ?? emptyFeedbackDraft(origin, crypto.randomUUID()));
      setReady(true);
    }
    void restore();
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!feedbackReloadSafe()) { event.preventDefault(); event.returnValue = ""; }
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => {
      mounted.current = false;
      requestController.current?.abort();
      setFeedbackReloadUnsafe(false);
      window.removeEventListener("beforeunload", beforeUnload);
    };
  }, [persist]);

  useEffect(() => { if (receipt) receiptHeading.current?.focus(); }, [receipt]);
  useEffect(() => { if (error) errorRef.current?.focus(); }, [error]);

  function edit(change: Partial<FeedbackDraft>) {
    if (writeBusy.current) return;
    persist({ ...draftRef.current, ...change });
    setError("");
  }
  function clearDraft() {
    rememberFeedbackDraft(null);
    try { window.sessionStorage.removeItem(FEEDBACK_DRAFT_KEY); } catch { /* No persistent copy exists when blocked. */ }
    persist(emptyFeedbackDraft(draftRef.current.originPath, crypto.randomUUID()));
  }
  const ratingBusyChanged = useCallback((value: boolean) => {
    ratingBusy.current = value;
    if (mounted.current) updateGuard(); else setFeedbackReloadUnsafe(false);
  }, [updateGuard]);

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ready || writeBusy.current || retryWait > 0) return;
    if (!draftRef.current.description.trim()) {
      descriptionRef.current?.setCustomValidity("Please describe your feedback.");
      descriptionRef.current?.reportValidity();
      return;
    }
    if (!event.currentTarget.reportValidity()) return;
    const attempt = prepareFeedbackAttempt(draftRef.current, clientCommit, () => crypto.randomUUID());
    persist(attempt);
    writeBusy.current = true; setBusy(true); updateGuard(); setError("");
    const controller = new AbortController();
    requestController.current = controller;
    try {
      const result = await feedbackRequest("/api/feedback", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idempotencyKey: attempt.idempotencyKey, ...JSON.parse(attempt.attemptedPayload!) }),
      }, controller.signal);
      if (!result || typeof result !== "object" || typeof (result as { reference?: unknown }).reference !== "string"
        || !/^[A-Za-z0-9-]{6,80}$/.test((result as { reference: string }).reference)) throw new Error("Unconfirmed receipt");
      if (!mounted.current) return;
      clearDraft();
      setReceipt((result as { reference: string }).reference);
    } catch (caught) {
      if (!mounted.current) return;
      if (caught instanceof FeedbackRequestError && caught.status === 429) {
        setRetryAt(caught.retryAt ?? Date.now() + 60_000);
        setError("Please wait a moment before sending again. Your message is still here.");
      } else if (caught instanceof FeedbackRequestError && caught.status === 409) {
        persist({ ...draftRef.current, idempotencyKey: crypto.randomUUID(), attemptedPayload: null });
        setError("We couldn’t confirm this version of your message. Your text is still here. Please try again.");
      } else {
        setError("We couldn’t confirm your feedback was received. Your message is still here. Please try again.");
      }
    } finally {
      writeBusy.current = false;
      if (mounted.current) { setBusy(false); updateGuard(); }
    }
  }

  const back = <Link id="back-to-reading" href={draft.originPath} prefetch={false} className={styles.back} onClick={event => { if (writeBusy.current || ratingBusy.current) event.preventDefault(); }}>← Back to your reading</Link>;
  if (receipt) return <article className={styles.workspace} id="feedback-confirmation">
    {back}
    <div className={styles.check} aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m5 12 4 4L19 6" strokeLinecap="round" strokeLinejoin="round" /></svg></div>
    <p className={styles.kicker}>Feedback received</p>
    <h1 ref={receiptHeading} tabIndex={-1} className="bc-title">Thank you for helping us improve.</h1>
    <p className={styles.intro}>Your feedback has been received for the team to review.</p>
    <div className={styles.receipt}><span>Your reference</span><strong id="receipt-reference">{receipt}</strong></div>
    <p className={styles.intro}>You can keep reading as usual.</p>
    <Link id="return-to-reading" href={draft.originPath} prefetch={false} className={styles.primary}>Back to your reading</Link>
  </article>;

  return <article className={styles.workspace} id="feedback-workspace">
    {back}
    <header><p className={styles.kicker}>Your experience matters</p><h1 id="feedback-title" className="bc-title">Give feedback</h1><p className={styles.intro}>Tell us what could work better. No account needed.</p></header>
    <AppRatingPanel onBusyChange={ratingBusyChanged} />
    <form id="feedback-form" onSubmit={send} aria-busy={busy}>
      <fieldset className={styles.formSection} disabled={!ready || busy}>
        <legend className={styles.legend}>What would you like to share?</legend>
        <div className={styles.types}>{([['bug', 'Report a bug'], ['improvement', 'Suggest an improvement']] as const).map(([category, label]) => <label key={category} className={`${styles.type} ${draft.category === category ? styles.typeSelected : ""}`}>
          <input type="radio" name="feedback-type" value={category} checked={draft.category === category} onChange={() => edit({ category })} />{label}
        </label>)}</div>
      </fieldset>
      <div className={styles.formSection}><label htmlFor="description" className={styles.label}>{draft.category === 'bug' ? 'What happened?' : 'What would make it better?'}</label>
        <textarea id="description" ref={descriptionRef} name="description" className={styles.field} rows={5} maxLength={5000} required disabled={!ready || busy} value={draft.description} aria-describedby="description-help"
          placeholder={draft.category === 'bug' ? 'Tell us what you noticed…' : 'Share your idea…'} onChange={event => { event.currentTarget.setCustomValidity(""); edit({ description: event.target.value }); }} />
        <p id="description-help" className={styles.help}>{draft.category === 'bug' ? 'Tell us what went wrong and where you noticed it.' : 'Share your idea and how it would help you.'}</p>
      </div>
      {draft.category === 'bug' && <details id="bug-details" className={styles.details}><summary>Add more detail <span className={styles.optional}>(optional)</span></summary><div className={styles.detailsInner}>
        <label htmlFor="reproduction" className={styles.label}>How can we reproduce it?</label><textarea id="reproduction" className={styles.field} rows={3} maxLength={3000} value={draft.reproduction} disabled={!ready || busy} onChange={event => edit({ reproduction: event.target.value })} placeholder="For example: open a category, read a passage, then go back…" />
        <label htmlFor="expected" className={styles.label}>What did you expect to happen?</label><textarea id="expected" className={styles.field} rows={3} maxLength={2000} value={draft.expected} disabled={!ready || busy} onChange={event => edit({ expected: event.target.value })} placeholder="What were you hoping to see?" />
      </div></details>}
      <div className={styles.formSection}><label className={styles.label} htmlFor="reply-email">Email <span className={styles.optional}>(optional)</span></label>
        <input id="reply-email" className={styles.field} type="email" maxLength={254} autoComplete="email" inputMode="email" aria-describedby="email-help" placeholder="you@example.com" value={draft.replyEmail} disabled={!ready || busy} onChange={event => edit({ replyEmail: event.target.value })} />
        <p id="email-help" className={styles.help}>Only for a reply about this feedback. No newsletter signup.</p>
      </div>
      <label className={styles.pageCheck}><input id="include-page" type="checkbox" checked={draft.includePage} disabled={!ready || busy} onChange={event => edit({ includePage: event.target.checked })} /><span>Include the page I’m on<small>{draft.originPath}</small></span></label>
      <p className={styles.privacy}>Please leave out passwords and other sensitive personal details.</p>
      {draftUnavailable && <p className={styles.storageWarning} role="status">This browser can’t keep your draft through a reload. Keep this page open until you send it, or copy your message first.</p>}
      {error && <div id="feedback-error" className={styles.error} role="alert" tabIndex={-1} ref={errorRef}>{error}{retryWait > 0 && <span> Try again in {retryWait} seconds.</span>}</div>}
      <button id="send-feedback" type="submit" className={`${styles.primary} ${styles.send}`} disabled={!ready || busy || retryWait > 0}>{busy ? 'Sending…' : error ? 'Try again' : 'Send feedback'}</button>
      <p className="sr-only" role="status">{busy ? 'Sending your feedback.' : ''}</p>
      {hasFeedbackDraft(draft) && <button type="button" className={styles.discard} id="discard-feedback" disabled={busy} onClick={() => { clearDraft(); setError(""); descriptionRef.current?.focus(); }}>Discard draft</button>}
    </form>
  </article>;
}
