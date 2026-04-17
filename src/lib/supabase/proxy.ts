import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const AUTH_PATH = "/connexion";
const ADMIN_ONLY_PATHS = ["/admin", "/utilisateurs", "/parametres"];

function redirectWithCookies(url: URL, response: NextResponse) {
  const redirectResponse = NextResponse.redirect(url);

  response.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });

  return redirectResponse;
}

function isPublicPath(pathname: string) {
  return pathname === AUTH_PATH;
}

function isAdminPath(pathname: string) {
  return ADMIN_ONLY_PATHS.some((segment) => pathname.startsWith(segment));
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  if (!user && !isPublicPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = AUTH_PATH;
    url.searchParams.set("redirectedFrom", pathname);
    return redirectWithCookies(url, response);
  }

  if (!user) {
    return response;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_active, roles(slug)")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    await supabase.auth.signOut();

    const url = request.nextUrl.clone();
    url.pathname = AUTH_PATH;
    url.searchParams.set("error", "profile");
    return redirectWithCookies(url, response);
  }

  const rolesRelation = profile?.roles as { slug?: string } | Array<{ slug?: string }> | null | undefined;
  const role = Array.isArray(rolesRelation) ? rolesRelation[0]?.slug : rolesRelation?.slug;

  if (profile && profile.is_active === false) {
    await supabase.auth.signOut();

    const url = request.nextUrl.clone();
    url.pathname = AUTH_PATH;
    url.searchParams.set("error", "inactive");
    return redirectWithCookies(url, response);
  }

  if (user && pathname === AUTH_PATH) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return redirectWithCookies(url, response);
  }

  if (isAdminPath(pathname) && role !== "admin") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return redirectWithCookies(url, response);
  }

  return response;
}
