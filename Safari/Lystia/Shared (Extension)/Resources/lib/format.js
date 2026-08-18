export function usablePageUrl(rawUrl) {
  if (!rawUrl) return null;
  try {
    const url = new URL(rawUrl);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.href;
  } catch {
    return null;
  }
}

export function displayHost(rawUrl) {
  try {
    return new URL(rawUrl).hostname.replace(/^www\./, "");
  } catch {
    return "Pagina corrente";
  }
}

export function parsePrice(rawValue) {
  const normalized = String(rawValue ?? "").trim().replace(",", ".");
  if (!normalized) return undefined;
  const value = Number(normalized);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

export function fieldsFromPreview(preview, pageUrl) {
  return {
    title: preview.title ?? "",
    description: preview.description ?? "",
    price: preview.price === undefined ? "" : preview.price.toFixed(2),
    currency: preview.currency ?? "EUR",
    imageURL: preview.imageURL ?? preview.images?.[0] ?? "",
    referenceLink: preview.canonicalURL ?? pageUrl,
    storeName: preview.storeName ?? "",
  };
}

const ERROR_MESSAGES = {
  error_wrong_email_or_password: "Email o password non corretti.",
  error_missing_user_in_cache: "La sessione è scaduta. Accedi di nuovo.",
  error_refresh_token_not_valid: "La sessione è scaduta. Accedi di nuovo.",
  error_wishlist_expired: "Questa wishlist è scaduta.",
  error_not_your_wishlist: "Puoi aggiungere desideri solo alle tue wishlist.",
  error_product_preview_rate_limited: "Hai importato molti prodotti. Riprova tra poco.",
  error_product_preview_amazon_blocked: "Amazon ha bloccato l’importazione automatica. Puoi compilare i dati manualmente.",
  error_product_preview_fetch_failed: "Non sono riuscito a leggere questa pagina. Puoi compilare i dati manualmente.",
  error_product_preview_shop_rejected_request: "Il negozio non permette l’importazione automatica. Puoi compilare i dati manualmente.",
  error_product_preview_empty_page: "La pagina non contiene dati prodotto leggibili.",
  error_product_preview_url_not_allowed: "Questo indirizzo non può essere importato.",
};

export function friendlyError(code, status) {
  if (ERROR_MESSAGES[code]) return ERROR_MESSAGES[code];
  if (status === 401) return "La sessione è scaduta. Accedi di nuovo.";
  if (status === 503) return "Lystia non è raggiungibile in questo momento.";
  return "Qualcosa non ha funzionato. Riprova.";
}
