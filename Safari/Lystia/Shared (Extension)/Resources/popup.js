import { LYSTIA_WEB_ORIGIN } from "./config.js";
import { ApiError, api, readSession } from "./lib/api.js";
import {
  displayHost,
  fieldsFromPreview,
  friendlyError,
  parsePrice,
  usablePageUrl,
} from "./lib/format.js";
import { activeTab, openTab, storageGet, storageSet } from "./lib/web-extension.js";

const LAST_WISHLIST_KEY = "lystia.lastWishlistID";
const elements = Object.fromEntries(
  [
    "loading-view",
    "login-view",
    "unsupported-view",
    "empty-view",
    "editor-view",
    "success-view",
    "logout-button",
    "login-form",
    "login-button",
    "login-error",
    "email",
    "password",
    "forgot-password",
    "register",
    "create-wishlist",
    "page-favicon",
    "page-host",
    "page-title",
    "import-status",
    "import-warning",
    "wish-form",
    "wishlist",
    "title",
    "price",
    "currency",
    "store-name",
    "description",
    "image-panel",
    "image-options",
    "save-error",
    "save-button",
    "success-message",
    "close-button",
  ].map((id) => [id, document.getElementById(id)]),
);

let currentPageUrl = "";
let selectedImageURL = "";
let wishlists = [];

function showView(view) {
  for (const id of ["loading-view", "login-view", "unsupported-view", "empty-view", "editor-view", "success-view"]) {
    elements[id].classList.toggle("hidden", id !== view);
  }
}

function setBusy(button, busy, busyLabel, normalLabel) {
  button.disabled = busy;
  button.textContent = busy ? busyLabel : normalLabel;
}

function showError(element, error) {
  const status = error instanceof ApiError ? error.status : 0;
  const code = error instanceof ApiError ? error.code : "unknown_error";
  element.textContent = friendlyError(code, status);
  element.classList.remove("hidden");
}

function clearError(element) {
  element.textContent = "";
  element.classList.add("hidden");
}

function fillFields(fields) {
  elements.title.value = fields.title;
  elements.description.value = fields.description;
  elements.price.value = fields.price;
  elements.currency.value = fields.currency;
  elements["store-name"].value = fields.storeName;
  selectedImageURL = fields.imageURL;
}

function renderImages(preview) {
  const candidates = [...new Set([...(preview.images ?? []), preview.imageURL].filter(Boolean))].slice(0, 8);
  elements["image-options"].replaceChildren();
  elements["image-panel"].classList.toggle("hidden", candidates.length === 0);

  for (const imageURL of candidates) {
    const button = document.createElement("button");
    const image = document.createElement("img");
    button.type = "button";
    button.className = `image-option${imageURL === selectedImageURL ? " selected" : ""}`;
    button.dataset.imageUrl = imageURL;
    button.setAttribute("aria-label", "Usa questa immagine");
    image.src = imageURL;
    image.alt = "";
    image.loading = "lazy";
    image.addEventListener("error", () => button.remove());
    button.append(image);
    button.addEventListener("click", () => {
      selectedImageURL = imageURL;
      for (const option of elements["image-options"].children) {
        option.classList.toggle("selected", option === button);
      }
    });
    elements["image-options"].append(button);
  }
}

async function importCurrentProduct() {
  elements["import-status"].classList.remove("hidden");
  elements["import-warning"].classList.add("hidden");
  try {
    const preview = await api.previewProduct(currentPageUrl);
    fillFields(fieldsFromPreview(preview, currentPageUrl));
    renderImages(preview);
    if (preview.warnings?.length) {
      elements["import-warning"].textContent = "Controlla i dati importati prima di salvare: prezzo e disponibilità possono cambiare.";
      elements["import-warning"].classList.remove("hidden");
    }
  } catch (error) {
    fillFields(fieldsFromPreview({}, currentPageUrl));
    elements["import-warning"].textContent = friendlyError(
      error instanceof ApiError ? error.code : "unknown_error",
      error instanceof ApiError ? error.status : 0,
    );
    elements["import-warning"].classList.remove("hidden");
  } finally {
    elements["import-status"].classList.add("hidden");
  }
}

async function loadEditor() {
  const tab = await activeTab();
  currentPageUrl = usablePageUrl(tab?.url) ?? "";
  if (!currentPageUrl) {
    showView("unsupported-view");
    return;
  }

  elements["page-host"].textContent = displayHost(currentPageUrl);
  elements["page-title"].textContent = tab?.title || "Pagina prodotto";
  if (tab?.favIconUrl) {
    elements["page-favicon"].src = tab.favIconUrl;
    elements["page-favicon"].classList.remove("hidden");
  } else {
    elements["page-favicon"].classList.add("hidden");
  }

  try {
    wishlists = (await api.listWishlists()).filter((wishlist) => !wishlist.isExpired);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      elements["logout-button"].classList.add("hidden");
      showView("login-view");
      return;
    }
    showView("editor-view");
    elements["import-status"].classList.add("hidden");
    showError(elements["save-error"], error);
    elements["wish-form"].classList.add("hidden");
    return;
  }

  if (wishlists.length === 0) {
    showView("empty-view");
    return;
  }

  const lastWishlistID = await storageGet(LAST_WISHLIST_KEY);
  elements.wishlist.replaceChildren();
  for (const wishlist of wishlists) {
    const option = document.createElement("option");
    option.value = wishlist.id;
    option.textContent = wishlist.title;
    option.selected = wishlist.id === lastWishlistID;
    elements.wishlist.append(option);
  }

  fillFields(fieldsFromPreview({}, currentPageUrl));
  showView("editor-view");
  await importCurrentProduct();
}

async function initialize() {
  showView("loading-view");
  const session = await readSession();
  if (!session) {
    showView("login-view");
    return;
  }
  elements["logout-button"].classList.remove("hidden");
  await loadEditor();
}

elements["login-form"].addEventListener("submit", async (event) => {
  event.preventDefault();
  clearError(elements["login-error"]);
  setBusy(elements["login-button"], true, "Accesso…", "Accedi");
  try {
    await api.login(elements.email.value.trim(), elements.password.value);
    elements.password.value = "";
    elements["logout-button"].classList.remove("hidden");
    await loadEditor();
  } catch (error) {
    showError(elements["login-error"], error);
  } finally {
    setBusy(elements["login-button"], false, "Accesso…", "Accedi");
  }
});

elements["wish-form"].addEventListener("submit", async (event) => {
  event.preventDefault();
  clearError(elements["save-error"]);
  const price = parsePrice(elements.price.value);
  if (price === null) {
    elements["save-error"].textContent = "Inserisci un prezzo valido, maggiore o uguale a zero.";
    elements["save-error"].classList.remove("hidden");
    elements.price.focus();
    return;
  }

  const wishlistID = elements.wishlist.value;
  setBusy(elements["save-button"], true, "Aggiungo…", "Aggiungi alla wishlist");
  try {
    await api.createWishItem(wishlistID, {
      title: elements.title.value.trim(),
      description: elements.description.value.trim() || undefined,
      price,
      currency: price === undefined ? undefined : elements.currency.value,
      imageURL: selectedImageURL || undefined,
      referenceLink: currentPageUrl,
      storeName: elements["store-name"].value.trim() || undefined,
    });
    await storageSet({ [LAST_WISHLIST_KEY]: wishlistID });
    const wishlist = wishlists.find((candidate) => candidate.id === wishlistID);
    elements["success-message"].textContent = `Salvato in “${wishlist?.title ?? "Lystia"}”.`;
    showView("success-view");
  } catch (error) {
    showError(elements["save-error"], error);
  } finally {
    setBusy(elements["save-button"], false, "Aggiungo…", "Aggiungi alla wishlist");
  }
});

elements["logout-button"].addEventListener("click", async () => {
  await api.logout().catch(() => undefined);
  elements["logout-button"].classList.add("hidden");
  showView("login-view");
});

elements["forgot-password"].addEventListener("click", () => openTab(`${LYSTIA_WEB_ORIGIN}/forgot-password`));
elements.register.addEventListener("click", () => openTab(`${LYSTIA_WEB_ORIGIN}/register`));
elements["create-wishlist"].addEventListener("click", () => openTab(`${LYSTIA_WEB_ORIGIN}/wishlists/new`));
elements["close-button"].addEventListener("click", () => window.close());

void initialize();
