document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("editBranchForm");
  const pathParts = window.location.pathname.split("/");
  const branchId = pathParts[pathParts.length - 1];

  // ✅ Load branch data
  fetch(`/admin/get-branch/${branchId}`)
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        document.getElementById("name").value = data.branch.name || "";
        document.getElementById("phone").value = data.branch.phone || "";
        document.getElementById("address").value = data.branch.location.address || "";
        document.getElementById("city").value = data.branch.location.city || "";
        document.getElementById("state").value = data.branch.location.state || "";
        document.getElementById("pincode").value = data.branch.location.pincode || "";
        document.getElementById("lat").value = data.branch.geo.lat || "";
        document.getElementById("lng").value = data.branch.geo.lng || "";
      }
    })
    .catch(err => console.error("❌ Error fetching branch:", err));

  // ✅ Handle form submit (AJAX)
  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    // Reset validation states
    form.querySelectorAll("input").forEach(input => {
      input.classList.remove("is-invalid");
    });

    let hasError = false;

    // ✅ Client-side required validation
    ["name", "phone", "address", "city", "state", "pincode"].forEach(field => {
      const input = document.getElementById(field);
      if (!input.value.trim()) {
        let feedback = input.parentNode.querySelector(".invalid-feedback");
        if (!feedback) {
          feedback = document.createElement("div");
          feedback.className = "invalid-feedback";
          input.parentNode.appendChild(feedback);
        }
        feedback.innerText = `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
        input.classList.add("is-invalid");
        hasError = true;
      }
    });

    // ✅ Phone format check
    const phoneInput = document.getElementById("phone");
    if (phoneInput.value && !/^[0-9]{10}$/.test(phoneInput.value)) {
      let feedback = phoneInput.parentNode.querySelector(".invalid-feedback");
      if (!feedback) {
        feedback = document.createElement("div");
        feedback.className = "invalid-feedback";
        phoneInput.parentNode.appendChild(feedback);
      }
      feedback.innerText = "Enter a valid 10-digit phone number";
      phoneInput.classList.add("is-invalid");
      hasError = true;
    }

    if (hasError) return;

    const updatedData = {
      name: document.getElementById("name").value.trim(),
      phone: document.getElementById("phone").value.trim(),
      address: document.getElementById("address").value.trim(),
      city: document.getElementById("city").value.trim(),
      state: document.getElementById("state").value.trim(),
      pincode: document.getElementById("pincode").value.trim(),
      lat: document.getElementById("lat").value.trim(),
      lng: document.getElementById("lng").value.trim(),
    };

    try {
      const res = await fetch(`/admin/update-branch/${branchId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData)
      });

      const result = await res.json();

      if (result.success) {
        Swal.fire({
          title: "Success!",
          text: result.message || "Branch updated successfully!",
          icon: "success",
          timer: 1200,
          showConfirmButton: false,
          background: "#1e1e2f",
          color: "#ffffff",
          iconColor: "#00d97e"
        }).then(() => {
          window.location.href = "/admin-branches-list";
        });
      } else if (result.errors) {
        // ✅ Handle server validation errors
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
          text: result.error || "Failed to update branch",
          icon: "error",
          timer: 1500,
          showConfirmButton: false,
          background: "#1e1e2f",
          color: "#ffffff",
          iconColor: "#ff6b6b"
        });
      }
    } catch (err) {
      console.error("❌ Error updating branch:", err);
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
