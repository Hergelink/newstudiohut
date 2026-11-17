export function safeNextPath(value: string | null | undefined) {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    /[\u0000-\u001F\u007F]/.test(value)
  ) {
    return "/dashboard";
  }
  return value;
}

export function localePath(locale: string, path: string) {
  const safePath = safeNextPath(path);
  const suffixIndex = safePath.search(/[?#]/);
  const pathname =
    suffixIndex === -1 ? safePath : safePath.slice(0, suffixIndex);
  const suffix = suffixIndex === -1 ? "" : safePath.slice(suffixIndex);
  const unlocalized = safeNextPath(
    pathname.replace(/^\/(?:en|tr)(?=\/|$)/, "") || "/",
  );
  const localized =
    locale === "en"
      ? unlocalized === "/"
        ? "/en"
        : `/en${unlocalized}`
      : unlocalized;

  return `${localized}${suffix}`;
}

export function authFailurePath(
  nextPath: string,
  error: "callback" | "confirmation",
) {
  const locale = /^\/en(?:\/|[?#]|$)/.test(safeNextPath(nextPath))
    ? "en"
    : "tr";
  return localePath(locale, `/login?error=${error}`);
}
