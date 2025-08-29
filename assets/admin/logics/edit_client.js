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
                    $("#name").val(client.userInfo.name);
                    $("#email").val(client.userInfo.email);
                    $("#phone").val(client.userInfo.phone);
                    $("#altphone").val(client.altphone || "");
                    $("#gender").val(client.gender || "");
                    $("#age").val(client.age || "");
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
                    if (client.membership) {
                        $("#package").val(client.packageInfo?._id || "");
                        $("#paymentMethod").val(client.membership.paymentMethod || "");
                        originalPackage = client.membership.package; // store original
                    }

                    // Show membership form ONLY if status is 'Expired'
                    if (client.membership && client.membership.status === "Expired") {
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
            package: $("#package").val(),
            paymentMethod: $("#paymentMethod").val(),
            confirmedPayment: false // default
        };

        // Only if package changed and payment is Cash
        if (originalPackage !== data.package && data.paymentMethod === "Cash") {
            if (!confirm("Payment is Cash. Confirm to auto-complete payment?")) return;
            data.confirmedPayment = true; // send confirmedPayment = true
        }

        $.ajax({
            url: `/admin/update-membership/${clientId}`,
            type: "PATCH",
            contentType: "application/json",
            data: JSON.stringify(data),
            success: function (res) {
                if (res.success) {
                    alert("Membership updated!");
                    originalPackage = data.package;
                } else alert(res.message || "Failed");
            }
        });
    });

    // --- Details form submit ---
    $("#detailsForm").on("submit", function (e) {
        e.preventDefault();

        const data = {
            name: $("#name").val(),
            email: $("#email").val(),
            phone: $("#phone").val(),
            altphone: $("#altphone").val(),
            gender: $("#gender").val(),
            age: $("#age").val(),
            branch: $("#branch").val(),
            trainer: $("#trainer").val(),
            height: $("#height").val(),
            weight: $("#weight").val()
        };

        $.ajax({
            url: `/admin/update-client-details/${clientId}`,
            type: "PATCH",
            contentType: "application/json",
            data: JSON.stringify(data),
            success: function (res) {
                if (res.success) alert("Client details updated!");
                else alert(res.message || "Failed");
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