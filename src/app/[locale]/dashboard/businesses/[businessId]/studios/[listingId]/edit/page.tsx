import { ArrowLeft, CircleAlert } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { ListingForm } from "@/components/dashboard/listing-form";
import { getListingFormLabels } from "@/components/dashboard/listing-form-labels";
import { MediaManager } from "@/components/dashboard/media-manager";
import { ReviewSubmit } from "@/components/dashboard/review-submit";
import { Link } from "@/i18n/navigation";
import { requireBusinessPermission } from "@/modules/businesses/guards";
import { listPublicCategories } from "@/modules/categories/server";
import { listCategoryFormFeatures } from "@/modules/features/server";
import {
  submitListingForReviewAction,
  updateListingDraftAction,
} from "@/modules/listings/management-actions";
import { SupabaseListingManagementRepository } from "@/modules/listings/management-repository";
import { ListingManagementService } from "@/modules/listings/management-service";
import {
  deleteListingImageAction,
  moveListingImageAction,
  setListingCoverAction,
  prepareListingImageUploadAction,
  completeListingImageUploadAction,
  reorderListingImagesAction,
} from "@/modules/media/actions";
import { SupabaseMediaUrlRepository } from "@/modules/media/repository";
import { ListingMediaService } from "@/modules/media/service";

export const dynamic = "force-dynamic";

export default async function EditStudioPage({
  params,
  searchParams,
}: {
  params: Promise<{
    locale: "tr" | "en";
    businessId: string;
    listingId: string;
  }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { locale, businessId, listingId } = await params;
  setRequestLocale(locale);
  const { client } = await requireBusinessPermission(
    locale,
    businessId,
    "listings.update",
  );
  const service = new ListingManagementService(
    new SupabaseListingManagementRepository(client),
  );
  const listing = await service.getForBusiness(businessId, listingId);
  if (!listing) notFound();

  const t = await getTranslations("ListingForm");
  const mediaT = await getTranslations("MediaManager");
  const reviewT = await getTranslations("ReviewSubmit");
  const category = (await listPublicCategories(locale)).find(
    (item) => item.id === listing.categoryId,
  );
  if (!category) notFound();
  const saved = (await searchParams).saved === "1";
  const editable = listing.status === "draft" || listing.status === "rejected";
  const images = await new ListingMediaService(
    new SupabaseMediaUrlRepository(client),
  ).list(listing.id);

  return (
    <main className="container max-w-5xl py-10 sm:py-16">
      <Link
        href={`/dashboard/businesses/${businessId}`}
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {t("back")}
      </Link>
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <h1 className="text-4xl font-semibold tracking-tight">
          {t("editTitle")}
        </h1>
        <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold">
          {t(`status.${listing.status}`)}
        </span>
      </div>
      <p className="mt-3 text-muted-foreground">{t("editSubtitle")}</p>
      {saved ? (
        <p
          role="status"
          className="mt-6 rounded-xl bg-primary/10 px-4 py-3 text-sm font-medium text-primary"
        >
          {t("saved")}
        </p>
      ) : null}
      {listing.rejectionReason ? (
        <p className="mt-6 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <strong>{t("rejectionReason")}</strong> {listing.rejectionReason}
        </p>
      ) : null}

      <div className="mt-8">
        {editable ? (
          <div className="space-y-8">
            <ListingForm
              action={updateListingDraftAction.bind(
                null,
                locale,
                businessId,
                listingId,
                listing.categoryId,
              )}
              listing={listing}
              categoryId={category.id}
              categoryName={category.name}
              features={await listCategoryFormFeatures(category.id, locale)}
              featureValues={await service.getFeatureValues(listing.id)}
              labels={await getListingFormLabels()}
            />
            <MediaManager
              images={images}
              reorder={reorderListingImagesAction.bind(
                null,
                locale,
                businessId,
                listingId,
              )}
              directUpload={{
                prepare: prepareListingImageUploadAction.bind(
                  null,
                  locale,
                  businessId,
                  listingId,
                ),
                complete: completeListingImageUploadAction.bind(
                  null,
                  locale,
                  businessId,
                  listingId,
                ),
              }}
              actions={images.map((image) => ({
                up: moveListingImageAction.bind(
                  null,
                  locale,
                  businessId,
                  listingId,
                  image.id,
                  "up",
                ),
                down: moveListingImageAction.bind(
                  null,
                  locale,
                  businessId,
                  listingId,
                  image.id,
                  "down",
                ),
                cover: setListingCoverAction.bind(
                  null,
                  locale,
                  businessId,
                  listingId,
                  image.id,
                ),
                remove: deleteListingImageAction.bind(
                  null,
                  locale,
                  businessId,
                  listingId,
                  image.id,
                ),
              }))}
              labels={{
                title: mediaT("title"),
                subtitle: mediaT("subtitle"),
                image: mediaT("image"),
                altText: mediaT("altText"),
                altPlaceholder: mediaT("altPlaceholder"),
                upload: mediaT("upload"),
                uploading: mediaT("uploading"),
                count: mediaT("count"),
                arrangeHint: mediaT("arrangeHint"),
                savingOrder: mediaT("savingOrder"),
                cover: mediaT("cover"),
                makeCover: mediaT("makeCover"),
                moveUp: mediaT("moveUp"),
                moveDown: mediaT("moveDown"),
                delete: mediaT("delete"),
                empty: mediaT("empty"),
                noAlt: mediaT("noAlt"),
                fallbackAlt: listing.name,
                validation_error: mediaT("validationError"),
                image_type_invalid: mediaT("typeInvalid"),
                image_size_invalid: mediaT("sizeInvalid"),
                image_signature_invalid: mediaT("signatureInvalid"),
                image_limit: mediaT("limit"),
                invalid_image_order: mediaT("orderInvalid"),
                image_not_found: mediaT("notFound"),
                listing_not_editable: mediaT("notEditable"),
                forbidden: mediaT("forbidden"),
                unexpected_error: mediaT("unexpectedError"),
              }}
            />
            <ReviewSubmit
              action={submitListingForReviewAction.bind(
                null,
                locale,
                businessId,
                listingId,
              )}
              labels={{
                title: reviewT("title"),
                subtitle: reviewT("subtitle"),
                submit: reviewT("submit"),
                submitting: reviewT("submitting"),
                review_incomplete: reviewT("incomplete"),
                listing_not_editable: reviewT("notEditable"),
                forbidden: reviewT("forbidden"),
                unexpected_error: reviewT("unexpectedError"),
                missing_description: reviewT("missing.description"),
                missing_area: reviewT("missing.area"),
                missing_capacity: reviewT("missing.capacity"),
                missing_price: reviewT("missing.price"),
                missing_images: reviewT("missing.images"),
                missing_cover: reviewT("missing.cover"),
                missing_required_features: reviewT("missing.requiredFeatures"),
              }}
            />
          </div>
        ) : (
          <div className="flex gap-3 rounded-2xl border bg-card p-5 text-sm text-muted-foreground">
            <CircleAlert className="mt-0.5 size-5 shrink-0" />
            <p>{t("notEditable")}</p>
          </div>
        )}
      </div>
    </main>
  );
}
