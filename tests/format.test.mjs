import test from "node:test";
import assert from "node:assert/strict";
import {
  displayHost,
  fieldsFromPreview,
  friendlyError,
  parsePrice,
  usablePageUrl,
} from "../src/lib/format.js";

test("accepts only HTTP product URLs", () => {
  assert.equal(usablePageUrl("https://shop.example/product#blue"), "https://shop.example/product#blue");
  assert.equal(usablePageUrl("chrome://extensions"), null);
  assert.equal(usablePageUrl("not a URL"), null);
});

test("formats host names", () => {
  assert.equal(displayHost("https://www.example.com/products/1"), "example.com");
});

test("parses Italian and international prices", () => {
  assert.equal(parsePrice("12,50"), 12.5);
  assert.equal(parsePrice("0"), 0);
  assert.equal(parsePrice(""), undefined);
  assert.equal(parsePrice("-3"), null);
  assert.equal(parsePrice("ciao"), null);
});

test("maps a product preview to editable fields", () => {
  assert.deepEqual(
    fieldsFromPreview(
      {
        title: "Tazza",
        price: 12.5,
        currency: "EUR",
        images: ["https://example.com/cup.jpg"],
        canonicalURL: "https://example.com/cup",
      },
      "https://example.com/original",
    ),
    {
      title: "Tazza",
      description: "",
      price: "12.50",
      currency: "EUR",
      imageURL: "https://example.com/cup.jpg",
      referenceLink: "https://example.com/cup",
      storeName: "",
    },
  );
});

test("provides stable Italian error messages", () => {
  assert.match(friendlyError("error_wrong_email_or_password", 401), /Email o password/);
  assert.match(friendlyError("unknown", 503), /raggiungibile/);
});
