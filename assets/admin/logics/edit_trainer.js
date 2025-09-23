$(document).ready(function () {
    const pathParts = window.location.pathname.split("/");
    const trainerId = pathParts[pathParts.length - 1]; // last part of URL is trainerId

    // ✅ Step 1: Fetch Branches First
    $.ajax({
        url: '/admin/get-branches-name',
        type: 'GET',
        success: function (response) {
            if (response.success) {
                $('#branch').empty();
                $('#branch').append('<option class="text-white" value="">-- Select Branch --</option>');

                response.branches.forEach(branch => {
                    $('#branch').append(
                        `<option class="text-white" value="${branch._id}">${branch.name}</option>`
                    );
                });

                // ✅ After branches loaded, fetch trainer details
                fetchTrainerDetails(trainerId);
            } else {
                $('#branch').append('<option class="text-white" value="">No branches found</option>');
            }
        },
        error: function () {
            $('#branch').append('<option class="text-white" value="">Error loading branches</option>');
        }
    });

    // ✅ Step 2: Fetch Trainer Details
    function fetchTrainerDetails(trainerId) {
        $.ajax({
            url: `/admin/get-trainers/${trainerId}`,
            type: 'GET',
            success: function (data) {
                if (data.success) {
                    $("#name").val(data.trainer.name);
                    $("#email").val(data.trainer.email);
                    $("#phone").val(data.trainer.phone);

                    // ✅ Select branch directly using branchId
                    $("#branch").val(data.trainer.branchId).trigger("change");
                } else {
                    alert("❌ Trainer not found");
                }
            },
            error: function () {
                alert("⚠️ Error fetching trainer details");
            }
        });
    }

    $("#editTrainerForm").on("submit", function (e) {
        e.preventDefault();

        const form = this;
        let isValid = true;

        // Reset validation states
        $(form).find("input, select").removeClass("is-invalid");

        // ✅ Manual empty field validation
        const name = $("#name").val().trim();
        const email = $("#email").val().trim();
        const phone = $("#phone").val().trim();
        const branch = $("#branch").val();

        if (!name) {
            $("#name").addClass("is-invalid");
            $("#name").siblings(".invalid-feedback").text("Name is required.");
            isValid = false;
        }

        if (!email) {
            $("#email").addClass("is-invalid");
            $("#email").siblings(".invalid-feedback").text("Email is required.");
            isValid = false;
        }

        if (!phone) {
            $("#phone").addClass("is-invalid");
            $("#phone").siblings(".invalid-feedback").text("Phone number is required.");
            isValid = false;
        } else if (!/^\d{10}$/.test(phone)) {
            $("#phone").addClass("is-invalid");
            $("#phone").siblings(".invalid-feedback").text("Enter a valid 10-digit phone number.");
            isValid = false;
        }

        if (!branch) {
            $("#branch").addClass("is-invalid");
            $("#branch").siblings(".invalid-feedback").text("Branch is required.");
            isValid = false;
        }

        if (!isValid) return; // ❌ Stop if any client-side errors

        const updatedTrainer = { name, email, phone, branch };

        // ✅ Submit via AJAX
        $.ajax({
            url: `/admin/update-trainers/${trainerId}`,
            type: "PUT",
            contentType: "application/json",
            data: JSON.stringify(updatedTrainer),
            success: function (result) {
                if (result.success) {
                    Swal.fire({
                        title: "Success!",
                        text: result.message || "Trainer updated successfully!",
                        icon: "success",
                        timer: 1200,
                        showConfirmButton: false,
                        background: "#1e1e2f",
                        color: "#ffffff",
                        iconColor: "#00d97e"
                    }).then(() => {
                        window.location.href = "/admin-trainers-list";
                    });
                } else {
                    Swal.fire({
                        title: "Error!",
                        text: result.message || "Failed to update trainer.",
                        icon: "error",
                        timer: 1500,
                        showConfirmButton: false,
                        background: "#1e1e2f",
                        color: "#ffffff",
                        iconColor: "#ff6b6b"
                    });
                }
            },
            error: function (xhr) {
                const response = xhr.responseJSON;
                if (response && response.errors) {
                    Object.keys(response.errors).forEach(field => {
                        const input = $(`#${field}`);
                        if (input.length) {
                            input.addClass("is-invalid");
                            input.siblings(".invalid-feedback").text(response.errors[field]);
                        }
                    });
                } else {
                    Swal.fire({
                        title: "Server Error!",
                        text: "Unable to update trainer. Please try again.",
                        icon: "error",
                        timer: 1500,
                        showConfirmButton: false,
                        background: "#1e1e2f",
                        color: "#ffffff",
                        iconColor: "#ff6b6b"
                    });
                }
            }
        });

    });


    // ✅ Step 3: Handle Edit Submit
    // $("#editTrainerForm").on("submit", function (e) {
    //     e.preventDefault();

    //     const updatedTrainer = {
    //         name: $("#name").val(),
    //         email: $("#email").val(),
    //         phone: $("#phone").val(),
    //         branch: $("#branch").val()
    //     };

    //     $.ajax({
    //         url: `/admin/update-trainers/${trainerId}`,
    //         type: "PUT",
    //         contentType: "application/json",
    //         data: JSON.stringify(updatedTrainer),
    //         success: function (result) {
    //             if (result.success) {
    //                 alert("✅ Trainer updated successfully!");
    //                 window.location.href = "/admin-trainers-list";
    //             } else {
    //                 alert("❌ " + (result.error || "Failed to update trainer"));
    //             }
    //         },
    //         error: function () {
    //             alert("⚠️ Server error while updating trainer");
    //         }
    //     });
    // });
});