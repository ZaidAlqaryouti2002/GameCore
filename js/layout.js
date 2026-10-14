// layout.js loads the shared topbar and footer, like EduFlow.
// Read the script URL now, before the asynchronous fetch calls.
const layoutScript = document.currentScript;
const PROJECT_URL = new URL("../", layoutScript.src);
const TOPBAR_URL = new URL("components/topbar.html", PROJECT_URL);
const FOOTER_URL = new URL("components/footer.html", PROJECT_URL);

// Display product content as text when inserting it into an HTML template.
function escapeHTML(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Load one HTML component.
async function fetchComponent(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Could not load the shared layout.");
  }

  return response.text();
}

// The same component works in index.html, pages/, and pages/admin/.
function setComponentLinks(container) {
  const links = container.querySelectorAll("a[data-path]");

  links.forEach(function (link) {
    link.href = new URL(link.dataset.path, PROJECT_URL).href;
  });
}

function getCurrentPage() {
  return document.body.dataset.page;
}

function setActiveNavigation() {
  const currentPage = getCurrentPage();
  const links = document.querySelectorAll(".main-nav a[data-page]");

  links.forEach(function (link) {
    const isActive = link.dataset.page === currentPage;
    link.classList.toggle("active", isActive);

    if (isActive) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

function initializeMenu() {
  const menuButton = document.getElementById("menu-toggle");
  const mainMenu = document.getElementById("main-menu");

  if (!menuButton || !mainMenu) {
    return;
  }

  function closeMenu() {
    mainMenu.classList.remove("open");
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "Open navigation menu");
  }

  menuButton.addEventListener("click", function () {
    mainMenu.classList.toggle("open");
    const isOpen = mainMenu.classList.contains("open");
    menuButton.setAttribute("aria-expanded", String(isOpen));
    menuButton.setAttribute("aria-label", isOpen ? "Close navigation menu" : "Open navigation menu");
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && mainMenu.classList.contains("open")) {
      closeMenu();
      menuButton.focus();
    }
  });

  mainMenu.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", closeMenu);
  });

  window.addEventListener("resize", function () {
    if (window.innerWidth > 1200) {
      closeMenu();
    }
  });
}

function getStoredCart() {
  try {
    const cart = JSON.parse(localStorage.getItem("gamecore_cart")) || [];

    if (!Array.isArray(cart)) {
      return [];
    }

    const validCart = cart.filter(function (item) {
      return item && item.id !== undefined && item.id !== null &&
        String(item.id).trim() !== "" &&
        Number.isInteger(item.quantity) && item.quantity > 0;
    });

    // Old test entries had no product ID. Remove only those entries.
    if (validCart.length !== cart.length) {
      localStorage.setItem("gamecore_cart", JSON.stringify(validCart));
    }

    return validCart;
  } catch (error) {
    return [];
  }
}

function updateCartCount() {
  const badge = document.getElementById("cart-count");
  const cartLink = document.getElementById("cart-link");

  if (!badge || !cartLink) {
    return;
  }

  let count = 0;
  getStoredCart().forEach(function (item) {
    count += item.quantity;
  });

  badge.textContent = count;
  cartLink.setAttribute("aria-label", "Shopping cart, " + count + (count === 1 ? " item" : " items"));
}

function initializeAccount() {
  const accountLink = document.getElementById("account-link");
  const accountText = document.getElementById("account-text");
  const logoutButton = document.getElementById("logout-button");
  const signupLink = document.getElementById("signup-link");

  if (!accountLink || !accountText || !logoutButton) {
    return;
  }

  // auth.js is loaded before layout.js on the example pages.
  if (typeof getCurrentUser !== "function") {
    return;
  }

  const user = getCurrentUser();
  const adminLink = document.getElementById("admin-link");

  if (adminLink) {
    adminLink.hidden = !user || user.role !== "admin";
  }

  if (user) {
    accountText.textContent = user.name.split(" ")[0];
    accountLink.href = new URL("pages/profile.html", PROJECT_URL).href;
    if (signupLink) {
      signupLink.hidden = true;
    }
    logoutButton.hidden = false;
    logoutButton.addEventListener("click", logout);
  }
}

function initializeSearch() {
  const searchForm = document.getElementById("search-form");
  const searchInput = document.getElementById("site-search");

  if (!searchForm || !searchInput) {
    return;
  }

  const currentSearch = new URLSearchParams(window.location.search).get("q");
  searchInput.value = currentSearch || "";

  searchForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const query = searchInput.value.trim();
    const homeUrl = new URL("index.html", PROJECT_URL);

    if (query) {
      homeUrl.searchParams.set("q", query);
    }

    window.location.href = homeUrl.href;
  });
}

async function loadTopbar() {
  const container = document.getElementById("topbar-container");

  if (!container) {
    return;
  }

  try {
    container.innerHTML = await fetchComponent(TOPBAR_URL);
    setComponentLinks(container);

    // These elements exist only after the component has loaded.
    initializeMenu();
    setActiveNavigation();
    updateCartCount();
    initializeAccount();
    initializeSearch();
  } catch (error) {
    container.textContent = "The header could not load. Please open the project using Live Server.";
    console.error(error);
  }
}

async function loadFooter() {
  const container = document.getElementById("footer-container");

  if (!container) {
    return;
  }

  try {
    container.innerHTML = await fetchComponent(FOOTER_URL);
    setComponentLinks(container);
  } catch (error) {
    container.textContent = "The footer could not load. Please open the project using Live Server.";
    console.error(error);
  }
}

function loadLayout() {
  // Each component is optional and loads independently.
  loadTopbar();
  loadFooter();
  loadAuthBanner();
}

async function loadAuthBanner() {
  const container = document.getElementById("auth-banner-container");

  if (!container) {
    return;
  }

  try {
    const url = new URL("components/auth-banner.html", PROJECT_URL);
    container.innerHTML = await fetchComponent(url);
    setComponentLinks(container);
  } catch (error) {
    container.textContent = "GameCore";
    console.error(error);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", loadLayout);
} else {
  loadLayout();
}
