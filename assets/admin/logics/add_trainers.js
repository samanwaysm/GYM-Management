$(document).ready(function () {
  const form = document.getElementById('admin_register');

  // ✅ Fetch branches via AJAX and populate dropdown
  $.ajax({
    url: '/admin/get-branches-name',
    type: 'GET',
    success: function (response) {
      if (response.success) {
        $('#branch').empty().append('<option class="text-white" value="">-- Select Branch --</option>');
        response.branches.forEach(branch => {
          $('#branch').append(`<option class="text-white" value="${branch._id}">${branch.name}</option>`);
        });
      } else {
        $('#branch').append('<option class="text-white" value="">No branches found</option>');
      }
    },
    error: function () {
      $('#branch').append('<option class="text-white" value="">Error loading branches</option>');
    }
  });

  // ✅ Form submit with AJAX
  form.addEventListener('submit', function (event) {
    event.preventDefault();

    // Reset old errors
    form.classList.remove('was-validated');
    $(".is-invalid").removeClass("is-invalid");

    // Frontend bootstrap validation
    if (!form.checkValidity()) {
      event.stopPropagation();
      form.classList.add('was-validated');
      return;
    }

    // Collect form data
    const formData = {
      name: $("#name").val().trim(),
      phone: $("#phone").val().trim(),
      email: $("#email").val().trim(),
      branch: $("#branch").val()
    };

    // ✅ Send AJAX request to add trainer
    fetch('/admin/add-trainers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        // ✅ Redirect after success
        window.location.href = "/admin-trainers-list";
      } else if (data.errors) {
        // Show backend validation errors under each field
        Object.keys(data.errors).forEach(field => {
          const input = document.getElementById(field);
          const errorDiv = document.getElementById(field + "Error");
          if (input && errorDiv) {
            errorDiv.textContent = data.errors[field];
            input.classList.add("is-invalid");
          }
        });
      }
    })
    .catch(err => {
      console.error("AJAX Error:", err);
      alert("Server error while adding trainer.");
    });
  });
});

// $(document).ready(function () {
//   const form = document.getElementById('admin_register');

//   // ✅ Fetch branches via AJAX and populate dropdown
//   $.ajax({
//     url: '/admin/get-branches-name',
//     type: 'GET',
//     success: function (response) {
//       if (response.success) {
//         $('#branch').empty().append('<option class="text-white" value="">-- Select Branch --</option>');
//         response.branches.forEach(branch => {
//           $('#branch').append(`<option class="text-white" value="${branch._id}">${branch.name}</option>`);
//         });
//       } else {
//         $('#branch').append('<option class="text-white" value="">No branches found</option>');
//       }
//     },
//     error: function () {
//       $('#branch').append('<option class="text-white" value="">Error loading branches</option>');
//     }
//   });

//   // ✅ Form submit with AJAX
//   form.addEventListener('submit', function (event) {
//     event.preventDefault();

//     // Reset old errors
//     form.classList.remove('was-validated');
//     $(".is-invalid").removeClass("is-invalid");

//     // Frontend bootstrap validation
//     if (!form.checkValidity()) {
//       event.stopPropagation();
//       form.classList.add('was-validated');
//       return;
//     }

//     // Collect form data
//     const formData = {
//       name: $("#name").val().trim(),
//       phone: $("#phone").val().trim(),
//       email: $("#email").val().trim(),
//       branch: $("#branch").val()
//     };

//     // ✅ Send AJAX request to add trainer
//     fetch('/admin/add-trainers', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify(formData)
//     })
//     .then(res => res.json())
//     .then(data => {
//       if (data.success) {
//         // Success message
//         alert("Trainer added successfully!");
//         form.reset();
//         form.classList.remove('was-validated');
//       } else if (data.errors) {
//         // Show backend validation errors under each field
//         Object.keys(data.errors).forEach(field => {
//           const input = document.getElementById(field);
//           const errorDiv = document.getElementById(field + "Error");
//           if (input && errorDiv) {
//             errorDiv.textContent = data.errors[field];
//             input.classList.add("is-invalid");
//           }
//         });
//       }
//     })
//     .catch(err => {
//       console.error("AJAX Error:", err);
//       alert("Server error while adding trainer.");
//     });
//   });
// });

// $(document).ready(function () {
//     // Fetch branches via AJAX
//     $.ajax({
//         url: '/admin/get-branches-name', // your backend API route
//         type: 'GET',
//         success: function (response) {
//             if (response.success) {
//                 $('#branch').empty();
//                 $('#branch').append('<option class="text-white" value="">-- Select Branch --</option>');

//                 response.branches.forEach(branch => {
//                     $('#branch').append(
//                         `<option class="text-white" value="${branch._id}">${branch.name}</option>`
//                     );
//                 });
//             } else {
//                 $('#branch').append('<option class="text-white" value="">No branches found</option>');
//             }
//         },
//         error: function () {
//             $('#branch').append('<option class="text-white" value="">Error loading branches</option>');
//         }
//     });
// });