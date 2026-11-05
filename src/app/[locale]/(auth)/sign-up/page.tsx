import { getTranslations, setRequestLocale } from "next-intl/server";

import { AuthCard } from "@/components/auth/auth-card";
import { AuthForm } from "@/components/auth/auth-form";
import { safeNextPath } from "@/modules/auth/safe-next";

export default async function SignUpPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Auth");
  return (
    <AuthCard title={t("signupTitle")} subtitle={t("signupSubtitle")}>
      <AuthForm
        mode="signup"
        nextPath={safeNextPath((await searchParams).next)}
      />
    </AuthCard>
  );
}
