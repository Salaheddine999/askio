import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { ChevronDown, ChevronUp, ExternalLink, GripVertical, MessageSquareText, Pencil, Plus, Search, Star, Trash2 } from "lucide-react";
import { EmptyState, focusRing, primaryButton, secondaryButton, surface } from "../../pages/dashboard/ui";
import { Field, inputClass } from "./controls";
import { LIMITS } from "./types";
import { normalizeContactLink } from "../../utils/links";
import { pickSuggested, SUGGESTED_QUESTIONS } from "../../utils/suggestions";
import { useT } from "../../i18n";
import { editorMessages } from "../../i18n/messages/editor";

type Faq = { question: string; answer: string; suggested?: boolean; buttonLabel?: string; buttonUrl?: string };

interface Props {
  faqs: Faq[];
  onChange: (faqs: Faq[]) => void;
  /** The "Generate with AI" control, when this build includes it. */
  aiGenerator?: React.ReactNode;
  /** A question to start answering, e.g. from an unanswered one in Analytics. */
  initialQuestion?: string | null;
}

const SEARCH_FROM = 6;

const FaqEditor: React.FC<{
  initial: Faq;
  isNew: boolean;
  others: Faq[];
  onSave: (faq: Faq) => void;
  onCancel: () => void;
}> = ({ initial, isNew, others, onSave, onCancel }) => {
  const t = useT(editorMessages);
  const [draft, setDraft] = useState(initial);
  const questionRef = useRef<HTMLInputElement>(null);
  const answerRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Coming from Analytics the question is already there; go to the answer.
    if (initial.question && !initial.answer) answerRef.current?.focus();
    else questionRef.current?.focus();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const question = draft.question.trim();
  const answer = draft.answer.trim();
  const buttonLabel = (draft.buttonLabel || "").trim();
  const buttonUrl = normalizeContactLink(draft.buttonUrl) || "";
  // A button needs both parts; half of one is a mistake, not "no button".
  const buttonIncomplete = (buttonLabel.length > 0) !== (buttonUrl.length > 0) || (!!(draft.buttonUrl || "").trim() && !buttonUrl);
  const duplicate =
    question.length > 0 && others.some((f) => f.question.trim().toLowerCase() === question.toLowerCase());
  const canSave = question.length > 0 && answer.length > 0 && !buttonIncomplete;
  const [showButton, setShowButton] = useState(Boolean(initial.buttonLabel || initial.buttonUrl));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canSave) onSave({ question, answer, ...(buttonLabel && buttonUrl ? { buttonLabel, buttonUrl } : {}) });
  };

  return (
    <form
      onSubmit={submit}
      onKeyDown={(e) => {
        if (e.key === "Escape") onCancel();
      }}
      className="space-y-4 bg-[#F3F7FC] px-5 py-5 sm:px-6 dark:bg-[#141D2B]"
    >
      <Field
        label={t("question")}
        htmlFor="faq-question"
        hint={duplicate ? t("duplicateHint") : t("questionHint")}
        counter={{ value: draft.question.length, max: LIMITS.question }}
      >
        <input
          ref={questionRef}
          id="faq-question"
          className={`${inputClass} h-10`}
          placeholder={t("questionPlaceholder")}
          maxLength={LIMITS.question}
          value={draft.question}
          onChange={(e) => setDraft((d) => ({ ...d, question: e.target.value }))}
        />
      </Field>
      <Field label={t("answer")} htmlFor="faq-answer" counter={{ value: draft.answer.length, max: LIMITS.answer }}>
        <textarea
          ref={answerRef}
          id="faq-answer"
          rows={4}
          className={`${inputClass} resize-y py-2.5 leading-relaxed`}
          placeholder={t("answerPlaceholder")}
          maxLength={LIMITS.answer}
          value={draft.answer}
          onChange={(e) => setDraft((d) => ({ ...d, answer: e.target.value }))}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit(e);
          }}
        />
      </Field>
      {showButton ? (
        <div className="space-y-3 rounded-xl border border-[#D8DFE9] bg-[#F9FCFF] p-4 dark:border-[#2B3646] dark:bg-[#1A2533]">
          <div>
            <p className="text-body-sm font-medium text-[#101723] dark:text-[#D7DFE5]">{t("buttonSection")}</p>
            <p className="mt-0.5 text-caption text-[#647184] dark:text-[#87909D]">{t("buttonHint")}</p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label={t("buttonLabel")} htmlFor="faq-button-label">
              <input
                id="faq-button-label"
                className={`${inputClass} h-10`}
                placeholder={t("buttonLabelPlaceholder")}
                maxLength={40}
                value={draft.buttonLabel || ""}
                onChange={(e) => setDraft((d) => ({ ...d, buttonLabel: e.target.value }))}
              />
            </Field>
            <Field label={t("buttonUrl")} htmlFor="faq-button-url">
              <input
                id="faq-button-url"
                className={`${inputClass} h-10`}
                placeholder={t("buttonUrlPlaceholder")}
                autoComplete="off"
                spellCheck={false}
                value={draft.buttonUrl || ""}
                onChange={(e) => setDraft((d) => ({ ...d, buttonUrl: e.target.value }))}
              />
            </Field>
          </div>
          {buttonIncomplete && <p className="text-caption text-amber-700 dark:text-amber-300">{t("buttonIncomplete")}</p>}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowButton(true)}
          className={`inline-flex items-center gap-1.5 rounded-md text-caption font-medium text-[#566273] hover:text-[#101723] dark:text-[#9BAABD] dark:hover:text-[#D7DFE5] ${focusRing}`}
        >
          <Plus size={13} />
          {t("buttonSection")}
        </button>
      )}
      <div className="flex items-center justify-end gap-2">
        <button type="button" onClick={onCancel} className={secondaryButton}>
          {t("cancel")}
        </button>
        <button type="submit" disabled={!canSave} className={primaryButton}>
          {isNew ? t("addQuestion") : t("saveQuestion")}
        </button>
      </div>
    </form>
  );
};

const FaqTab: React.FC<Props> = ({ faqs, onChange, aiGenerator, initialQuestion }) => {
  const t = useT(editorMessages);
  const [editing, setEditing] = useState<number | "new" | null>(initialQuestion ? "new" : null);
  const [newDraft, setNewDraft] = useState<Faq>({ question: initialQuestion || "", answer: "" });
  const [query, setQuery] = useState("");
  // Drag to reorder. The order matters: the first questions are the ones the
  // widget suggests, so it's off while searching or editing.
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const canReorder = faqs.length > 1 && !query.trim() && editing === null;

  const move = (from: number, to: number) => {
    if (from === to || to < 0 || to >= faqs.length) return;
    const next = [...faqs];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };
  const endDrag = () => {
    setDragIndex(null);
    setOverIndex(null);
  };

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return faqs
      .map((faq, index) => ({ faq, index }))
      .filter(({ faq }) => !q || faq.question.toLowerCase().includes(q) || faq.answer.toLowerCase().includes(q));
  }, [faqs, query]);

  const startNew = () => {
    setNewDraft({ question: "", answer: "" });
    setEditing("new");
    setQuery("");
  };

  const save = (index: number | "new", faq: Faq) => {
    // Editing keeps a question's star.
    // The new version replaces the old one's button (or lack of one).
    onChange(index === "new" ? [faq, ...faqs] : faqs.map((f, i) => (i === index ? { ...(f.suggested ? { suggested: true } : {}), ...faq } : f)));
    setEditing(null);
  };

  // What the widget suggests first: the starred questions, or the first ones.
  const suggestedSet = useMemo(() => new Set(pickSuggested(faqs)), [faqs]);
  const starredCount = faqs.filter((f) => f.suggested).length;
  const toggleSuggested = (index: number) => {
    const faq = faqs[index];
    if (!faq.suggested && starredCount >= SUGGESTED_QUESTIONS) {
      toast(t("suggestLimit", { count: SUGGESTED_QUESTIONS }));
      return;
    }
    onChange(
      faqs.map((f, i) => {
        if (i !== index) return f;
        if (f.suggested) {
          const { suggested: _suggested, ...rest } = f; // eslint-disable-line @typescript-eslint/no-unused-vars
          return rest;
        }
        return { ...f, suggested: true };
      })
    );
  };

  const remove = (index: number) => {
    const removed = faqs[index];
    const before = faqs;
    onChange(faqs.filter((_, i) => i !== index));
    if (editing === index) setEditing(null);
    toast(
      (toastItem) => (
        <span className="flex items-center gap-3 text-body-sm">
          {t("questionRemoved")}
          <button
            className="font-semibold underline underline-offset-2"
            onClick={() => {
              onChange(before);
              toast.dismiss(toastItem.id);
            }}
          >
            {t("undo")}
          </button>
        </span>
      ),
      { id: `faq-removed-${removed.question}`, duration: 5000 }
    );
  };

  return (
    <section className={surface}>
      <div className="flex flex-col gap-4 border-b border-[#E7EDF6] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:border-[#2B3646]">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-body font-semibold text-[#101723] dark:text-[#E7EDF6]">
            {t("qaTitle")}
            {faqs.length > 0 && (
              <span className="rounded-full bg-[#E7EDF6] px-2 py-0.5 text-caption font-medium tabular-nums text-[#566273] dark:bg-[#273444] dark:text-[#9BAABD]">
                {faqs.length}
              </span>
            )}
          </h2>
          <p className="mt-0.5 text-body-sm text-[#647184] dark:text-[#87909D]">
            {t("qaDesc")}
            {faqs.length > 1 && <> {t("reorderHint", { count: SUGGESTED_QUESTIONS })}</>}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {aiGenerator}
          <button type="button" onClick={startNew} disabled={editing === "new"} className={primaryButton}>
            <Plus size={16} />
            {t("addQuestion")}
          </button>
        </div>
      </div>

      {faqs.length >= SEARCH_FROM && (
        <div className="border-b border-[#E7EDF6] px-5 py-3 sm:px-6 dark:border-[#2B3646]">
          <div className="relative">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#87909D]"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.plural("searchQuestions", faqs.length)}
              aria-label={t("searchAria")}
              className={`${inputClass} h-9 pl-9`}
            />
          </div>
        </div>
      )}

      {editing === "new" && (
        <div className="border-b border-[#E7EDF6] dark:border-[#2B3646]">
          <FaqEditor
            key="new"
            initial={newDraft}
            isNew
            others={faqs}
            onSave={(faq) => save("new", faq)}
            onCancel={() => setEditing(null)}
          />
        </div>
      )}

      {faqs.length === 0 && editing !== "new" ? (
        <EmptyState
          compact
          icon={MessageSquareText}
          title={t("noQuestions")}
          description={t("noQuestionsDesc")}
          action={
            <button type="button" onClick={startNew} className={secondaryButton}>
              <Plus size={16} />
              {t("addFirstQuestion")}
            </button>
          }
        />
      ) : visible.length === 0 && faqs.length > 0 ? (
        <p className="px-6 py-10 text-center text-body-sm text-[#647184] dark:text-[#87909D]">
          {t("noMatch", { query: query.trim() })}
        </p>
      ) : (
        <ul className="divide-y divide-[#E7EDF6] dark:divide-[#2B3646]">
          {visible.map(({ faq, index }) =>
            editing === index ? (
              <li key={`edit-${index}`}>
                <FaqEditor
                  initial={faq}
                  isNew={false}
                  others={faqs.filter((_, i) => i !== index)}
                  onSave={(next) => save(index, next)}
                  onCancel={() => setEditing(null)}
                />
              </li>
            ) : (
              <li
                key={`${index}-${faq.question}`}
                draggable={canReorder}
                onDragStart={(e) => {
                  setDragIndex(index);
                  e.dataTransfer.effectAllowed = "move";
                }}
                onDragOver={(e) => {
                  if (dragIndex === null) return;
                  e.preventDefault();
                  if (overIndex !== index) setOverIndex(index);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (dragIndex !== null) move(dragIndex, index);
                  endDrag();
                }}
                onDragEnd={endDrag}
                className={`group relative flex items-start gap-3 px-5 py-4 sm:px-6 ${dragIndex === index ? "opacity-50" : ""} ${
                  overIndex === index && dragIndex !== null && dragIndex !== index
                    ? dragIndex > index
                      ? "shadow-[inset_0_2px_0_#101723] dark:shadow-[inset_0_2px_0_#D7DFE5]"
                      : "shadow-[inset_0_-2px_0_#101723] dark:shadow-[inset_0_-2px_0_#D7DFE5]"
                    : ""
                }`}
              >
                {canReorder && (
                  <span
                    aria-hidden
                    title={t("dragToReorder")}
                    className="-ml-2 mt-0.5 hidden shrink-0 cursor-grab text-[#B8C2CF] active:cursor-grabbing sm:block dark:text-[#4A5A6E]"
                  >
                    <GripVertical size={16} />
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setEditing(index)}
                  className={`min-w-0 flex-1 rounded-md text-left ${focusRing}`}
                >
                  <p className="text-body-sm font-medium text-[#101723] dark:text-[#D7DFE5]">
                    {faq.question}
                    {suggestedSet.has(faq) && faqs.length > 1 && (
                      <span className="ml-2 inline-block rounded-full bg-[#E7EDF6] px-2 py-px align-[1px] text-[11px] font-medium text-[#566273] dark:bg-[#273444] dark:text-[#9BAABD]">
                        {t("suggestedBadge")}
                      </span>
                    )}
                  </p>
                  <p className="mt-1 line-clamp-2 text-body-sm text-[#566273] dark:text-[#9BAABD]">{faq.answer}</p>
                  {faq.buttonLabel && faq.buttonUrl && (
                    <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-[#E7EDF6] px-2 py-0.5 text-[11px] font-medium text-[#566273] dark:bg-[#273444] dark:text-[#9BAABD]">
                      <ExternalLink size={10} aria-hidden="true" />
                      {t("buttonBadge", { label: faq.buttonLabel })}
                    </span>
                  )}
                </button>
                <div className="flex shrink-0 items-center gap-0.5 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                  {faqs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => toggleSuggested(index)}
                      aria-pressed={faq.suggested === true}
                      aria-label={t(faq.suggested ? "unsuggestQuestion" : "suggestQuestion", { question: faq.question })}
                      title={t(faq.suggested ? "unsuggestQuestion" : "suggestQuestion", { question: faq.question })}
                      className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-[#E7EDF6] dark:hover:bg-[#273444] ${focusRing} ${
                        faq.suggested
                          ? "text-[#D7A43B]"
                          : "text-[#647184] hover:text-[#101723] dark:text-[#9BAABD] dark:hover:text-[#D7DFE5]"
                      }`}
                    >
                      <Star size={15} fill={faq.suggested ? "currentColor" : "none"} />
                    </button>
                  )}
                  {canReorder && (
                    <>
                      <button
                        type="button"
                        onClick={() => move(index, index - 1)}
                        disabled={index === 0}
                        aria-label={t("moveUp", { question: faq.question })}
                        className={`flex h-8 w-8 items-center justify-center rounded-lg text-[#647184] transition-colors hover:bg-[#E7EDF6] hover:text-[#101723] disabled:pointer-events-none disabled:opacity-30 dark:text-[#9BAABD] dark:hover:bg-[#273444] dark:hover:text-[#D7DFE5] ${focusRing}`}
                      >
                        <ChevronUp size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => move(index, index + 1)}
                        disabled={index === faqs.length - 1}
                        aria-label={t("moveDown", { question: faq.question })}
                        className={`flex h-8 w-8 items-center justify-center rounded-lg text-[#647184] transition-colors hover:bg-[#E7EDF6] hover:text-[#101723] disabled:pointer-events-none disabled:opacity-30 dark:text-[#9BAABD] dark:hover:bg-[#273444] dark:hover:text-[#D7DFE5] ${focusRing}`}
                      >
                        <ChevronDown size={15} />
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => setEditing(index)}
                    aria-label={t("editQuestion", { question: faq.question })}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg text-[#647184] transition-colors hover:bg-[#E7EDF6] hover:text-[#101723] dark:text-[#9BAABD] dark:hover:bg-[#273444] dark:hover:text-[#D7DFE5] ${focusRing}`}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    aria-label={t("deleteQuestion", { question: faq.question })}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg text-[#647184] transition-colors hover:bg-red-50 hover:text-red-600 dark:text-[#9BAABD] dark:hover:bg-red-950/30 dark:hover:text-red-400 ${focusRing}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </li>
            )
          )}
        </ul>
      )}
    </section>
  );
};

export default FaqTab;
