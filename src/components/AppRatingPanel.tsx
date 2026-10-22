"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { feedbackRequest, FeedbackRequestError, parseAppRatingSummary, randomRatingToken, type AppRatingSummary } from "@/lib/feedback/client-request";
import { loadOwnAppRating, prepareOwnRatingCommand, recalledOwnAppRating, rememberOwnAppRating, saveOwnAppRating, type OwnAppRating, type RatingCommand } from "@/lib/feedback/client-rating";
import { useFeedbackRetryWait } from "@/components/FeedbackTimers";
import styles from "./Feedback.module.css";

type SummaryState = "idle" | "loading" | "success" | "empty" | "error";
type SummarySnapshot = { data: AppRatingSummary; ownStars: number | null };

export function AppRatingPanel({ onBusyChange }: Readonly<{ onBusyChange: (busy: boolean) => void }>) {
  const [selected, setSelected] = useState<number | null>(null), [savedStars, setSavedStars] = useState<number | null>(null);
  const [ready, setReady] = useState(false), [saving, setSaving] = useState(false), [saveStatus, setSaveStatus] = useState("");
  const [saveFailed, setSaveFailed] = useState(false), [storageUnavailable, setStorageUnavailable] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [pendingCommand, setPendingCommand] = useState<RatingCommand | null>(null);
  const [writeRetryAt, setWriteRetryAt] = useState<number | null>(null), [readRetryAt, setReadRetryAt] = useState<number | null>(null);
  const writeWait = useFeedbackRetryWait(writeRetryAt), readWait = useFeedbackRetryWait(readRetryAt);
  const [open, setOpen] = useState(false), [summaryState, setSummaryState] = useState<SummaryState>("idle");
  const [snapshot, setSnapshot] = useState<SummarySnapshot | null>(null), [activeAction, setActiveAction] = useState<"refresh" | "retry" | null>(null);
  const [summaryStatus, setSummaryStatus] = useState("");
  const ownRating = useRef<OwnAppRating | null>(null), savedStarsRef = useRef<number | null>(null), writePending = useRef(false);
  const mounted = useRef(false), summaryOpen = useRef(false), readPending = useRef(false), readGeneration = useRef(0);
  const readController = useRef<AbortController | null>(null), writeController = useRef<AbortController | null>(null);
  const refreshRef = useRef<HTMLButtonElement>(null), retryRef = useRef<HTMLButtonElement>(null);
  const focusAfterRead = useRef(false), lastFocusAction = useRef<"refresh" | "retry" | null>(null);

  useEffect(() => {
    mounted.current = true;
    async function restore() {
      let restored = recalledOwnAppRating();
      try { restored ??= loadOwnAppRating(window.localStorage); } catch { setStorageUnavailable(true); }
      if (!mounted.current) return;
      ownRating.current = restored;
      savedStarsRef.current = restored?.stars ?? null;
      setSavedStars(restored?.stars ?? null); setSelected(restored?.pending?.stars ?? restored?.retryStars ?? restored?.stars ?? null); setPendingCommand(restored?.pending ?? null); setReady(true);
      if (restored?.pending || restored?.retryStars !== null && restored?.retryStars !== undefined) { setNeedsConfirmation(true); setSaveFailed(true); setSaveStatus("Your last rating update hasn’t been confirmed. Please try again."); }
    }
    void restore();
    return () => {
      mounted.current = false; summaryOpen.current = false; readGeneration.current += 1;
      readController.current?.abort(); writeController.current?.abort(); onBusyChange(false);
    };
  }, [onBusyChange]);

  useEffect(() => {
    if (!focusAfterRead.current || summaryState === "loading" || !summaryOpen.current) return;
    focusAfterRead.current = false;
    if (document.activeElement !== document.body && document.activeElement !== refreshRef.current && document.activeElement !== retryRef.current) return;
    // Restore focus only if it was on the action that initiated this request.
    if (lastFocusAction.current) (summaryState === "error" ? retryRef : refreshRef).current?.focus({ preventScroll: true });
  }, [summaryState]);

  function persistOwn(value: OwnAppRating) {
    ownRating.current = value; rememberOwnAppRating(value);
    setPendingCommand(value.pending);
    let persisted = false;
    try { persisted = saveOwnAppRating(window.localStorage, value); } catch { /* Memory keeps the key for same-page retries. */ }
    setStorageUnavailable(!persisted);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ready || writePending.current || selected === null || selected === savedStarsRef.current && !ownRating.current?.pending && !needsConfirmation || writeWait > 0) return;
    const stars = selected, updating = savedStarsRef.current !== null;
    let identity: OwnAppRating;
    try { identity = prepareOwnRatingCommand(ownRating.current ?? { token: randomRatingToken(), stars: null, revision: 0, pending: null, retryStars: null }, stars); }
    catch { setSaveFailed(true); setSaveStatus("We couldn’t prepare your rating. Please try again."); return; }
    const revision = identity.pending!.revision;
    // Keep the same token before sending, including when acknowledgement is lost.
    persistOwn(identity);
    writePending.current = true; setSaving(true); setSaveStatus(""); setSaveFailed(false); onBusyChange(true);
    const controller = new AbortController(); writeController.current = controller;
    try {
      const result = await feedbackRequest("/api/ratings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: identity.token, stars, revision }) }, controller.signal);
      if (!result || typeof result !== "object" || (result as { stars?: unknown }).stars !== stars || (result as { revision?: unknown }).revision !== revision) throw new Error("Unconfirmed rating");
      if (!mounted.current) return;
      persistOwn({ token: identity.token, stars, revision, pending: null, retryStars: null });
      setNeedsConfirmation(false);
      savedStarsRef.current = stars; setSavedStars(stars);
      setSaveStatus(updating ? "Your rating has been updated. You can change it on this device." : "Your rating has been saved. You can change it on this device.");
    } catch (error) {
      if (!mounted.current) return;
      setNeedsConfirmation(true);
      setSaveFailed(true);
      if (error instanceof FeedbackRequestError && error.status === 409) {
        persistOwn({ ...identity, pending: null, retryStars: stars });
        setSaveStatus("Your rating changed while this update was being saved. Please try again to save your selection.");
      } else if (error instanceof FeedbackRequestError && error.status === 429) {
        setWriteRetryAt(error.retryAt ?? Date.now() + 60_000);
        setSaveStatus("Please wait a moment before trying again. Your selection is still here.");
      } else setSaveStatus("We couldn’t confirm your rating was saved. Your selection is still here. Please try again.");
    } finally {
      writePending.current = false;
      if (mounted.current) { setSaving(false); onBusyChange(false); }
    }
  }

  function closeSummary() {
    summaryOpen.current = false; readGeneration.current += 1; readPending.current = false;
    readController.current?.abort(); focusAfterRead.current = false;
    setOpen(false); setSummaryState("idle"); setSnapshot(null); setSummaryStatus(""); setActiveAction(null);
  }

  async function requestSummary(action: "refresh" | "retry" | null = null) {
    if (!summaryOpen.current || readPending.current || readWait > 0) return;
    readPending.current = true;
    const generation = ++readGeneration.current;
    const ownStars = savedStarsRef.current;
    setActiveAction(action); setSummaryState("loading"); setSnapshot(null); setSummaryStatus("Loading app rating…");
    focusAfterRead.current = action !== null && document.activeElement === (action === "refresh" ? refreshRef : retryRef).current;
    lastFocusAction.current = action;
    const controller = new AbortController(); readController.current = controller;
    try {
      const data = parseAppRatingSummary(await feedbackRequest("/api/ratings/summary", {}, controller.signal));
      if (!mounted.current || !summaryOpen.current || generation !== readGeneration.current || controller.signal.aborted) return;
      setSnapshot({ data, ownStars }); setSummaryState(data.ratingCount === 0 ? "empty" : "success");
      setSummaryStatus(data.ratingCount === 0 ? "No ratings yet." : `App rating loaded: ${data.average!.toFixed(1)} out of 5, from ${data.ratingCount} ratings.`);
    } catch (error) {
      if (!mounted.current || !summaryOpen.current || generation !== readGeneration.current) return;
      if (error instanceof FeedbackRequestError && error.status === 429) setReadRetryAt(error.retryAt ?? Date.now() + 60_000);
      setSummaryState("error"); setSummaryStatus("");
    } finally {
      if (generation === readGeneration.current) readPending.current = false;
    }
  }

  function toggleSummary() {
    if (summaryOpen.current) { closeSummary(); return; }
    summaryOpen.current = true; setOpen(true);
    if (readWait > 0) { setSummaryState("error"); return; }
    void requestSummary();
  }

  const changed = snapshot !== null && snapshot.ownStars !== savedStars;
  const data = snapshot?.data;
  const showRefresh = summaryState === "success" || summaryState === "empty" || summaryState === "loading" && activeAction === "refresh";
  const showRetry = summaryState === "error" || summaryState === "loading" && activeAction === "retry";

  return <form id="rating-form" className={styles.rating} aria-labelledby="rating-title" onSubmit={save}>
    <div className={styles.ratingHeading}><h2 id="rating-title" className="bc-title">Overall app rating</h2><span className={styles.optional}>Optional</span></div>
    <p className={styles.ratingIntro}>Rate your experience using Bible Compass. No message needed.</p>
    <fieldset className={styles.ratingFieldset} disabled={!ready || saving}>
      <legend className="sr-only">Choose an overall app rating from 1 to 5 stars</legend>
      <div className={styles.stars}>{[1, 2, 3, 4, 5].map(stars => <label className={`${styles.star} ${selected !== null && stars <= selected ? styles.starFilled : ""}`} data-star={stars} key={stars}>
        <input type="radio" className="sr-only" name="app-rating" value={stars} aria-label={`${stars} out of 5 stars`} checked={selected === stars} onChange={() => { setSelected(stars); setSaveStatus(""); setSaveFailed(false); }} />
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.3 14.7 8.8l6.1.9-4.4 4.3 1 6.1-5.4-2.8-5.4 2.8 1-6.1-4.4-4.3 6.1-.9Z" strokeLinejoin="round" /></svg>
      </label>)}</div>
      <output id="selected-rating-score" className={styles.score} aria-live="polite">{selected === null ? 'Choose 1–5 stars.' : `${selected} out of 5 stars`}</output>
    </fieldset>
    <button id="save-app-rating" type="submit" className={`${styles.primary} ${styles.ratingSave}`} disabled={!ready || saving || selected === null || selected === savedStars && pendingCommand === null && !needsConfirmation || writeWait > 0}>{saving ? 'Saving…' : savedStars === null ? 'Save rating' : 'Update rating'}</button>
    {saveStatus && <p id="rating-status" className={styles.status} role={saveFailed ? 'alert' : 'status'}>{saveStatus}{writeWait > 0 && <span> Try again in {writeWait} seconds.</span>}</p>}
    {storageUnavailable && selected !== null && <p className={styles.storageWarning} role="status">This browser can’t keep your rating’s update key after a reload. Your rating can still be sent, but you may not be able to change the same rating later.</p>}
    <div className={styles.disclosure}>
      <button id="view-app-rating" className={styles.view} type="button" aria-expanded={open} aria-controls="app-rating-summary" onClick={toggleSummary}>{open ? 'Hide app rating' : 'View app rating'}<span aria-hidden="true">{open ? '−' : '＋'}</span></button>
      <section id="app-rating-summary" className={styles.summary} role="region" aria-labelledby="app-rating-summary-title" aria-busy={summaryState === 'loading'} hidden={!open}>
        <h3 id="app-rating-summary-title" className="bc-title">App rating from readers</h3>
        <p id="summary-status" className={summaryState === 'loading' ? styles.status : 'sr-only'} role="status" aria-live="polite">{summaryStatus}</p>
        {summaryState === 'success' && data && <div id="summary-results"><div className={styles.summaryMetrics}><strong id="aggregate-average" className={styles.average}>{data.average!.toFixed(1)} / 5</strong><span id="aggregate-count" className={styles.count}>from {data.ratingCount} {data.ratingCount === 1 ? 'rating' : 'ratings'}</span></div>
          <div id="summary-distribution" className={styles.distribution} aria-label="Rating breakdown">{[5, 4, 3, 2, 1].map(stars => <div key={stars} className={styles.distributionRow}><span className={styles.distributionLabel}>{stars} {stars === 1 ? 'star' : 'stars'}</span><span className={styles.track} aria-hidden="true"><span className={styles.fill} style={{ width: `${data.distribution[stars] / data.ratingCount * 100}%` }} /></span><span className={styles.distributionCount}>{data.distribution[stars]}</span></div>)}</div>
          <p id="summary-as-of" className={styles.asOf}>As of {new Date(data.asOf).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</p>
        </div>}
        {summaryState === 'empty' && <p id="summary-empty" className={styles.status}>No ratings yet.</p>}
        {summaryState === 'error' && <p id="summary-error" className={styles.status} role="alert">We couldn’t load the app rating. Please try again.{readWait > 0 && <span> Try again in {readWait} seconds.</span>}</p>}
        {changed && <p id="summary-changed" className={styles.changed} role="status">Your rating changed. Refresh to see the latest overall score.</p>}
        {showRefresh && <button ref={refreshRef} id="summary-refresh" type="button" className={styles.quiet} disabled={summaryState === 'loading' || readWait > 0} onClick={() => void requestSummary('refresh')}>Refresh</button>}
        {showRetry && <button ref={retryRef} id="summary-retry" type="button" className={styles.quiet} disabled={summaryState === 'loading' || readWait > 0} onClick={() => void requestSummary('retry')}>Retry</button>}
      </section>
    </div>
  </form>;
}
