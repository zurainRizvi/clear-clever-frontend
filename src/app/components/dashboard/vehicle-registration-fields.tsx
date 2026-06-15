import { REGISTRATION_CITIES, isValidRegistrationNumber } from "@/lib/scheduling";

export interface VehicleRegistrationValues {
  registrationNumber: string;
  registrationCity: string;
  brandNewNoPlate: boolean;
}

interface VehicleRegistrationFieldsProps {
  values: VehicleRegistrationValues;
  onChange: (values: VehicleRegistrationValues) => void;
  errors?: Partial<Record<keyof VehicleRegistrationValues, string>>;
}

export function VehicleRegistrationFields({
  values,
  onChange,
  errors = {},
}: VehicleRegistrationFieldsProps) {
  const handleBrandNewToggle = (checked: boolean) => {
    onChange({
      ...values,
      brandNewNoPlate: checked,
      registrationNumber: checked ? "" : values.registrationNumber,
    });
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold mb-1">Vehicle details</h2>
        <p className="text-sm text-muted-foreground">
          Provide registration details for your vehicle. Brand-new cars without plates can opt out
          below.
        </p>
      </div>

      <label className="flex items-start gap-3 rounded-lg border border-border p-4 cursor-pointer hover:bg-accent/40">
        <input
          type="checkbox"
          checked={values.brandNewNoPlate}
          onChange={(event) => handleBrandNewToggle(event.target.checked)}
          className="mt-1"
        />
        <span>
          <span className="font-medium block">Brand new — no registration number yet</span>
          <span className="text-sm text-muted-foreground">
            Skip the plate number if your car has not been registered yet.
          </span>
        </span>
      </label>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="registration_number" className="block text-sm font-medium mb-1.5">
            Car registration number {!values.brandNewNoPlate ? "*" : ""}
          </label>
          <input
            id="registration_number"
            type="text"
            value={values.registrationNumber}
            disabled={values.brandNewNoPlate}
            placeholder="e.g. ABC-123"
            onChange={(event) =>
              onChange({ ...values, registrationNumber: event.target.value })
            }
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm disabled:opacity-50"
          />
          {errors.registrationNumber ? (
            <p className="text-xs text-destructive mt-1">{errors.registrationNumber}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="registration_city" className="block text-sm font-medium mb-1.5">
            Registration city *
          </label>
          <select
            id="registration_city"
            value={values.registrationCity}
            onChange={(event) => onChange({ ...values, registrationCity: event.target.value })}
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
          >
            <option value="">Select city</option>
            {REGISTRATION_CITIES.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
          {errors.registrationCity ? (
            <p className="text-xs text-destructive mt-1">{errors.registrationCity}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function validateVehicleRegistration(values: VehicleRegistrationValues): Partial<
  Record<keyof VehicleRegistrationValues, string>
> {
  const errors: Partial<Record<keyof VehicleRegistrationValues, string>> = {};
  if (!values.registrationCity.trim()) {
    errors.registrationCity = "Registration city is required";
  }
  if (!values.brandNewNoPlate) {
    if (!values.registrationNumber.trim()) {
      errors.registrationNumber = "Registration number is required";
    } else if (!isValidRegistrationNumber(values.registrationNumber)) {
      errors.registrationNumber = "Enter a valid plate number (letters, numbers, hyphens)";
    }
  }
  return errors;
}
