import createMiddleware from "next-intl/middleware"

export default createMiddleware({
  // A list of all locales that are supported
  locales: ["fa"],

  // Used when no locale matches
  defaultLocale: "fa",

  // Never redirect to locale prefix for default locale
  localePrefix: "never",
})

export const config = {
  // Match only internationalized pathnames
  matcher: ["/", "/((?!api|_next|_vercel|.*\\..*).*)"],
}
