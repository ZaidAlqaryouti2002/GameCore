// layout.js loads the shared topbar and footer, like EduFlow.
// Read the script URL now, before the asynchronous fetch calls.
const layoutScript = document.currentScript;
const PROJECT_URL = new URL("../", layoutScript.src);
const TOPBAR_URL = new URL("components/topbar.html", PROJECT_URL);
const FOOTER_URL = new URL("components/footer.html", PROJECT_URL);

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

// Only display a saved cart count for now. The cart itself comes later.
// Future cart format: [{ id: 1, quantity: 2 }].
function updateCartCount() {
  const badge = document.getElementById("cart-count");
  const cartLink = document.getElementById("cart-link");

  if (!badge || !cartLink) {
    return;
  }

  let count = 0;

  try {
    const cart = JSON.parse(localStorage.getItem("gamecore_cart")) || [];

    if (Array.isArray(cart)) {
      cart.forEach(function (item) {
        if (item && Number.isInteger(item.quantity) && item.quantity > 0) {
          count += item.quantity;
        }
      });
    }
  } catch (error) {
    // A missing or invalid cart should not stop the shared layout.
    count = 0;
  }

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
  const message = document.getElementById("header-message");

  if (!searchForm || !message) {
    return;
  }

  searchForm.addEventListener("submit", function (event) {
    event.preventDefault();
    message.textContent = "Product search will be added when the catalog is ready.";
    message.hidden = false;
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
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", loadLayout);
} else {
  loadLayout();
}
