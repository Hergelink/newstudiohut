"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useRouter } from "@/i18n/navigation";
import {
  googleSignInAction,
  signInAction,
  signUpAction,
} from "@/modules/auth/actions";
import {
  signInSchema,
  signUpSchema,
  type SignInInput,
  type SignUpInput,
} from "@/modules/auth/schemas";

type Props = { mode: "login" | "signup"; nextPath?: string };

export function AuthForm({ mode, nextPath = "/dashboard" }: Props) {
  const t = useTranslations("Auth");
  const locale = useLocale() as "tr" | "en";
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const isSignup = mode === "signup";
  const schema = isSignup ? signUpSchema : signInSchema;
  const form = useForm<SignInInput | SignUpInput>({
    resolver: zodResolver(schema),
    defaultValues: isSignup
      ? { fullName: "", email: "", password: "", locale }
      : { email: "", password: "" },
  });

  const clearResultMessage = () => setResultMessage(null);

  const onSubmit = (values: SignInInput | SignUpInput) => {
    setResultMessage(null);
    startTransition(async () => {
      const result = isSignup
        ? await signUpAction({ ...values, locale }, nextPath)
        : await signInAction(values);
      if (!result.ok) {
        setResultMessage(t("genericError"));
        return;
      }
      if (result.message === "check_email") {
        setResultMessage(t("checkEmail"));
      } else {
        router.push(nextPath);
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-5">
      <form
        onSubmit={form.handleSubmit(onSubmit, clearResultMessage)}
        className="space-y-4"
        noValidate
      >
        {isSignup ? (
          <div className="space-y-2">
            <Label htmlFor="fullName">{t("fullName")}</Label>
            <Input
              id="fullName"
              autoComplete="name"
              {...form.register("fullName" as const)}
            />
            {"fullName" in form.formState.errors &&
            form.formState.errors.fullName ? (
              <p className="text-sm text-destructive">{t("fullNameInvalid")}</p>
            ) : null}
          </div>
        ) : null}
        <div className="space-y-2">
          <Label htmlFor="email">{t("email")}</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            {...form.register("email")}
          />
          {form.formState.errors.email ? (
            <p className="text-sm text-destructive">{t("emailInvalid")}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">{t("password")}</Label>
            {!isSignup ? (
              <Link
                href="/forgot-password"
                className="text-xs font-semibold text-primary hover:underline"
              >
                {t("forgotPassword")}
              </Link>
            ) : null}
          </div>
          <Input
            id="password"
            type="password"
            autoComplete={isSignup ? "new-password" : "current-password"}
            {...form.register("password")}
          />
          {form.formState.errors.password ? (
            <p className="text-sm text-destructive">
              {t(isSignup ? "passwordRequirements" : "passwordRequired")}
            </p>
          ) : null}
        </div>
        {resultMessage ? (
          <p className="rounded-xl bg-secondary p-3 text-sm" role="status">
            {resultMessage}
          </p>
        ) : null}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : null}
          {isSignup ? t("signup") : t("login")}
        </Button>
      </form>
      <form action={googleSignInAction.bind(null, locale, nextPath)}>
        <Button type="submit" variant="outline" className="w-full">
          {t("google")}
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        {isSignup ? t("hasAccount") : t("noAccount")}{" "}
        <Link
          href={`${isSignup ? "/login" : "/sign-up"}?next=${encodeURIComponent(nextPath)}`}
          className="font-semibold text-primary hover:underline"
        >
          {isSignup ? t("login") : t("signup")}
        </Link>
      </p>
    </div>
  );
}
