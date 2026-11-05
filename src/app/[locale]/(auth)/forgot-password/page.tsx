import { getTranslations, setRequestLocale } from "next-intl/server";

import { AuthCard } from "@/components/auth/auth-card";
import { PasswordForm } from "@/components/auth/password-form";

export default async function ForgotPasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Auth");
  return (
    <AuthCard title={t("forgotPasswordTitle")} subtitle={t("forgotPasswordSubtitle")}>
      <PasswordForm mode="request" />
    </AuthCard>
  );
}
