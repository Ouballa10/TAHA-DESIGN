import "server-only";

import { cookies } from "next/headers";

import {
  defaultTheme,
  isAppTheme,
  themeCookieName,
  type AppTheme,
} from "@/lib/theme/config";

export async function getServerTheme(): Promise<AppTheme> {
  const cookieStore = await cookies();
  const cookieTheme = cookieStore.get(themeCookieName)?.value;

  return isAppTheme(cookieTheme) ? cookieTheme : defaultTheme;
}
