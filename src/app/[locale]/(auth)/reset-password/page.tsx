import { getTranslations, setRequestLocale } from "next-intl/server";

import { AuthCard } from "@/components/auth/auth-card";
import { PasswordForm } from "@/components/auth/password-form";

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Auth");
  return (
    <AuthCard title={t("resetPasswordTitle")} subtitle={t("resetPasswordSubtitle")}>
      <PasswordForm mode="reset" />
    </AuthCard>
  );
}
