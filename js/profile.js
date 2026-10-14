const profileUser = requireLogin();
const profileForm = document.getElementById("profile-form");
const profileFields = document.getElementById("profile-fields");
const profileMessage = document.getElementById("profile-message");
const profileRetry = document.getElementById("profile-retry");
const nameInput = document.getElementById("profile-name-input");
const emailInput = document.getElementById("profile-email-input");
let savedProfile = null;

function showProfileMessage(text, type) {
  profileMessage.textContent = text;
  profileMessage.className = "profile-message " + (type || "");
  profileMessage.hidden = false;
}

function fillProfile() {
  nameInput.value = savedProfile.name;
  emailInput.value = savedProfile.email;
  document.getElementById("profile-name").textContent = savedProfile.name;
  document.getElementById("profile-email").textContent = savedProfile.email;
  const initials = savedProfile.name.trim().split(/\s+/).slice(0, 2).map(function (word) { return word[0]; }).join("");
  document.getElementById("profile-avatar").textContent = initials.toUpperCase();
}

async function loadProfile() {
  profileFields.disabled = true;
  profileRetry.hidden = true;
  showProfileMessage("Loading your account...");
  try {
    const response = await fetch(USERS_URL + "/" + encodeURIComponent(profileUser.id));
    if (!response.ok) throw new Error("Could not load your account. Please try again.");
    const user = await response.json();
    if (String(user.id) !== String(profileUser.id) || !user.name || !user.email) throw new Error("Your account details are unavailable.");
    savedProfile = { name: String(user.name), email: String(user.email) };
    fillProfile();
    profileFields.disabled = false;
    profileMessage.hidden = true;
  } catch (error) {
    showProfileMessage("Could not load your account. Please try again.", "error");
    profileRetry.hidden = false;
  }
}

profileForm.addEventListener("submit", async function (event) {
  event.preventDefault();
  if (!savedProfile || !profileUser) return;
  const name = nameInput.value.trim();
  const email = emailInput.value.trim().toLowerCase();
  if (name.length < 2) {
    showProfileMessage("Please enter a name with at least 2 characters.", "error");
    nameInput.focus();
    return;
  }
  profileFields.disabled = true;
  showProfileMessage("Saving your changes...");
  try {
    const users = await getUsers();
    const emailTaken = users.some(function (user) {
      return String(user.id) !== String(profileUser.id) && String(user.email || "").trim().toLowerCase() === email;
    });
    if (emailTaken) {
      showProfileMessage("This email is already used by another account.", "error");
      return;
    }
    const response = await fetch(USERS_URL + "/" + encodeURIComponent(profileUser.id), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name, email: email })
    });
    if (!response.ok) throw new Error("Save failed.");
    const updatedUser = await response.json();
    savedProfile = { name: String(updatedUser.name || name), email: String(updatedUser.email || email) };
    const remembered = Boolean(localStorage.getItem(SESSION_KEY));
    const sessionSaved = startSession({ id: profileUser.id, name: savedProfile.name, role: profileUser.role }, remembered);
    fillProfile();
    const accountText = document.getElementById("account-text");
    if (accountText) accountText.textContent = savedProfile.name.split(" ")[0];
    showProfileMessage(sessionSaved ? "Your changes have been saved." : "Your changes were saved. Please sign in again to refresh your session.", "success");
  } catch (error) {
    showProfileMessage("Could not save your changes. Please try again.", "error");
  } finally {
    profileFields.disabled = false;
  }
});

document.getElementById("profile-cancel").addEventListener("click", function () {
  if (savedProfile) fillProfile();
  profileMessage.hidden = true;
});
document.getElementById("profile-logout").addEventListener("click", logout);
profileRetry.addEventListener("click", loadProfile);

if (profileUser) {
  document.getElementById("protected-content").hidden = false;
  document.getElementById("profile-name").textContent = profileUser.name;
  document.getElementById("profile-role").textContent = profileUser.role === "admin" ? "Administrator" : "Customer";
  document.getElementById("profile-admin").hidden = profileUser.role !== "admin";
  document.getElementById("profile-cart-count").textContent = getStoredCart().reduce(function (total, item) { return total + item.quantity; }, 0);
  loadProfile();
}
