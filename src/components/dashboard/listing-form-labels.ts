import "server-only";

import { getTranslations } from "next-intl/server";

export async function getListingFormLabels() {
  const t = await getTranslations("ListingForm");
  return {
    basics: t("basics"),
    location: t("location"),
    details: t("details"),
    features: t("features"),
    category: t("category"),
    name: t("name"),
    slug: t("slug"),
    slugHint: t("slugHint"),
    description: t("description"),
    addressLine: t("addressLine"),
    district: t("district"),
    city: t("city"),
    latitude: t("latitude"),
    longitude: t("longitude"),
    area: t("area"),
    capacity: t("capacity"),
    price: t("price"),
    currency: t("currency"),
    any: t("any"),
    yes: t("yes"),
    no: t("no"),
    requiredForReview: t("requiredForReview"),
    save: t("save"),
    saving: t("saving"),
    validationError: t("validationError"),
    slugTaken: t("slugTaken"),
    forbidden: t("forbidden"),
    notEditable: t("notEditable"),
    categoryUnavailable: t("categoryUnavailable"),
    unexpectedError: t("unexpectedError"),
  };
}
