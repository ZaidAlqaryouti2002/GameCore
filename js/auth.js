// auth.js: session helpers only. Login/register forms and API calls come later.
// Load this file before layout.js.
const SESSION_KEY = "gamecore_user";
const authScript = document.currentScript;
const AUTH_PROJECT_URL = new URL("../", authScript.src);

// Read the user saved for this browser tab.
function getCurrentUser() {
  try {
    const user = JSON.parse(sessionStorage.getItem(SESSION_KEY));

    if (!user || (typeof user.id !== "string" && typeof user.id !== "number")) {
      return null;
    }

    if (String(user.id).trim() === "" || typeof user.name !== "string" || user.name.trim() === "") {
      return null;
    }

    if (user.role !== "customer" && user.role !== "admin") {
      return null;
    }

    return user;
  } catch (error) {
    return null;
  }
}

function getUserId() {
  const user = getCurrentUser();

  if (!user) {
    return null;
  }

  return user.id;
}

// Call this after a successful login response in a later stage.
// Never save a password here.
function startSession(user) {
  if (!user || (typeof user.id !== "string" && typeof user.id !== "number")) {
    return false;
  }

  if (String(user.id).trim() === "" || typeof user.name !== "string" || user.name.trim() === "") {
    return false;
  }

  const sessionUser = {
    id: user.id,
    name: user.name.trim(),
    role: user.role === "admin" ? "admin" : "customer"
  };

  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
    return true;
  } catch (error) {
    return false;
  }
}

// The storefront stays public to visitors. Call this only on user-only pages.
function requireLogin() {
  const user = getCurrentUser();

  if (!user) {
    window.location.replace(new URL("pages/login.html", AUTH_PROJECT_URL).href);
    return null;
  }

  return user;
}

// Frontend navigation guard only. Real admin access must also be checked by the future server.
function requireAdmin() {
  const user = requireLogin();

  if (!user) {
    return null;
  }

  if (user.role !== "admin") {
    window.location.replace(new URL("index.html", AUTH_PROJECT_URL).href);
    return null;
  }

  return user;
}

function logout() {
  sessionStorage.removeItem(SESSION_KEY);
  window.location.replace(new URL("index.html", AUTH_PROJECT_URL).href);
}
