function togglePassword(inputId, el) {
    const input = document.getElementById(inputId);
    const icon = el.querySelector("i");

    if (input.type === "password") {
      input.type = "text";
      icon.classList.remove("mdi-eye-off");
      icon.classList.add("mdi-eye");
    } else {
      input.type = "password";
      icon.classList.remove("mdi-eye");
      icon.classList.add("mdi-eye-off");
    }
  }

  // Bootstrap validation
   // Bootstrap validation
  (function () {
    "use strict";
    window.addEventListener("load", function () {
      const forms = document.getElementsByClassName("needs-validation");
      Array.prototype.filter.call(forms, function (form) {
        form.addEventListener("submit", function (event) {
          let valid = true;

          // checkValidity handles required/email/phone rules
          if (form.checkValidity() === false) {
            valid = false;
          }

          // Extra: Password validation
          const password = document.getElementById("password");
          const newPass = document.getElementById("new-password");
          const confirmPass = document.getElementById("confirm-password");

          if (!password.value.trim()) {
            password.setCustomValidity("Please enter your current password");
            valid = false;
          } else {
            password.setCustomValidity("");
          }

          if (!newPass.value.trim()) {
            newPass.setCustomValidity("Please enter a new password");
            valid = false;
          } else if (newPass.value.length < 6) {
            newPass.setCustomValidity("Password must be at least 6 characters");
            valid = false;
          } else {
            newPass.setCustomValidity("");
          }

          if (!confirmPass.value.trim()) {
            confirmPass.setCustomValidity("Please confirm your password");
            valid = false;
          } else if (newPass.value !== confirmPass.value) {
            confirmPass.setCustomValidity("Passwords do not match");
            valid = false;
          } else {
            confirmPass.setCustomValidity("");
          }

          if (!valid) {
            event.preventDefault();
            event.stopPropagation();
          }

          form.classList.add("was-validated");
        }, false);
      });
    }, false);
  })();

  // ==============================
  // Admin Profile + OTP Handling
  // ==============================
  
let userType = null;

document.addEventListener("DOMContentLoaded", function () {
  // Load Admin Profile
  $.ajax({
    url: "/admin/admin-profile",
    method: "GET",
    dataType: "json",
    success: function (data) {
      if (data.error) {
        alert(data.error);
        return;
      }

      userType = data.role;

      // Hide loader (if you have one)
      const profileLoader = $("#profile-loader");
      const profileForm = $("#admin_register");
      if (profileLoader.length) profileLoader.hide();
      if (profileForm.length) profileForm.show();

      // Fill form fields with backend data
      $("#name").val(data.user.name || "");
      $("#email").val(data.user.email || "");
      $("#phone").val(data.user.phone || "");
    },
    error: function (xhr, status, error) {
      console.error("Error fetching admin profile:", error);
      alert("Failed to load profile.");
    }
  });
});

// Send OTP to email
$("#sendOtpBtn").on("click", function () {
  const email = $("#email").val();

  if (!email) {
    alert("Please enter an email address");
    return;
  }

  $.ajax({
    url: "/admin/send-otp",
    method: "POST",
    contentType: "application/json",
    data: JSON.stringify({ email }),
    success: function (data) {
      if (data.success) {
        $("#verifyEmailModal").modal("show");
      } else {
        alert("Failed to send OTP. Try again.");
      }
    },
    error: function (xhr, status, error) {
      console.error("Error:", error);
      alert("Server error while sending OTP.");
    }
  });
});

// Handle OTP input flow
document.querySelectorAll(".otp-input").forEach((input, index, allInputs) => {
  input.addEventListener("input", () => {
    if (input.value.length === 1 && index < allInputs.length - 1) {
      allInputs[index + 1].focus();
    }
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Backspace" && input.value === "" && index > 0) {
      allInputs[index - 1].focus();
    }
  });
});

// Submit OTP for verification
$("#verifyOtpForm").on("submit", function (e) {
  e.preventDefault();

  const otp = Array.from(document.querySelectorAll(".otp-input"))
    .map((input) => input.value)
    .join("");

  const email = $("#email").val();
  const name = $("#name").val();
  const phone = $("#phone").val();
  const password = $("#password").val();
  const newPassword = $("#new-password").val();
  const confirmPassword = $("#confirm-password").val();

  $.ajax({
    url: "/admin/verify-otp",
    method: "POST",
    contentType: "application/json",
    data: JSON.stringify({
      userType,
      email,
      name,
      phone,
      otp,
      password,
      newPassword,
      confirmPassword
    }),
    success: function (data) {
      if (data.success) {
        alert("Password changed successfully!");
        $("#verifyEmailModal").modal("hide");
        window.location.href = "/admin/admin-logout";
      } else {
        alert(data.message || "OTP verification failed.");
      }
    },
    error: function (xhr, status, error) {
      console.error("Error:", error);
      alert("Error verifying OTP.");
    }
  });
});
