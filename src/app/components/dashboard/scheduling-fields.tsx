import { PREFERRED_TIME_SLOTS, nextBusinessDayIso } from "@/lib/scheduling";

export interface SchedulingValues {
  preferredCallDate: string;
  preferredCallTimeSlot: string;
  preferredSurveyDate: string;
  preferredSurveyTimeSlot: string;
}

interface SchedulingFieldsProps {
  values: SchedulingValues;
  onChange: (values: SchedulingValues) => void;
  showSurvey?: boolean;
  errors?: Partial<Record<keyof SchedulingValues, string>>;
}

export function SchedulingFields({
  values,
  onChange,
  showSurvey = false,
  errors = {},
}: SchedulingFieldsProps) {
  const minDate = nextBusinessDayIso();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-1">Schedule your call</h2>
        <p className="text-sm text-muted-foreground">
          A ClearClever agent will call you to confirm details. Choose a convenient date and time
          slot.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="preferred_call_date" className="block text-sm font-medium mb-1.5">
            Preferred call date *
          </label>
          <input
            id="preferred_call_date"
            type="date"
            min={minDate}
            value={values.preferredCallDate}
            onChange={(event) => onChange({ ...values, preferredCallDate: event.target.value })}
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
          />
          {errors.preferredCallDate ? (
            <p className="text-xs text-destructive mt-1">{errors.preferredCallDate}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="preferred_call_time_slot" className="block text-sm font-medium mb-1.5">
            Time slot *
          </label>
          <select
            id="preferred_call_time_slot"
            value={values.preferredCallTimeSlot}
            onChange={(event) =>
              onChange({ ...values, preferredCallTimeSlot: event.target.value })
            }
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
          >
            <option value="">Select a time slot</option>
            {PREFERRED_TIME_SLOTS.map((slot) => (
              <option key={slot} value={slot}>
                {slot}
              </option>
            ))}
          </select>
          {errors.preferredCallTimeSlot ? (
            <p className="text-xs text-destructive mt-1">{errors.preferredCallTimeSlot}</p>
          ) : null}
        </div>
      </div>

      {showSurvey ? (
        <div className="rounded-xl border border-border p-4 space-y-4 bg-muted/20">
          <p className="text-sm text-muted-foreground">
            Survey of your car has to be conducted before providing coverage. What time slot suits
            you? (optional)
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="preferred_survey_date" className="block text-sm font-medium mb-1.5">
                Preferred survey date
              </label>
              <input
                id="preferred_survey_date"
                type="date"
                min={minDate}
                value={values.preferredSurveyDate}
                onChange={(event) =>
                  onChange({ ...values, preferredSurveyDate: event.target.value })
                }
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label htmlFor="preferred_survey_time_slot" className="block text-sm font-medium mb-1.5">
                Survey time slot
              </label>
              <select
                id="preferred_survey_time_slot"
                value={values.preferredSurveyTimeSlot}
                onChange={(event) =>
                  onChange({ ...values, preferredSurveyTimeSlot: event.target.value })
                }
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
              >
                <option value="">Select a time slot</option>
                {PREFERRED_TIME_SLOTS.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {errors.preferredSurveyDate ? (
            <p className="text-xs text-destructive">{errors.preferredSurveyDate}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function isWeekday(dateStr: string): boolean {
  const date = new Date(`${dateStr}T12:00:00`);
  const day = date.getDay();
  return day !== 0 && day !== 6;
}

export function validateSchedulingValues(
  values: SchedulingValues,
  options?: { requireSurveyPair?: boolean }
): Partial<Record<keyof SchedulingValues, string>> {
  const errors: Partial<Record<keyof SchedulingValues, string>> = {};
  if (!values.preferredCallDate) {
    errors.preferredCallDate = "Call date is required";
  } else if (!isWeekday(values.preferredCallDate)) {
    errors.preferredCallDate = "Choose a weekday";
  }
  if (!values.preferredCallTimeSlot) {
    errors.preferredCallTimeSlot = "Select a call time slot";
  } else if (!(PREFERRED_TIME_SLOTS as readonly string[]).includes(values.preferredCallTimeSlot)) {
    errors.preferredCallTimeSlot = "Invalid time slot";
  }

  const hasSurveyDate = Boolean(values.preferredSurveyDate);
  const hasSurveySlot = Boolean(values.preferredSurveyTimeSlot);
  if (options?.requireSurveyPair && (hasSurveyDate !== hasSurveySlot)) {
    errors.preferredSurveyDate = "Provide both survey date and time slot, or leave both empty";
  }
  if (hasSurveyDate && !isWeekday(values.preferredSurveyDate)) {
    errors.preferredSurveyDate = "Choose a weekday for the survey";
  }

  return errors;
}

export function schedulingValuesToAnswers(values: SchedulingValues): Record<string, unknown> {
  const answers: Record<string, unknown> = {
    preferred_call_date: values.preferredCallDate,
    preferred_call_time_slot: values.preferredCallTimeSlot,
  };
  if (values.preferredSurveyDate && values.preferredSurveyTimeSlot) {
    answers.preferred_survey_date = values.preferredSurveyDate;
    answers.preferred_survey_time_slot = values.preferredSurveyTimeSlot;
  }
  return answers;
}

export function vehicleValuesToAnswers(values: {
  registrationNumber: string;
  registrationCity: string;
  brandNewNoPlate: boolean;
}): Record<string, unknown> {
  return {
    registration_number: values.brandNewNoPlate ? "" : values.registrationNumber.trim(),
    registration_city: values.registrationCity,
    brand_new_no_plate: values.brandNewNoPlate,
  };
}

export function defaultSchedulingValues(): SchedulingValues {
  return {
    preferredCallDate: nextBusinessDayIso(),
    preferredCallTimeSlot: PREFERRED_TIME_SLOTS[2],
    preferredSurveyDate: "",
    preferredSurveyTimeSlot: "",
  };
}
