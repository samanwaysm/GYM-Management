// function previewImage(event) {
//     const file = event.target.files[0];
//     const preview = document.getElementById("imgPreview");

//     if (file) {
//         const reader = new FileReader();
//         reader.onload = function (e) {
//             preview.src = e.target.result;
//             preview.style.display = "block";
//         };
//         reader.readAsDataURL(file);
//     } else {
//         preview.src = "";
//         preview.style.display = "none";
//     }
// }

// // $(document).ready(function () {
// //   $("#phone").on("input", function () {
// //     const phone = $(this).val().trim();
// //     const phoneError = $('[name="phoneError"]');

// //     // Clear previous error
// //     phoneError.text("");
// //     $(this).removeClass("is-invalid");

// //     if (phone.length === 10) {
// //       $.ajax({
// //         url: "/admin/check-phone",
// //         type: "POST",
// //         data: { phone },
// //         success: function (response) {
// //           if (!response.success) {
// //             phoneError.text(response.message);
// //             $("#phone").addClass("is-invalid");
// //           }
// //         },
// //         error: function () {
// //           phoneError.text("Error checking phone number");
// //           $("#phone").addClass("is-invalid");
// //         },
// //       });
// //     }
// //   });
// // });

// $(document).ready(function () {    
//   $("#phone").on("input", function () {
//     const phone = $(this).val().trim();
//     const phoneError = $('[name="phoneError"]');

//     // Clear previous error
//     phoneError.text("");
//     $(this).removeClass("is-invalid");

//     if (phone.length === 10) {
//       $.ajax({
//         url: "/admin/check-phone",
//         type: "GET",
//         data: { phone },
//         success: function (response) {
//           if (!response.success) {
//             phoneError.text(response.message);
//             $("#phone").addClass("is-invalid");
//           }
//         },
//         error: function () {
//           phoneError.text("Error checking phone number");
//           $("#phone").addClass("is-invalid");
//         },
//       });
//     }
//   });
// });


// document.addEventListener("DOMContentLoaded", () => {
//   const form = document.getElementById("admin_register");
//   const membershipModal = new bootstrap.Modal(document.getElementById("membershipModal"));
//   const confirmSave = document.getElementById("confirmSave");
//   const paymentMethodSelect = document.getElementById("paymentMethod");

//   // Load branches
//   $.ajax({
//     url: "/admin/get-branches-name",
//     type: "GET",
//     success: function (res) {
//       if (res.success) {
//         const branchSelect = $("#branch");
//         branchSelect.empty().append('<option value="">-- Select Branch --</option>');
//         res.branches.forEach(b => branchSelect.append(`<option value="${b._id}">${b.name}</option>`));
//       }
//     }
//   });

//   // Load trainers based on branch
//   $("#branch").change(function () {
//     const branchId = $(this).val();
//     const trainerSelect = $("#trainer");
//     trainerSelect.empty().append('<option value="">-- Select Trainer --</option>');

//     if (!branchId) return;
//     $.ajax({
//       url: `/admin/get-trainers-by-branch/${branchId}`,
//       type: "GET",
//       success: function (res) {
//         res.trainers.forEach(t => trainerSelect.append(`<option value="${t._id}">${t.name}</option>`));
//       }
//     });
//   });

//   // Load packages
//   $.ajax({
//     url: "/admin/package-list",
//     type: "GET",
//     success: function (res) {
//       if (res.success) {
//         const pkgSelect = $("#package");
//         pkgSelect.empty().append('<option value="">-- Select Package --</option>');
//         res.data.forEach(p => pkgSelect.append(`<option value="${p._id}">${p.packageType} - ₹${p.price} - ${p.durationInDays} Days</option>`));
//       }
//     }
//   });

//   // Form validation
//   function validateForm() {
//     let isValid = true;
//     const fields = ["name", "email", "phone", "gender", "dob", "branch", "trainer"];
//     document.querySelectorAll(".error-text").forEach(e => e.textContent = "");

//     const name = $("#name").val().trim();
//     const email = $("#email").val().trim();
//     const phone = $("#phone").val().trim();
//     const gender = $("#gender").val();
//     const dob = $("#dob").val();
//     const branch = $("#branch").val();
//     const trainer = $("#trainer").val();
//     const img = $("#img")[0].files[0];

//     const errors = {};

//     if (!name) { errors.nameError = "Name is required"; isValid = false; }
//     if (!email) {
//         errors.emailError = "Email is required";
//         isValid = false;
//     } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
//         errors.emailError = "Enter a valid email";
//         isValid = false;
//     }
//     if (!phone) { errors.phoneError = "Phone is required"; isValid = false; }
//     else if (!/^\d{10}$/.test(phone)) { errors.phoneError = "Phone must be 10 digits"; isValid = false; }
//     if (!gender) { errors.genderError = "Select gender"; isValid = false; }
//     if (!dob) { errors.dobError = "DOB required"; isValid = false; }
//     if (!branch) { errors.branchError = "Select branch"; isValid = false; }
//     if (!trainer) { errors.trainerError = "Select trainer"; isValid = false; }
//     if (img) {
//       if (!["image/jpeg","image/png"].includes(img.type)) { errors.profileImgError="Only JPG/PNG allowed"; isValid=false; }
//       else if (img.size>2*1024*1024) { errors.profileImgError="Max 2MB"; isValid=false; }
//     }

//     Object.keys(errors).forEach(f => $(`[name="${f}"]`).text(errors[f]));
//     return isValid;
//   }

//   // Submit form
//   form.addEventListener("submit", function (e) {
//     e.preventDefault();
//     if (validateForm()) membershipModal.show();
//   });

//   // Change confirm button text
//   paymentMethodSelect.addEventListener("change", function () {
//     if (this.value === "Cash") confirmSave.textContent = "Confirm Cash Payment";
//     else if (this.value === "Online") confirmSave.textContent = "Submit & Send WhatsApp Link";
//     else confirmSave.textContent = "Save & Submit";
//   });

//   // Confirm save → AJAX submit
//   confirmSave.addEventListener("click", function () {
//     const pkg = $("#package").val();
//     const paymentMethod = $("#paymentMethod").val();
    
//     // Reset errors first
//     $("#package").removeClass("is-invalid");
//     $("#paymentMethod").removeClass("is-invalid");
//     $("#packageError").text("");
//     $("#paymentMethodError").text("");

//     let isValid = true;

//     // Validate package
//     if (!pkg) {
//         $("#package").addClass("is-invalid");
//         $("#packageError").text("Please select a package");
//         isValid = false;
//     }

//     // Validate payment method
//     if (!paymentMethod) {
//         $("#paymentMethod").addClass("is-invalid");
//         $("#paymentMethodError").text("Please select a payment method");
//         isValid = false;
//     }

//     if (!isValid) return;

//     $("#hiddenPackage").val(pkg);
//     $("#hiddenPaymentMethod").val(paymentMethod);
//     $("#hiddenConfirmedPayment").val(paymentMethod==="Cash"?true:false);

//     membershipModal.hide();

//     // AJAX form submission
//     const formData = new FormData(form);
//     $.ajax({
//       url: "/admin/add-clients",
//       type: "POST",
//       data: formData,
//       processData: false,
//       contentType: false,
//       success: function (res) {
//         if (res.success) {
//           window.location.href = "/admin-clients-list";
//         } else if (res.errors) {
//           Object.keys(res.errors).forEach(f => $(`[name="${f}"]`).text(res.errors[f]));
//         }
//       },
//       error: function () {
//         alert("❌ Server error");
//       }
//     });
//   });
// });

// // document.getElementById("confirmSave").addEventListener("click", function () {
// //   const packageSelect = document.getElementById("package");
// //   const paymentSelect = document.getElementById("paymentMethod");

// //   const packageError = document.getElementById("packageError");
// //   const paymentError = document.getElementById("paymentMethodError");

// //   let isValid = true;

// //   // Reset previous errors
// //   packageSelect.classList.remove("is-invalid");
// //   paymentSelect.classList.remove("is-invalid");
// //   packageError.textContent = "";
// //   paymentError.textContent = "";

// //   // Validate Package
// //   if (!packageSelect.value) {
// //     packageError.textContent = "Please select a package";
// //     packageSelect.classList.add("is-invalid");
// //     isValid = false;
// //   }

// //   // Validate Payment Method
// //   if (!paymentSelect.value) {
// //     paymentError.textContent = "Please select a payment method";
// //     paymentSelect.classList.add("is-invalid");
// //     isValid = false;
// //   }

// //   // If valid, proceed with form submission
// //   if (isValid) {
// //     document.getElementById("hiddenPackage").value = packageSelect.value;
// //     document.getElementById("hiddenPaymentMethod").value = paymentSelect.value;

// //     // Close modal
// //     const modal = bootstrap.Modal.getInstance(document.getElementById("membershipModal"));
// //     modal.hide();

// //     // Submit the form
// //     document.getElementById("admin_register").submit();
// //   }
// // });



// // document.addEventListener("DOMContentLoaded", () => {
// //     fetchPackagesForSelect();

// //     const form = document.getElementById("admin_register");
// //     const membershipModal = new bootstrap.Modal(document.getElementById("membershipModal"));
// //     const confirmSave = document.getElementById("confirmSave");
// //     const paymentMethodSelect = document.getElementById("paymentMethod");

// //     // ✅ Form validation function
// //     function validateForm() {
// //         let isValid = true;
// //         let errors = {};
// //         console.log('hiiiiiii');
        
// //         const name = document.getElementById("name")?.value.trim();
// //         const email = document.getElementById("email")?.value.trim();
// //         const phone = document.getElementById("phone")?.value.trim();
// //         const gender = document.getElementById("gender")?.value.trim();
// //         const dob = document.getElementById("dob")?.value.trim();
// //         const branch = document.getElementById("branch")?.value.trim();
// //         const trainer = document.getElementById("trainer")?.value.trim();
// //         const img = document.getElementById("img")?.files[0];

// //         // Name
// //         if (!name) {
// //             errors.nameError = "Name is required";
// //             isValid = false;
// //         }

// //         // Email (Optional, but validate if entered)
// //         if (email) {
// //             if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
// //                 errors.emailError = "Enter a valid email address";
// //                 isValid = false;
// //             }
// //         }

// //         // Phone
// //         if (!phone) {
// //             errors.phoneError = "Phone number is required";
// //             isValid = false;
// //         } else if (!/^\d{10}$/.test(phone)) {
// //             errors.phoneError = "Phone number must be 10 digits";
// //             isValid = false;
// //         }

// //         // Gender
// //         if (!gender) {
// //             errors.genderError = "Please select gender";
// //             isValid = false;
// //         }

// //         // DOB
// //         if (!dob) {
// //             errors.dobError = "Date of Birth is required";
// //             isValid = false;
// //         }

// //         // Branch
// //         if (!branch) {
// //             errors.branchError = "Please select a branch";
// //             isValid = false;
// //         }

// //         // Trainer
// //         if (!trainer) {
// //             errors.trainerError = "Please select a trainer";
// //             isValid = false;
// //         }

// //         // Profile Image
// //         if (img) {
// //             const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
// //             if (!allowedTypes.includes(img.type)) {
// //                 errors.profileImgError = "Only JPG or PNG images are allowed";
// //                 isValid = false;
// //             } else if (img.size > 2 * 1024 * 1024) { // 2MB limit
// //                 errors.profileImgError = "Image size must be less than 2MB";
// //                 isValid = false;
// //             }
// //         }

// //         // ✅ Clear previous errors
// //         document.querySelectorAll(".text-danger.small").forEach(el => (el.textContent = ""));
// //         console.log(errors);
        
// //         // ✅ Display errors
// //         Object.keys(errors).forEach(field => {
// //             const errorElement = document.querySelector(`[name="${field}"]`)?.closest(".col-sm-9")?.querySelector(".text-danger.small");
// //             if (errorElement) {
// //                 errorElement.textContent = errors[field];
// //             }
// //         });

// //         return isValid;
// //     }

// //     // ✅ Form submit handler
// //     form.addEventListener("submit", function (e) {
// //         e.preventDefault();
// //         if (validateForm()) {
// //             // ✅ Open modal only if valid
// //             membershipModal.show();
// //         }
// //     });

// //     // Toggle confirm button text
// //     paymentMethodSelect.addEventListener("change", function () {
// //         if (this.value === "Cash") {
// //             confirmSave.textContent = "Confirm Cash Payment";
// //         } else if (this.value === "Online") {
// //             confirmSave.textContent = "Submit & Send WhatsApp Link";
// //         } else {
// //             confirmSave.textContent = "Save & Submit";
// //         }
// //     });

// //     // Handle save / payment
// //     confirmSave.addEventListener("click", function () {
// //         const membership = document.getElementById("package").value.trim();
// //         const paymentMethod = paymentMethodSelect.value.trim();

// //         if (!membership || !paymentMethod) {
// //             alert("Please select both membership and payment method.");
// //             return;
// //         }

// //         document.getElementById("hiddenPackage").value = membership;
// //         document.getElementById("hiddenPaymentMethod").value = paymentMethod;

// //         if (paymentMethod === "Cash") {
// //             if (confirm("Are you sure you want to confirm Cash Payment?")) {
// //                 document.getElementById("hiddenConfirmedPayment").value = true;
// //                 membershipModal.hide();
// //                 form.submit();
// //             }
// //         } else {
// //             document.getElementById("hiddenConfirmedPayment").value = false;
// //             membershipModal.hide();
// //             form.submit();
// //         }
// //     });
// // });


// // function fetchPackagesForSelect() {
// //   $.ajax({
// //     url: "/admin/package-list",
// //     method: "GET",
// //     dataType: "json",
// //     success: function (data) {
// //       if (data.success) {
// //         const packageSelect = $("#package");
// //         packageSelect.html('<option class="text-white" value="">-- Select Package --</option>');
        
// //         data.data.forEach(pkg => {
// //           packageSelect.append(
// //             `<option class="text-white" value="${pkg._id}">
// //               ${pkg.packageType} - ₹${pkg.price} - ${pkg.durationInDays} Days
// //             </option>`
// //           );
// //         });
// //       }
// //     },
// //     error: function (xhr, status, error) {
// //       console.error("Error fetching packages:", error);
// //     }
// //   });
// // }


// // $(document).ready(function () {
// //     // Load branches when page loads
// //     $.ajax({
// //         url: '/admin/get-branches-name',
// //         type: 'GET',
// //         success: function (response) {
// //             if (response.success) {
// //                 $('#branch').empty();
// //                 $('#branch').append('<option class="text-white" value="">-- Select Branch --</option>');
// //                 response.branches.forEach(branch => {
// //                     $('#branch').append(`<option class="text-white" value="${branch._id}">${branch.name}</option>`);
// //                 });
// //             } else {
// //                 alert('Error loading branches.');
// //             }
// //         },
// //         error: function () {
// //             alert('Error fetching branches.');
// //         }
// //     });

// //     // Load trainers when branch changes
// //     $('#branch').change(function () {
// //         const branchId = $(this).val();

// //         if (branchId) {
// //             $.ajax({
// //                 url: `/admin/get-trainers-by-branch/${branchId}`,
// //                 type: 'GET',
// //                 success: function (response) {
// //                     $('#trainer').empty();
// //                     $('#trainer').append('<option class="text-white" value="">-- Select Trainer --</option>');
// //                     response.trainers.forEach(trainer => {
// //                         $('#trainer').append(`<option class="text-white" value="${trainer._id}">${trainer.name}</option>`);
// //                     });
// //                 },
// //                 error: function () {
// //                     alert('Error fetching trainers.');
// //                 }
// //             });
// //         } else {
// //             $('#trainer').html('<option class="text-white" value="">-- Select Trainer --</option>');
// //         }
// //     });
// // });

function previewImage(event) {
  const file = event.target.files[0];
  const preview = document.getElementById("imgPreview");

  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      preview.src = e.target.result;
      preview.style.display = "block";
    };
    reader.readAsDataURL(file);
  } else {
    preview.src = "";
    preview.style.display = "none";
  }
}

$(document).ready(function () {
  const form = document.getElementById("admin_register");
  const membershipModal = new bootstrap.Modal(document.getElementById("membershipModal"));
  const confirmSave = document.getElementById("confirmSave");
  const paymentMethodSelect = document.getElementById("paymentMethod");

  // ================= Duplicate check helpers =================
  function showError(field, msg) {
    field.classList.add("is-invalid");
    $(field).siblings(".invalid-feedback").text(msg);
  }
  function clearError(field) {
    field.classList.remove("is-invalid");
    $(field).siblings(".invalid-feedback").text("");
  }

   // 🔹 Email duplicate check
  const emailInput = document.getElementById("email");
  emailInput.addEventListener("blur", async function () {
    const email = emailInput.value.trim();
    clearError(emailInput);

    if (!email) return;

    try {
      const res = await fetch(`/admin/check-email-add?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (data.exists) {
        showError(emailInput, "Email already exists.");
      }
    } catch (err) {
      console.error("Error checking email:", err);
    }
  });

  // 🔹 Phone duplicate check
  const phoneInput = document.getElementById("phone");
  phoneInput.addEventListener("blur", async function () {
    const phone = phoneInput.value.trim();
    clearError(phoneInput);

    if (!phone) return;

    try {
      const res = await fetch(`/admin/check-phone-add?phone=${encodeURIComponent(phone)}`);
      const data = await res.json();
      if (data.exists) {
        showError(phoneInput, "Phone number already exists.");
      }
    } catch (err) {
      console.error("Error checking phone:", err);
    }
  });

  // 🔹 Load branches
  $.ajax({
    url: "/admin/get-branches-name",
    type: "GET",
    success: function (res) {
      if (res.success) {
        const branchSelect = $("#branch");
        branchSelect.empty().append('<option value="">-- Select Branch --</option>');
        res.branches.forEach(b => branchSelect.append(`<option value="${b._id}">${b.name}</option>`));
      }
    }
  });

  // 🔹 Load trainers based on branch
  $("#branch").change(function () {
    const branchId = $(this).val();
    const trainerSelect = $("#trainer");
    trainerSelect.empty().append('<option value="">-- Select Trainer --</option>');

    if (!branchId) return;
    $.ajax({
      url: `/admin/get-trainers-by-branch/${branchId}`,
      type: "GET",
      success: function (res) {
        res.trainers.forEach(t => trainerSelect.append(`<option value="${t._id}">${t.name}</option>`));
      }
    });
  });

  // 🔹 Load packages
  $.ajax({
    url: "/admin/package-list",
    type: "GET",
    success: function (res) {
      if (res.success) {
        const pkgSelect = $("#package");
        pkgSelect.empty().append('<option value="">-- Select Package --</option>');
        res.data.forEach(p =>
          pkgSelect.append(`<option value="${p._id}">${p.packageType} - ₹${p.price} - ${p.durationInDays} Days</option>`)
        );
      }
    }
  });

  // 🔹 Custom validation function
  function validateField(field) {
    const value = $(field).val().trim();
    let error = "";

    switch (field.id) {
      case "name":
        if (!value) error = "Name is required";
        break;
      case "email":
        if (!value) error = "Email is required";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = "Enter a valid email";
        break;
      case "phone":
        if (!value) error = "Phone is required";
        else if (!/^\d{10}$/.test(value)) error = "Phone must be 10 digits";
        break;
      case "gender":
        if (!value) error = "Select gender";
        break;
      case "dob":
        if (!value) error = "DOB is required";
        break;
      case "branch":
        if (!value) error = "Select branch";
        break;
      case "trainer":
        if (!value) error = "Select trainer";
        break;
      case "img":
        const file = field.files[0];
        if (file) {
          if (!["image/jpeg", "image/png"].includes(file.type)) {
            error = "Only JPG/PNG allowed";
          } else if (file.size > 2 * 1024 * 1024) {
            error = "Max file size is 2MB";
          }
        }
        break;
    }

    if (error) {
      field.setCustomValidity(error);
      $(field).addClass("is-invalid");
    } else {
      field.setCustomValidity("");
      $(field).removeClass("is-invalid").addClass("is-valid");
    }
  }

  // 🔹 Attach real-time validation
  $("#admin_register input, #admin_register select").on("input change", function () {
    validateField(this);
  });

  // 🔹 Submit form
  form.addEventListener("submit", function (e) {
    e.preventDefault();

    let isValid = true;
    $("#admin_register input, #admin_register select").each(function () {
      validateField(this);
      if (!this.checkValidity()) isValid = false;
    });

    if (isValid) {
      membershipModal.show();
    }
    form.classList.add("was-validated");
  });

  // 🔹 Change confirm button text
  paymentMethodSelect.addEventListener("change", function () {
    if (this.value === "Cash") confirmSave.textContent = "Confirm Cash Payment";
    else if (this.value === "Online") confirmSave.textContent = "Submit & Send WhatsApp Link";
    else confirmSave.textContent = "Save & Submit";
  });

  // 🔹 Confirm save → AJAX submit
  confirmSave.addEventListener("click", function () {
    const pkg = $("#package").val();
    const paymentMethod = $("#paymentMethod").val();

    let isValid = true;

    if (!pkg) {
      $("#package").addClass("is-invalid");
      isValid = false;
    } else {
      $("#package").removeClass("is-invalid").addClass("is-valid");
    }

    if (!paymentMethod) {
      $("#paymentMethod").addClass("is-invalid");
      isValid = false;
    } else {
      $("#paymentMethod").removeClass("is-invalid").addClass("is-valid");
    }

    if (!isValid) return;

    $("#hiddenPackage").val(pkg);
    $("#hiddenPaymentMethod").val(paymentMethod);
    $("#hiddenConfirmedPayment").val(paymentMethod === "Cash" ? true : false);

    membershipModal.hide();

    const formData = new FormData(form);
    $.ajax({
      url: "/admin/add-clients",
      type: "POST",
      data: formData,
      processData: false,
      contentType: false,
      success: function (res) {
        if (res.success) {
          window.location.href = "/admin-clients-list";
        } else if (res.errors) {
          // Backend error → mark invalid
          Object.keys(res.errors).forEach(f => {
            const field = $(`#${f}`)[0];
            if (field) {
              field.setCustomValidity(res.errors[f]);
              $(field).addClass("is-invalid");
            }
          });
        }
      },
      error: function () {
        alert("❌ Server error");
      }
    });
  });
});
