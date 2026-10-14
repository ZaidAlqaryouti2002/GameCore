const accountForm = document.getElementById("account-form");
const formMessage = document.getElementById("form-message");
const submitButton = document.getElementById("submit-button");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const isRegistration = document.body.dataset.page === "register";

document.querySelectorAll(".password-toggle").forEach(function (button) {
  button.addEventListener("click", function () {
    const input = document.getElementById(button.dataset.password);
    const showPassword = input.type === "password";
    input.type = showPassword ? "text" : "password";

    const fieldName = input.id === "confirm-password" ? "confirm password" : "password";
    const label = (showPassword ? "Hide " : "Show ") + fieldName;
    button.setAttribute("aria-label", label);
    button.setAttribute("title", label);
    button.setAttribute("aria-pressed", String(showPassword));
    button.querySelector("i").className = showPassword ? "bi bi-eye-slash" : "bi bi-eye";
  });
});

function showFormError(message, field) {
  formMessage.textContent = message;
  formMessage.hidden = false;

  if (field) {
    field.focus();
  }
}

accountForm.addEventListener("input", function () {
  formMessage.hidden = true;
});

accountForm.addEventListener("submit", async function (event) {
  event.preventDefault();
  formMessage.hidden = true;

  if (!accountForm.reportValidity() || submitButton.disabled) {
    return;
  }

  if (isRegistration) {
    const nameInput = document.getElementById("full-name");
    const confirmation = document.getElementById("confirm-password");

    if (nameInput.value.trim().length < 2) {
      showFormError("Please enter your full name.", nameInput);
      return;
    }

    if (passwordInput.value.length < 8 || !/[0-9]/.test(passwordInput.value)) {
      showFormError("Use at least 8 characters, including a number.", passwordInput);
      return;
    }

    if (passwordInput.value !== confirmation.value) {
      showFormError("The passwords do not match.", confirmation);
      return;
    }
  }

  submitButton.disabled = true;
  submitButton.textContent = isRegistration ? "Creating account..." : "Signing in...";
  accountForm.setAttribute("aria-busy", "true");

  try {
    let user;
    let rememberUser = false;

    if (isRegistration) {
      const name = document.getElementById("full-name").value;
      user = await registerLocalAccount(name, emailInput.value, passwordInput.value);
      window.location.href = new URL("pages/login.html", AUTH_PROJECT_URL).href;
      return;
    } else {
      user = await signInLocalAccount(emailInput.value, passwordInput.value);
      rememberUser = document.getElementById("remember-me").checked;
    }

    if (!startSession(user, rememberUser)) {
      throw new Error("Could not start your session. Please allow browser storage and try again.");
    }

    window.location.href = new URL("index.html", AUTH_PROJECT_URL).href;
  } catch (error) {
    if (error.name === "QuotaExceededError" || error.name === "SecurityError" || error instanceof SyntaxError) {
      showFormError("Account storage is unavailable. Please check your browser settings.");
    } else if (error instanceof TypeError) {
      showFormError("Could not complete your request. Please open the project using Live Server.");
    } else {
      showFormError(error.message);
    }
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = isRegistration ? "Sign Up" : "Sign In";
    accountForm.removeAttribute("aria-busy");
  }
});
