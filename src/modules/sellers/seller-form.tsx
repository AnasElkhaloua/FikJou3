"use client";

import { useActionState } from "react";

import {
  initialMarketplaceActionState,
  type MarketplaceActionState,
} from "@/modules/marketplace/action-state";
import type { LocationOption } from "@/modules/locations/repository";

type SellerFormValue = Readonly<{
  allowPhone: boolean;
  allowPlatformMessages: boolean;
  allowWhatsApp: boolean;
  areaId: string | null;
  bio: string;
  cityId: string;
  contactPhone: string | null;
  displayName: string;
}>;

type Props = Readonly<{
  action: (
    state: MarketplaceActionState,
    formData: FormData,
  ) => Promise<MarketplaceActionState>;
  areas: readonly LocationOption[];
  cities: readonly LocationOption[];
  labels: Record<string, string>;
  value?: SellerFormValue;
}>;

export function SellerForm({ action, areas, cities, labels, value }: Props) {
  const [state, formAction, pending] = useActionState(
    action,
    initialMarketplaceActionState,
  );

  return (
    <form action={formAction} className="management-form">
      {state.status !== "idle" ? (
        <p
          className={`form-notice ${state.status}`}
          role={state.status === "error" ? "alert" : "status"}
        >
          {state.message}
        </p>
      ) : null}
      <label className="form-field">
        <span>{labels.displayName}</span>
        <input
          defaultValue={value?.displayName}
          maxLength={80}
          name="displayName"
          required
          type="text"
        />
      </label>
      <label className="form-field form-field-wide">
        <span>{labels.bio}</span>
        <textarea
          defaultValue={value?.bio}
          maxLength={800}
          name="bio"
          rows={5}
        />
        <small>{labels.bioHint}</small>
      </label>
      <label className="form-field">
        <span>{labels.city}</span>
        <select defaultValue={value?.cityId} name="cityId" required>
          <option value="">{labels.chooseCity}</option>
          {cities.map((city) => (
            <option key={city.id} value={city.id}>
              {city.name}
            </option>
          ))}
        </select>
      </label>
      <label className="form-field">
        <span>{labels.area}</span>
        <select defaultValue={value?.areaId ?? ""} name="areaId">
          <option value="">{labels.chooseArea}</option>
          {areas.map((area) => (
            <option key={area.id} value={area.id}>
              {area.name}
            </option>
          ))}
        </select>
      </label>
      <fieldset className="form-field form-field-wide preference-fieldset">
        <legend>{labels.contactPreferences}</legend>
        <label className="check-field">
          <input
            defaultChecked={value?.allowPlatformMessages ?? true}
            name="allowPlatformMessages"
            type="checkbox"
          />
          <span>{labels.platformMessages}</span>
        </label>
        <label className="check-field">
          <input
            defaultChecked={value?.allowWhatsApp}
            name="allowWhatsApp"
            type="checkbox"
          />
          <span>{labels.whatsApp}</span>
        </label>
        <label className="check-field">
          <input
            defaultChecked={value?.allowPhone}
            name="allowPhone"
            type="checkbox"
          />
          <span>{labels.phoneCalls}</span>
        </label>
      </fieldset>
      <label className="form-field form-field-wide">
        <span>{labels.contactPhone}</span>
        <input
          autoComplete="tel"
          defaultValue={value?.contactPhone ?? ""}
          inputMode="tel"
          name="contactPhone"
          type="tel"
        />
        <small>{labels.phoneHint}</small>
      </label>
      <div className="form-actions form-field-wide">
        <button className="primary-button" disabled={pending} type="submit">
          {pending ? labels.saving : value ? labels.save : labels.create}
        </button>
      </div>
    </form>
  );
}
