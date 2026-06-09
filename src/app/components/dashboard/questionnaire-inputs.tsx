import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { copy } from "@/lib/copy";
import type { PolicyQuestion } from "@/lib/types";
import {
  isExclusiveOption,
  isOtherOption,
  otherDetailKey,
  toggleMultiSelection,
} from "@/lib/questionnaire-utils";
import { cn } from "../ui/utils";

export function QuestionInput({
  question,
  value,
  otherDetail = "",
  onAnswer,
  onOtherDetailChange,
}: {
  question: PolicyQuestion;
  value: unknown;
  otherDetail?: string;
  onAnswer: (value: unknown) => void;
  onOtherDetailChange?: (detail: string) => void;
}) {
  const [textValue, setTextValue] = useState("");
  const [numberValue, setNumberValue] = useState("");
  const [singleOther, setSingleOther] = useState(otherDetail);

  useEffect(() => {
    setTextValue(typeof value === "string" && !question.options?.includes(value) ? String(value) : "");
    setNumberValue(typeof value === "number" ? String(value) : "");
    setSingleOther(otherDetail);
  }, [question.id, value, otherDetail, question.options]);

  if (question.type === "single" && question.options?.length) {
    const showOtherBox =
      typeof value === "string" && isOtherOption(value) && onOtherDetailChange;

    return (
      <div className="space-y-2">
        {question.options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onAnswer(option)}
            className={cn(
              "w-full text-left p-4 rounded-lg border transition-all duration-200",
              value === option
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/30 hover:bg-accent/50"
            )}
          >
            {option}
          </button>
        ))}
        {showOtherBox ? (
          <label className="block pt-2">
            <span className="text-sm text-muted-foreground">Please describe</span>
            <textarea
              value={singleOther}
              onChange={(e) => {
                setSingleOther(e.target.value);
                onOtherDetailChange(e.target.value);
              }}
              rows={2}
              placeholder="Tell us more…"
              className="mt-1.5 w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
            />
          </label>
        ) : null}
      </div>
    );
  }

  if (question.type === "multi" && question.options?.length) {
    return (
      <MultiQuestionInput
        question={question}
        value={value}
        otherDetail={otherDetail}
        onAnswer={onAnswer}
        onOtherDetailChange={onOtherDetailChange}
      />
    );
  }

  if (question.type === "number") {
    const optional = question.required === false;
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const raw = new FormData(e.currentTarget).get("answer");
          const num = Number(raw);
          if (Number.isFinite(num) && num > 0) onAnswer(num);
          else if (optional && raw === "") onAnswer(undefined);
        }}
        className="space-y-4"
      >
        <input
          name="answer"
          type="number"
          value={numberValue}
          onChange={(event) => setNumberValue(event.target.value)}
          className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
          placeholder="Enter amount in PKR"
          required={!optional}
        />
        <button
          type="submit"
          className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium"
        >
          {copy.compare.questionnaireCta}
        </button>
      </form>
    );
  }

  const optional = question.required === false;
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const raw = new FormData(e.currentTarget).get("answer");
        if (typeof raw === "string" && raw.trim()) onAnswer(raw.trim());
        else if (optional) onAnswer(undefined);
      }}
      className="space-y-4"
    >
      <input
        name="answer"
        type="text"
        value={textValue}
        onChange={(event) => setTextValue(event.target.value)}
        className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
        required={!optional}
      />
      <button
        type="submit"
        className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium"
      >
        {copy.compare.questionnaireCta}
      </button>
    </form>
  );
}

export function MultiQuestionInput({
  question,
  value,
  otherDetail = "",
  onAnswer,
  onOtherDetailChange,
}: {
  question: PolicyQuestion;
  value: unknown;
  otherDetail?: string;
  onAnswer: (value: unknown) => void;
  onOtherDetailChange?: (detail: string) => void;
}) {
  const [selected, setSelected] = useState<string[]>(
    Array.isArray(value) ? value.map(String) : []
  );
  const [localOther, setLocalOther] = useState(otherDetail);

  useEffect(() => {
    setSelected(Array.isArray(value) ? value.map(String) : []);
    setLocalOther(otherDetail);
  }, [question.id, value, otherDetail]);

  const hasOtherSelected = selected.some((opt) => isOtherOption(opt));
  const otherValid = !hasOtherSelected || localOther.trim().length >= 2;
  const canContinue =
    (question.required === false || selected.length > 0) && otherValid;

  const toggle = (option: string) => {
    setSelected((current) => toggleMultiSelection(current, option));
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {question.options?.map((option) => {
          const checked = selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => toggle(option)}
              className={cn(
                "w-full text-left p-4 rounded-lg border transition-all duration-200 flex items-center gap-3",
                checked
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/30 hover:bg-accent/50"
              )}
            >
              <span
                className={cn(
                  "w-5 h-5 rounded border flex items-center justify-center shrink-0",
                  checked ? "bg-primary border-primary text-primary-foreground" : "border-border"
                )}
              >
                {checked ? <CheckCircle2 className="w-3.5 h-3.5" /> : null}
              </span>
              <span>{option}</span>
              {isExclusiveOption(option) ? (
                <span className="ml-auto text-[10px] uppercase tracking-wide text-muted-foreground">
                  Clears others
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
      {hasOtherSelected && onOtherDetailChange ? (
        <label className="block">
          <span className="text-sm text-muted-foreground">Please describe your selection</span>
          <textarea
            value={localOther}
            onChange={(e) => {
              setLocalOther(e.target.value);
              onOtherDetailChange(e.target.value);
            }}
            rows={2}
            placeholder="Tell us more about your choice…"
            className="mt-1.5 w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
          />
        </label>
      ) : null}
      <button
        type="button"
        onClick={() => {
          if (hasOtherSelected && onOtherDetailChange) {
            onOtherDetailChange(localOther.trim());
          }
          onAnswer(selected);
        }}
        disabled={!canContinue}
        className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50"
      >
        {copy.compare.questionnaireCta}
      </button>
    </div>
  );
}

export { otherDetailKey };
