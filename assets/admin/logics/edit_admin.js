document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("editAdminForm");
  const pathParts = window.location.pathname.split("/");
  const adminId = pathParts[pathParts.length - 1];

  // ✅ Load admin data
  fetch(`/superadmin/get-admin/${adminId}`)
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        document.getElementById("name").value = data.admin.name || "";
        document.getElementById("email").value = data.admin.email || "";
        document.getElementById("phone").value = data.admin.phone || "";
      }
    });

  // ✅ Handle submit
  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    // Reset validation states
    form.querySelectorAll("input").forEach(input => {
      input.classList.remove("is-invalid");
    });

    let hasError = false;

    // ✅ Manual empty field validation
    ["name", "email", "phone"].forEach(field => {
      const input = document.getElementById(field);
      const feedback = input.parentNode.querySelector(".invalid-feedback");

      if (!input.value.trim()) {
        feedback.innerText = `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
        input.classList.add("is-invalid");
        hasError = true;
      }
    });

    if (hasError) return; // stop before API call

    const updatedData = {
      name: document.getElementById("name").value.trim(),
      email: document.getElementById("email").value.trim(),
      phone: document.getElementById("phone").value.trim()
    };

    try {
      const res = await fetch(`/superadmin/update-admin/${adminId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData)
      });

      const result = await res.json();

      if (result.success) {
        Swal.fire({
          title: "Success!",
          text: result.message || "Admin updated successfully!",
          icon: "success",
          timer: 1200,
          showConfirmButton: false,
          background: "#1e1e2f",
          color: "#ffffff",
          iconColor: "#00d97e"
        }).then(() => {
          window.location.href = "/superadmin-admin-list";
        });
      } else if (result.errors) {
        // ✅ Clear previous validation
        form.querySelectorAll("input").forEach(input => {
          input.classList.remove("is-invalid");
        });

        // ✅ Show server-side errors
        Object.keys(result.errors).forEach(field => {
          const input = document.getElementById(field);
          if (input) {
            let feedback = input.parentNode.querySelector(".invalid-feedback");
            if (!feedback) {
              feedback = document.createElement("div");
              feedback.className = "invalid-feedback";
              input.parentNode.appendChild(feedback);
            }
            feedback.innerText = result.errors[field];
            input.classList.add("is-invalid");
          }
        });

        Swal.fire({
          title: "Error!",
          text: "Please fix the highlighted errors.",
          icon: "error",
          timer: 1500,
          showConfirmButton: false,
          background: "#1e1e2f",
          color: "#ffffff",
          iconColor: "#ff6b6b"
        });
      } else {
        Swal.fire({
          title: "Error!",
          text: result.error || "Failed to update admin",
          icon: "error",
          timer: 1500,
          showConfirmButton: false,
          background: "#1e1e2f",
          color: "#ffffff",
          iconColor: "#ff6b6b"
        });
      }
    } catch (err) {
      console.error("❌ Error updating admin:", err);
      Swal.fire({
        title: "Error!",
        text: "Server error. Please try again later.",
        icon: "error",
        timer: 1500,
        showConfirmButton: false,
        background: "#1e1e2f",
        color: "#ffffff",
        iconColor: "#ff6b6b"
      });
    }
  });
});
