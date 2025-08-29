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
            $('#branch').append('<option value="">Error loading branches</option>');
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

    // ✅ Step 3: Handle Edit Submit
    $("#editTrainerForm").on("submit", function (e) {
        e.preventDefault();

        const updatedTrainer = {
            name: $("#name").val(),
            email: $("#email").val(),
            phone: $("#phone").val(),
            branch: $("#branch").val()
        };

        $.ajax({
            url: `/admin/update-trainers/${trainerId}`,
            type: "PUT",
            contentType: "application/json",
            data: JSON.stringify(updatedTrainer),
            success: function (result) {
                if (result.success) {
                    alert("✅ Trainer updated successfully!");
                    window.location.href = "/admin-trainers-list";
                } else {
                    alert("❌ " + (result.error || "Failed to update trainer"));
                }
            },
            error: function () {
                alert("⚠️ Server error while updating trainer");
            }
        });
    });
});