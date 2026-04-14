import { checkBotId } from "botid/server";
import { authServer } from "@/lib/auth-server";

const botProtectedPostPaths = new Set([
  "/api/auth/sign-in/email",
  "/api/auth/sign-up/email",
  "/api/auth/request-password-reset",
]);

const forwardedIpHeaderNames = [
  "x-forwarded-for",
  "x-real-ip",
  "cf-connecting-ip",
] as const;

function isLocalRequest(url: URL) {
  return (
    url.hostname === "localhost" ||
    url.hostname === "127.0.0.1" ||
    url.hostname === "::1" ||
    url.hostname.endsWith(".local")
  );
}

function withLocalForwardedIp(request: Request) {
  const requestUrl = new URL(request.url);

  if (!isLocalRequest(requestUrl)) {
    return request;
  }

  const hasClientIpHeader = forwardedIpHeaderNames.some((headerName) =>
    Boolean(request.headers.get(headerName)),
  );

  if (hasClientIpHeader) {
    return request;
  }

  const headers = new Headers(request.headers);
  headers.set("x-forwarded-for", "127.0.0.1");

  return new Request(request, { headers });
}

export const GET = authServer.handler.GET;

export async function POST(request: Request) {
  const requestUrl = new URL(request.url);

  if (botProtectedPostPaths.has(requestUrl.pathname)) {
    const verification = await checkBotId();

    if (verification.isBot) {
      return Response.json({ error: "Access denied" }, { status: 403 });
    }
  }

  return authServer.handler.POST(withLocalForwardedIp(request));
}
