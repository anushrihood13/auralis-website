
document.addEventListener("DOMContentLoaded", () => {
  const $ = (id) => document.getElementById(id);

  // Show/hide password buttons
  function setupPasswordToggle(buttonId, inputId) {
    const button = $(buttonId);
    const input = $(inputId);

    if (!button || !input) return;

    button.addEventListener("click", () => {
      input.type = input.type === "password" ? "text" : "password";
      button.textContent = input.type === "password" ? "Show" : "Hide";
      button.setAttribute(
        "aria-label",
        input.type === "password" ? "Show password" : "Hide password"
      );
    });
  }

  setupPasswordToggle("toggleRegPassword", "regPassword");
  setupPasswordToggle("toggleConfirmPassword", "confirmPassword");
  setupPasswordToggle("toggleLoginPassword", "loginPassword");

  function showMessage(element, message, success = false) {
    if (!element) return;
    element.textContent = message;
    element.classList.add("show");
    element.style.color = success ? "#2fd18f" : "#ff6b6b";
  }

  // REGISTRATION FORM
  const registerForm = $("registerForm");

  if (registerForm) {
    const fullName = $("fullName");
    const email = $("regEmail");
    const phone = $("phone");
    const password = $("regPassword");
    const confirmPassword = $("confirmPassword");
    const terms = $("terms");
    const submitButton = $("registerSubmit");
    const successMessage = $("registerSuccess");

    registerForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      successMessage.classList.remove("show");
      successMessage.textContent = "";

      // Basic validation
      if (!fullName.value.trim()) {
        showMessage(successMessage, "Please enter your full name.");
        fullName.focus();
        return;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
        showMessage(successMessage, "Please enter a valid email address.");
        email.focus();
        return;
      }

      if (!/^\+?[\d\s\-()]{7,20}$/.test(phone.value.trim())) {
        showMessage(successMessage, "Please enter a valid phone number.");
        phone.focus();
        return;
      }

      if (password.value.length < 8 || password.value.length > 72) {
        showMessage(
          successMessage,
          "Password must be between 8 and 72 characters."
        );
        password.focus();
        return;
      }

      if (password.value !== confirmPassword.value) {
        showMessage(successMessage, "Passwords do not match.");
        confirmPassword.focus();
        return;
      }

      if (!terms.checked) {
        showMessage(successMessage, "Please accept the terms and conditions.");
        return;
      }

      submitButton.disabled = true;
      submitButton.classList.add("loading");

      try {
        const response = await fetch("/api/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            fullName: fullName.value.trim(),
            email: email.value.trim(),
            phone: phone.value.trim(),
            password: password.value
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Registration failed.");
        }

        // Clear only after successful database insertion
        registerForm.reset();

        const meter = $("strengthMeter");
        const strengthLabel = $("strengthLabel");

        if (meter) meter.classList.remove("weak", "medium", "strong");
        if (strengthLabel) strengthLabel.textContent = "";

        showMessage(
          successMessage,
          "Account created successfully! You can now sign in.",
          true
        );

      } catch (error) {
        // Keep the form values so the user can correct or retry
        showMessage(
          successMessage,
          error.message || "Could not connect to the server."
        );
        console.error("Registration error:", error);
      } finally {
        submitButton.disabled = false;
        submitButton.classList.remove("loading");
      }
    });
  }

  // LOGIN FORM
  const loginForm = $("loginForm");

  if (loginForm) {
    const email = $("loginEmail");
    const password = $("loginPassword");
    const submitButton = $("loginSubmit");
    const successMessage = $("loginSuccess");

    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      successMessage.classList.remove("show");
      successMessage.textContent = "";

      if (!email.value.trim() || !password.value) {
        showMessage(successMessage, "Enter your email and password.");
        return;
      }

      submitButton.disabled = true;
      submitButton.classList.add("loading");

      try {
        const response = await fetch("/api/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email: email.value.trim(),
            password: password.value
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Login failed.");
        }

        showMessage(
          successMessage,
          "Welcome back, " + data.user.fullName + "!",
          true
        );

      } catch (error) {
        showMessage(
          successMessage,
          error.message || "Could not connect to the server."
        );
        console.error("Login error:", error);
      } finally {
        submitButton.disabled = false;
        submitButton.classList.remove("loading");
      }
    });
  }
});
