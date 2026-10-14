// Account and session helpers. Load before layout.js.
const SESSION_KEY = "gamecore_user";
const authScript = document.currentScript;
const AUTH_PROJECT_URL = new URL("../", authScript.src);

// Use the tab session, or a remembered account from this browser.
function getCurrentUser() {
  try {
    const savedUser = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
    const user = JSON.parse(savedUser);

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

function startSession(user, rememberUser = false) {
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
    if (rememberUser) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
      sessionStorage.removeItem(SESSION_KEY);
    } else {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
      localStorage.removeItem(SESSION_KEY);
    }
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
  localStorage.removeItem(SESSION_KEY);
  window.location.replace(new URL("index.html", AUTH_PROJECT_URL).href);
}

// Prototype only: real authentication must be handled by a backend.
async function hashPassword(password) {
  const data = new TextEncoder().encode(password);
  const result = await crypto.subtle.digest("SHA-256", data);

  return Array.from(new Uint8Array(result)).map(function (byte) {
    return byte.toString(16).padStart(2, "0");
  }).join("");
}

async function registerAccount(name, email, password) {
  const normalizedEmail = email.trim().toLowerCase();
  const existingAccount = await findUserByEmail(normalizedEmail);

  if (existingAccount) {
    throw new Error("An account with this email already exists. Please sign in.");
  }

  const passwordHash = await hashPassword(password);

  return createUser({
    name: name.trim(),
    email: normalizedEmail,
    passwordHash: passwordHash,
    role: "customer"
  });
}

async function signInAccount(email, password) {
  const account = await findUserByEmail(email);

  if (!account || await hashPassword(password) !== account.passwordHash) {
    throw new Error("The email or password is incorrect.");
  }

  return account;
}
