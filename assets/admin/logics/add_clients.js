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

document.addEventListener("DOMContentLoaded", () => {
    fetchPackagesForSelect();

    const form = document.getElementById("admin_register");
    const membershipModal = new bootstrap.Modal(document.getElementById("membershipModal"));
    const confirmSave = document.getElementById("confirmSave");
    const paymentMethodSelect = document.getElementById("paymentMethod");

    // Show modal instead of direct submit
    form.addEventListener("submit", function (e) {
        e.preventDefault();
        membershipModal.show();
    });

    // Toggle confirm button text
    paymentMethodSelect.addEventListener("change", function () {
        if (this.value === "Cash") {
            confirmSave.textContent = "Confirm Cash Payment";
        } else if (this.value === "UPI") {
            confirmSave.textContent = "Submit & Send WhatsApp Link";
        } else {
            confirmSave.textContent = "Save & Submit";
        }
    });

    // Handle save / payment
    confirmSave.addEventListener("click", function () {
        const membership = document.getElementById("package").value.trim();
        const paymentMethod = paymentMethodSelect.value.trim();

        if (!membership || !paymentMethod) {
            alert("Please select both membership and payment method.");
            return;
        }

        document.getElementById("hiddenPackage").value = membership;
        document.getElementById("hiddenPaymentMethod").value = paymentMethod;

        if (paymentMethod === "Cash") {
            if (confirm("Are you sure you want to confirm Cash Payment?")) {
                document.getElementById("hiddenConfirmedPayment").value = true;
                membershipModal.hide();
                form.submit();
            }
        } else if (paymentMethod === "UPI") {
            // let backend handle sending WhatsApp link
            document.getElementById("hiddenConfirmedPayment").value = false;
            membershipModal.hide();
            form.submit();
        } else {
            // Other methods
            document.getElementById("hiddenConfirmedPayment").value = false;
            membershipModal.hide();
            form.submit();
        }
    });
});

function fetchPackagesForSelect() {
  $.ajax({
    url: "/admin/package-list",
    method: "GET",
    dataType: "json",
    success: function (data) {
      if (data.success) {
        const packageSelect = $("#package");
        packageSelect.html('<option class="text-white" value="">-- Select Package --</option>');
        
        data.data.forEach(pkg => {
          packageSelect.append(
            `<option class="text-white" value="${pkg._id}">
              ${pkg.packageType} - ₹${pkg.price} - ${pkg.durationInDays} Days
            </option>`
          );
        });
      }
    },
    error: function (xhr, status, error) {
      console.error("Error fetching packages:", error);
    }
  });
}


$(document).ready(function () {
    // Load branches when page loads
    $.ajax({
        url: '/admin/get-branches-name',
        type: 'GET',
        success: function (response) {
            if (response.success) {
                $('#branch').empty();
                $('#branch').append('<option class="text-white" value="">-- Select Branch --</option>');
                response.branches.forEach(branch => {
                    $('#branch').append(`<option class="text-white" value="${branch._id}">${branch.name}</option>`);
                });
            } else {
                alert('Error loading branches.');
            }
        },
        error: function () {
            alert('Error fetching branches.');
        }
    });

    // Load trainers when branch changes
    $('#branch').change(function () {
        const branchId = $(this).val();

        if (branchId) {
            $.ajax({
                url: `/admin/get-trainers-by-branch/${branchId}`,
                type: 'GET',
                success: function (response) {
                    $('#trainer').empty();
                    $('#trainer').append('<option class="text-white" value="">-- Select Trainer --</option>');
                    response.trainers.forEach(trainer => {
                        $('#trainer').append(`<option class="text-white" value="${trainer._id}">${trainer.name}</option>`);
                    });
                },
                error: function () {
                    alert('Error fetching trainers.');
                }
            });
        } else {
            $('#trainer').html('<option class="text-white" value="">-- Select Trainer --</option>');
        }
    });
});
