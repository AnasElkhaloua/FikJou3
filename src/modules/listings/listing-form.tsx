"use client";

import { useActionState } from "react";

import {
  initialMarketplaceActionState,
  type MarketplaceActionState,
} from "@/modules/marketplace/action-state";
import type { PublicCategory } from "@/modules/categories/repository";
import type { LocationOption } from "@/modules/locations/repository";

import { ImageOrderManager } from "./image-order-manager";

type ListingFormValue = Readonly<{
  areaId: string | null;
  categoryId: string;
  cityId: string;
  deliveryAvailable: boolean;
  description: string;
  images: readonly Readonly<{ deliveryUrl: string; id: string }>[];
  pickupAvailable: boolean;
  priceAmount: string | null;
  status: "DRAFT" | "ACTIVE" | "PAUSED" | "REMOVED";
  title: string;
}>;

type Props = Readonly<{
  action: (
    state: MarketplaceActionState,
    formData: FormData,
  ) => Promise<MarketplaceActionState>;
  areas: readonly LocationOption[];
  categories: readonly PublicCategory[];
  cities: readonly LocationOption[];
  labels: Record<string, string>;
  value?: ListingFormValue;
}>;

export function ListingForm({
  action,
  areas,
  categories,
  cities,
  labels,
  value,
}: Props) {
  const [state, formAction, pending] = useActionState(
    action,
    initialMarketplaceActionState,
  );
  const canPublish = !value || value.status === "DRAFT";

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
      <label className="form-field form-field-wide">
        <span>{labels.images}</span>
        <input
          accept="image/jpeg,image/png,image/webp"
          aria-describedby="image-hint"
          multiple
          name="images"
          type="file"
        />
        <small id="image-hint">{labels.imageHint}</small>
      </label>
      {value?.images.length ? (
        <div className="form-field-wide">
          <p className="field-label">{labels.currentImages}</p>
          <ImageOrderManager
            images={value.images}
            labels={{
              down: labels.moveDown!,
              image: labels.image!,
              remove: labels.removeImage!,
              up: labels.moveUp!,
            }}
          />
        </div>
      ) : null}
      <label className="form-field form-field-wide">
        <span>{labels.title}</span>
        <input
          defaultValue={value?.title}
          maxLength={120}
          name="title"
          required
          type="text"
        />
      </label>
      <label className="form-field form-field-wide">
        <span>{labels.description}</span>
        <textarea
          defaultValue={value?.description}
          maxLength={2000}
          name="description"
          rows={7}
        />
      </label>
      <label className="form-field">
        <span>{labels.price}</span>
        <div className="price-input">
          <input
            defaultValue={value?.priceAmount ?? ""}
            inputMode="decimal"
            name="priceAmount"
            placeholder="0.00"
            type="text"
          />
          <span>MAD</span>
        </div>
        <small>{labels.priceHint}</small>
      </label>
      <label className="form-field">
        <span>{labels.category}</span>
        <select defaultValue={value?.categoryId} name="categoryId" required>
          <option value="">{labels.chooseCategory}</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
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
        <legend>{labels.fulfillment}</legend>
        <label className="check-field">
          <input
            defaultChecked={value?.pickupAvailable}
            name="pickupAvailable"
            type="checkbox"
          />
          <span>{labels.pickup}</span>
        </label>
        <label className="check-field">
          <input
            defaultChecked={value?.deliveryAvailable}
            name="deliveryAvailable"
            type="checkbox"
          />
          <span>{labels.delivery}</span>
        </label>
        <small>{labels.fulfillmentHint}</small>
      </fieldset>
      <div className="form-actions form-field-wide">
        <button
          className="secondary-button"
          disabled={pending}
          name="intent"
          type="submit"
          value="draft"
        >
          {pending ? labels.saving : labels.saveDraft}
        </button>
        {canPublish ? (
          <button
            className="primary-button"
            disabled={pending}
            name="intent"
            type="submit"
            value="publish"
          >
            {pending ? labels.saving : labels.publish}
          </button>
        ) : null}
      </div>
    </form>
  );
}
