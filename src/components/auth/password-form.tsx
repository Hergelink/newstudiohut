"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "@/i18n/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { forgotPasswordAction, resetPasswordAction } from "@/modules/auth/actions";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  type ForgotPasswordInput,
  type ResetPasswordInput,
} from "@/modules/auth/schemas";

export function PasswordForm({ mode }: { mode: "request" | "reset" }) {
  const t = useTranslations("Auth");
  const locale = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const isReset = mode === "reset";
  const [recoveryState, setRecoveryState] = useState<"checking" | "ready" | "error">(
    isReset ? "checking" : "ready",
  );
  const form = useForm<ForgotPasswordInput | ResetPasswordInput>({
    resolver: zodResolver(isReset ? resetPasswordSchema : forgotPasswordSchema),
    defaultValues: isReset ? { password: "" } : { email: "" },
  });

  useEffect(() => {
    if (!isReset) return;

    const prepareRecoverySession = async () => {
      const supabase = createSupabaseBrowserClient();
      const hash = new URLSearchParams(window.location.hash.slice(1));
      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        window.history.replaceState(
          null,
          "",
          `${window.location.pathname}${window.location.search}`,
        );
        if (error) return setRecoveryState("error");
      }

      const { data, error } = await supabase.auth.getUser();
      setRecoveryState(!error && data.user ? "ready" : "error");
    };

    void prepareRecoverySession();
  }, [isReset]);

  const submit = (values: ForgotPasswordInput | ResetPasswordInput) => {
    startTransition(async () => {
      const result = isReset
        ? await resetPasswordAction(values)
        : await forgotPasswordAction({ ...values, locale });
      if (!result.ok) {
        return setMessage(
          t(result.message === "rate_limit" ? "emailRateLimit" : "genericError"),
        );
      }
      if (isReset) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setMessage(t("resetEmailSent"));
      }
    });
  };

  return (
    <form
      onSubmit={form.handleSubmit(submit, () => setMessage(null))}
      className="space-y-4"
      noValidate
    >
      {isReset ? (
        <div className="space-y-2">
          <Label htmlFor="password">{t("password")}</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            {...form.register("password" as const)}
          />
          {"password" in form.formState.errors && form.formState.errors.password ? (
            <p className="text-sm text-destructive">{t("passwordRequirements")}</p>
          ) : null}
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="email">{t("email")}</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            {...form.register("email" as const)}
          />
          {"email" in form.formState.errors && form.formState.errors.email ? (
            <p className="text-sm text-destructive">{t("emailInvalid")}</p>
          ) : null}
        </div>
      )}
      {message ? (
        <p className="rounded-xl bg-secondary p-3 text-sm" role="status">
          {message}
        </p>
      ) : null}
      {isReset && recoveryState !== "ready" ? (
        <p
          className="rounded-xl bg-secondary p-3 text-sm"
          role={recoveryState === "error" ? "alert" : "status"}
        >
          {recoveryState === "checking" ? t("recoveryLinkChecking") : t("invalidRecoveryLink")}
        </p>
      ) : null}
      <Button
        type="submit"
        className="w-full"
        disabled={pending || (isReset && recoveryState !== "ready")}
      >
        {pending || (isReset && recoveryState === "checking") ? (
          <Loader2 className="size-4 animate-spin" />
        ) : null}
        {isReset ? t("resetPasswordAction") : t("sendResetLink")}
      </Button>
    </form>
  );
}
