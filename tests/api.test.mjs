import test from "node:test";
import assert from "node:assert/strict";

const stored = {};
globalThis.chrome = {
  storage: {
    local: {
      async get(key) {
        return { [key]: stored[key] };
      },
      async set(values) {
        Object.assign(stored, values);
      },
      async remove(key) {
        delete stored[key];
      },
    },
  },
  tabs: {
    async query() { return []; },
    async create() {},
  },
};

const { api } = await import("../src/lib/api.js");

const oldSession = {
  token: "old-access-token",
  refreshToken: "old-refresh-token",
  user: { id: "user-1", name: "Ada" },
  userSession: { id: "session-1" },
};

const newSession = {
  ...oldSession,
  token: "new-access-token",
  refreshToken: "new-refresh-token",
};

test("login creates a separate extension session", async () => {
  let captured;
  globalThis.fetch = async (url, options) => {
    captured = { url, options };
    return Response.json(oldSession);
  };

  await api.login("ada@example.com", "secret");
  const payload = JSON.parse(captured.options.body);
  assert.equal(captured.url, "__LYSTIA_WEB_ORIGIN__/api/backend/api/users/login");
  assert.equal(payload.email, "ada@example.com");
  assert.equal(payload.sourceContent, "mobile");
  assert.match(payload.userSession.deviceModel, /LystiaExtension/);
  assert.deepEqual(stored["lystia.session"], oldSession);
});

test("an expired access token is refreshed, rotated and retried", async () => {
  stored["lystia.session"] = oldSession;
  let call = 0;
  globalThis.fetch = async (url, options) => {
    call += 1;
    if (call === 1) {
      assert.equal(options.headers.get("Authorization"), "Bearer old-access-token");
      return Response.json({ error: "expired" }, { status: 401 });
    }
    if (call === 2) {
      assert.match(url, /refresh-tokens\/refresh$/);
      assert.deepEqual(JSON.parse(options.body), {
        refreshToken: "old-refresh-token",
        userID: "user-1",
        userSessionID: "session-1",
      });
      return Response.json(newSession);
    }
    assert.match(url, /api\/wishlists\/editable$/);
    assert.equal(options.headers.get("Authorization"), "Bearer new-access-token");
    return Response.json([{ id: "wishlist-1", title: "Regali" }]);
  };

  assert.deepEqual(await api.listWishlists(), [{ id: "wishlist-1", title: "Regali" }]);
  assert.equal(call, 3);
  assert.deepEqual(stored["lystia.session"], newSession);
});

test("product preview and item creation use the existing Lystia endpoints", async () => {
  stored["lystia.session"] = newSession;
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options });
    return Response.json(calls.length === 1 ? { title: "Tazza" } : { id: "wish-1" });
  };

  await api.previewProduct("https://shop.example/cup");
  await api.createWishItem("wishlist-1", { title: "Tazza", price: 12.5 });

  assert.match(calls[0].url, /api\/product-previews$/);
  assert.deepEqual(JSON.parse(calls[0].options.body), { url: "https://shop.example/cup" });
  assert.match(calls[1].url, /api\/wishlists\/wishlist-1\/items$/);
  assert.deepEqual(JSON.parse(calls[1].options.body), { title: "Tazza", price: 12.5 });
});
