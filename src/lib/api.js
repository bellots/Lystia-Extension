import { LYSTIA_WEB_ORIGIN } from "../config.js";
import { storageGet, storageRemove, storageSet } from "./web-extension.js";

const SESSION_KEY = "lystia.session";

export class ApiError extends Error {
  constructor(status, code) {
    super(code);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

async function parseResponse(response) {
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(response.status, body?.error ?? `request_failed_${response.status}`);
  }
  return body;
}

export function readSession() {
  return storageGet(SESSION_KEY);
}

export async function writeSession(session) {
  if (session) {
    await storageSet({ [SESSION_KEY]: session });
  } else {
    await storageRemove(SESSION_KEY);
  }
}

function extensionSessionPayload() {
  return {
    operatingSystem: navigator.platform || "Browser Extension",
    appVersion: "0.1.0",
    appBuild: "1",
    deviceModel: `${navigator.userAgent.slice(0, 150)} LystiaExtension`,
  };
}

async function request(path, options = {}, retry = true) {
  let session = await readSession();
  const headers = new Headers(options.headers);
  if (options.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (session?.token) headers.set("Authorization", `Bearer ${session.token}`);

  let response;
  try {
    response = await fetch(`${LYSTIA_WEB_ORIGIN}/api/backend${path}`, {
      ...options,
      headers,
      credentials: "omit",
      cache: "no-store",
    });
  } catch {
    throw new ApiError(503, "network_unavailable");
  }

  if (response.status === 401 && retry && session?.refreshToken) {
    try {
      const refreshedResponse = await fetch(
        `${LYSTIA_WEB_ORIGIN}/api/backend/api/refresh-tokens/refresh`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "omit",
          cache: "no-store",
          body: JSON.stringify({
            refreshToken: session.refreshToken,
            userID: session.user.id,
            userSessionID: session.userSession.id,
          }),
        },
      );
      session = await parseResponse(refreshedResponse);
      await writeSession(session);
      headers.set("Authorization", `Bearer ${session.token}`);
      response = await fetch(`${LYSTIA_WEB_ORIGIN}/api/backend${path}`, {
        ...options,
        headers,
        credentials: "omit",
        cache: "no-store",
      });
    } catch (error) {
      await writeSession(null);
      throw error;
    }
  }

  return parseResponse(response);
}

export const api = {
  async login(email, password) {
    const session = await request(
      "/api/users/login",
      {
        method: "POST",
        body: JSON.stringify({
          email,
          password,
          sourceContent: "mobile",
          userSession: extensionSessionPayload(),
        }),
      },
      false,
    );
    await writeSession(session);
    return session;
  },

  async logout() {
    try {
      await request("/api/users/logout", {}, false);
    } finally {
      await writeSession(null);
    }
  },

  listWishlists() {
    return request("/api/wishlists/editable");
  },

  previewProduct(url) {
    return request("/api/product-previews", {
      method: "POST",
      body: JSON.stringify({ url }),
    });
  },

  createWishItem(wishlistID, input) {
    return request(`/api/wishlists/${encodeURIComponent(wishlistID)}/items`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
};
