$(document).ready(function () {
    const pathParts = window.location.pathname.split("/");
    const clientId = pathParts[pathParts.length - 1];

    const $imgInput = $("#img");
    const $imgPreview = $("#imgPreview");
    let originalPackage = null; // to check membership change

    // ✅ Preview profile image
    $imgInput.on("change", function (event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                $imgPreview.attr("src", e.target.result).show();
            };
            reader.readAsDataURL(file);
        }
    });

    // ✅ Fetch Packages for <select>
    function fetchPackagesForSelect() {
        $.ajax({
            url: "/admin/package-list",
            type: "GET",
            success: function (data) {
                if (data.success) {
                    const $packageSelect = $("#package");
                    $packageSelect.empty().append('<option class="text-white" value="">-- Select Package --</option>');
                    data.data.forEach(pkg => {
                        $packageSelect.append(
                            `<option class="text-white" value="${pkg._id}">${pkg.packageType} - ₹${pkg.price} - ${pkg.durationInDays} Days</option>`
                        );
                    });
                }
            },
            error: function () {
                alert("Error fetching packages.");
            }
        });
    }

    // ✅ Fetch Branches for <select>
    function fetchBranches() {
        $.ajax({
            url: "/admin/get-branches-name",
            type: "GET",
            success: function (response) {
                if (response.success) {
                    const $branch = $("#branch");
                    $branch.empty().append('<option class="text-white" value="">-- Select Branch --</option>');
                    response.branches.forEach(branch => {
                        $branch.append(`<option class="text-white" value="${branch._id}">${branch.name}</option>`);
                    });
                } else {
                    alert("Error loading branches.");
                }
            },
            error: function () {
                alert("Error fetching branches.");
            }
        });
    }

    // ✅ Fetch Trainers when branch changes
    $("#branch").change(function () {
        const branchId = $(this).val();
        if (branchId) {
            $.ajax({
                url: `/admin/get-trainers-by-branch/${branchId}`,
                type: "GET",
                success: function (response) {
                    const $trainer = $("#trainer");
                    $trainer.empty().append('<option class="text-white" value="">-- Select Trainer --</option>');
                    if (response.trainers) {
                        response.trainers.forEach(trainer => {
                            $trainer.append(`<option class="text-white" value="${trainer._id}">${trainer.name}</option>`);
                        });
                    }
                },
                error: function () {
                    alert("Error fetching trainers.");
                }
            });
        } else {
            $("#trainer").html('<option class="text-white" value="">-- Select Trainer --</option>');
        }
    });

    // Load client details
    function loadClientDetails() {
        $.ajax({
            url: `/admin/get-clients/${clientId}`,
            type: "GET",
            success: function (data) {
                if (data.success) {
                    const client = data.data;
                    const date = new Date(client.dob);
                    const formattedDate = date.toISOString().split("T")[0]; // "YYYY-MM-DD"
                    $("#name").val(client.userInfo.name);
                    $("#email").val(client.userInfo.email);
                    $("#phone").val(client.userInfo.phone);
                    $("#altphone").val(client.altphone || "");
                    $("#gender").val(client.gender || "");
                    $("#dob").val(formattedDate || "");
                    $("#branch").val(client.branchInfo?._id || "");
                    $("#trainer").val(client.trainerInfo?._id || "");
                    $("#height").val(client.height || "");
                    $("#weight").val(client.weight || "");

                    if (client.img) $imgPreview.attr("src", client.img).show();

                    // Preselect Branch
                    if (client.branchInfo?._id) {
                        $("#branch").val(client.branchInfo._id).trigger("change");
                    }

                    // Preselect Trainer
                    if (client.trainerInfo?._id) {
                        setTimeout(() => {
                            $("#trainer").val(client.trainerInfo._id);
                        }, 500); // wait trainers to load
                    }

                    // Preselect Package & Payment
                    // if (client.membership) {
                    //     $("#package").val(client.packageInfo?._id || "");
                    //     $("#paymentMethod").val(client.membership.paymentMethod || "");
                    //     originalPackage = client.membership.package; // store original
                    // }

                    // Show membership form ONLY if status is 'Expired'
                    if (client.membership && client.membership.status === "Expired" || client.membership.status === "Pending") {
                        $("#membershipForm").show();
                    } else {
                        $("#membershipForm").hide();
                    }

                    // if (client.membership) {
                    //     $("#package").val(client.membership.package || "");
                    //     $("#paymentMethod").val(client.membership.paymentMethod || "");
                    //     originalPackage = client.membership.package; // store original
                    // }
                } else {
                    alert("Failed to load client");
                }
            }
        });
    }

    // --- Membership form submit ---
$("#membershipForm").on("submit", function (e) {
    e.preventDefault();

    const data = {
        packageId: $("#package").val(),
        paymentMethod: $("#paymentMethod").val(),
        confirmedPayment: false // default
    };

    const submitAjax = () => {
        $.ajax({
            url: `/admin/update-membership/${clientId}`,
            type: "PATCH",
            contentType: "application/json",
            data: JSON.stringify(data),
            success: function (res) {
                if (res.success) {
                    Swal.fire({
                        title: "Success!",
                        text: res.message || "Membership updated successfully!",
                        icon: "success",
                        timer: 1200,
                        showConfirmButton: false,
                        background: "#1e1e2f",
                        color: "#ffffff",
                        iconColor: "#00d97e"
                    }).then(() => {
                        window.location.href = res.redirect || "/admin-clients-list";
                    });
                } else {
                    Swal.fire({
                        title: "Error!",
                        text: res.message || "Something went wrong while updating membership.",
                        icon: "error",
                        timer: 1500,
                        showConfirmButton: false,
                        background: "#1e1e2f",
                        color: "#ffffff",
                        iconColor: "#ff6b6b"
                    }).then(() => {
                        window.location.href = "/admin-clients-list";
                    });
                }
            },
            error: function (err) {
                Swal.fire({
                    title: "Server Error!",
                    text: "Unable to update membership. Please try again.",
                    icon: "error",
                    timer: 1500,
                    showConfirmButton: false,
                    background: "#1e1e2f",
                    color: "#ffffff",
                    iconColor: "#ff6b6b"
                }).then(() => {
                    window.location.href = "/admin-clients-list";
                });
            }
        });
    };

    if (data.paymentMethod === "Cash") {
        Swal.fire({
            title: "Confirm Cash Payment?",
            text: "Are you sure you want to confirm this Cash Payment?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, confirm it!",
            cancelButtonText: "Cancel",
            background: "#1e1e2f",
            color: "#ffffff",
            iconColor: "#00d97e"
        }).then((result) => {
            if (result.isConfirmed) {
                data.confirmedPayment = true;
                submitAjax(); // call AJAX **after confirmation**
            }
        });
    } else {
        // Online or other payments → submit directly
        submitAjax();
    }
});

    // --- Membership form submit ---
    // $("#membershipForm").on("submit", function (e) {
    //     e.preventDefault();

    //     const data = {
    //         packageId: $("#package").val(),
    //         paymentMethod: $("#paymentMethod").val(),
    //         confirmedPayment: false // default
    //     };

    //     // Handle confirmation based on payment method
    //     if (data.paymentMethod === "Cash") {
    //         Swal.fire({
    //             title: "Confirm Cash Payment?",
    //             text: "Are you sure you want to confirm this Cash Payment?",
    //             icon: "warning",
    //             showCancelButton: true,
    //             confirmButtonText: "Yes, confirm it!",
    //             cancelButtonText: "Cancel",
    //             background: "#1e1e2f",
    //             color: "#ffffff",
    //             iconColor: "#00d97e"
    //         }).then((result) => {
    //             if (result.isConfirmed) {
    //                 data.confirmedPayment = true;
    //             }
    //         });
    //     } else if (data.paymentMethod === "Online") {
    //         data.confirmedPayment = false; // backend will handle Online flow
    //     }

    //     $.ajax({
    //         url: `/admin/update-membership/${clientId}`,
    //         type: "PATCH",
    //         contentType: "application/json",
    //         data: JSON.stringify(data),
    //         success: function (res) {
    //             if (res.success) {
    //                 Swal.fire({
    //                     title: "Success!",
    //                     text: res.message || "Membership updated successfully!",
    //                     icon: "success",
    //                     timer: 1200,
    //                     showConfirmButton: false,
    //                     background: "#1e1e2f",
    //                     color: "#ffffff",
    //                     iconColor: "#00d97e"
    //                 }).then(() => {
    //                     window.location.href = res.redirect || "/admin-clients-list";
    //                 });
    //             } else {
    //                 Swal.fire({
    //                     title: "Error!",
    //                     text: res.message || "Something went wrong while updating membership.",
    //                     icon: "error",
    //                     timer: 1500,
    //                     showConfirmButton: false,
    //                     background: "#1e1e2f",
    //                     color: "#ffffff",
    //                     iconColor: "#ff6b6b"
    //                 }).then(() => {
    //                     window.location.href = "/admin-clients-list";
    //                 });
    //             }
    //         },
    //         error: function (err) {
    //             Swal.fire({
    //                 title: "Server Error!",
    //                 text: "Unable to update membership. Please try again.",
    //                 icon: "error",
    //                 timer: 1500,
    //                 showConfirmButton: false,
    //                 background: "#1e1e2f",
    //                 color: "#ffffff",
    //                 iconColor: "#ff6b6b"
    //             }).then(() => {
    //                 window.location.href = "/admin-clients-list";
    //             });
    //         }
    //     });

    // });

    // --- Details form submit ---
    // $("#detailsForm").on("submit", function (e) {
    //     e.preventDefault();

    //     const data = {
    //         name: $("#name").val(),
    //         email: $("#email").val(),
    //         phone: $("#phone").val(),
    //         altphone: $("#altphone").val(),
    //         gender: $("#gender").val(),
    //         dob: $("#dob").val(),
    //         branch: $("#branch").val(),
    //         trainer: $("#trainer").val(),
    //         height: $("#height").val(),
    //         weight: $("#weight").val()
    //     };

    //     $.ajax({
    //         url: `/admin/update-client-details/${clientId}`,
    //         type: "PATCH",
    //         contentType: "application/json",
    //         data: JSON.stringify(data),
    //         success: function (res) {
    //             if (res.success) {
    //                 window.location.href = "/admin-clients-list";
    //             }
    //             else alert(res.message || "Failed");
    //         }
    //     });
    // });

    $("#detailsForm").on("submit", function (e) {
    e.preventDefault();

    const form = this;
    let isValid = true;

    // Reset previous errors
    $(form).find("input, select").removeClass("is-invalid");
    $(form).find(".invalid-feedback").text("");

    // Collect values
    const data = {
        name: $("#name").val().trim(),
        email: $("#email").val().trim(),
        phone: $("#phone").val().trim(),
        altphone: $("#altphone").val().trim(),
        gender: $("#gender").val(),
        dob: $("#dob").val(),
        branch: $("#branch").val(),
        trainer: $("#trainer").val(),
        height: $("#height").val().trim(),
        weight: $("#weight").val().trim()
    };

    // --- Frontend Validations ---
    if (!data.name) {
        $("#name").addClass("is-invalid").siblings(".invalid-feedback").text("Name is required.");
        isValid = false;
    }
    if (!data.email) {
        $("#email").addClass("is-invalid").siblings(".invalid-feedback").text("Email is required.");
        isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        $("#email").addClass("is-invalid").siblings(".invalid-feedback").text("Enter a valid email.");
        isValid = false;
    }
    if (!data.phone) {
        $("#phone").addClass("is-invalid").siblings(".invalid-feedback").text("Phone is required.");
        isValid = false;
    } else if (!/^\d{10}$/.test(data.phone)) {
        $("#phone").addClass("is-invalid").siblings(".invalid-feedback").text("Enter a valid 10-digit phone number.");
        isValid = false;
    }
    if (data.altphone && !/^\d{10}$/.test(data.altphone)) {
        $("#altphone").addClass("is-invalid").siblings(".invalid-feedback").text("Enter a valid 10-digit alternate phone.");
        isValid = false;
    }
    if (!data.gender) {
        $("#gender").addClass("is-invalid").siblings(".invalid-feedback").text("Gender is required.");
        isValid = false;
    }
    if (!data.dob) {
        $("#dob").addClass("is-invalid").siblings(".invalid-feedback").text("DOB is required.");
        isValid = false;
    }
    if (!data.branch) {
        $("#branch").addClass("is-invalid").siblings(".invalid-feedback").text("Branch is required.");
        isValid = false;
    }
    if (!data.trainer) {
        $("#trainer").addClass("is-invalid").siblings(".invalid-feedback").text("Trainer is required.");
        isValid = false;
    }

    if (!isValid) return;

    // --- AJAX PATCH to server ---
    $.ajax({
        url: `/admin/update-client-details/${clientId}`,
        type: "PATCH",
        contentType: "application/json",
        data: JSON.stringify(data),
        success: function (res) {
            if (res.success) {
                Swal.fire({
                    title: "Success!",
                    text: res.message || "Client details updated successfully!",
                    icon: "success",
                    timer: 1200,
                    showConfirmButton: false,
                    background: "#1e1e2f",
                    color: "#ffffff",
                    iconColor: "#00d97e"
                }).then(() => {
                    window.location.href = "/admin-clients-list";
                });
            } else {
                Swal.fire({
                    title: "Error!",
                    text: res.message || "Failed to update client details.",
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
                    const $input = $(`#${field}`);
                    if ($input.length) {
                        $input.addClass("is-invalid");
                        $input.siblings(".invalid-feedback").text(response.errors[field]);
                    }
                });
            } else {
                Swal.fire({
                    title: "Server Error!",
                    text: "Unable to update client details. Please try again.",
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



    // ✅ Initial Loads
    fetchPackagesForSelect();
    fetchBranches();
    loadClientDetails();
});
$("#cancelBtn").on("click", function () {
    window.location.href = "/admin-clients-list";
});