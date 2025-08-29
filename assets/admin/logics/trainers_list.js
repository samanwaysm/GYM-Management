let currentPage = 1;

function loadTrainers(page = 1, query = "", branch = "") {
    $.ajax({
        url: "/admin/trainers-list",
        type: "GET",
        data: { page: page, search: query, branch: branch },
        success: function (res) {
            let rows = "";

            if (!res.trainers || res.trainers.length === 0) {
                rows = `<tr><td colspan="7" class="text-center">No Trainers found.</td></tr>`;
            } else {
                res.trainers.forEach(trainer => {
                    rows += `
          <tr class="text-white">
            <td>${trainer.name}</td>
            <td>${trainer.email}</td>
            <td>${trainer.phone}</td>
            <td>${trainer.clientsCount}</td>
            <td>${trainer.branchName || "-"}</td>
            <td>
                <a href="/admin-edit-trainers/${trainer.trainerId}" class="btn btn-outline-secondary btn-icon-text"> 
                    Edit <i class="mdi mdi-file-check btn-icon-append"></i>
                </a>
            </td>
            <td>
                <button type="button" class="btn btn-outline-danger btn-icon-text" 
                    onclick="confirmDelete('${trainer.trainerId}')">Delete
                        <i class="mdi mdi-delete btn-icon-prepend"></i> 
                </button>
            </td>
          </tr>`;
                });
            }

            $("#trainersTableBody").html(rows);

            // Pagination
            let paginationHtml = "";
            for (let i = 1; i <= res.totalPages; i++) {
                paginationHtml += `
        <li class="page-item ${i === res.currentPage ? "active" : ""}">
          <a class="page-link" href="javascript:void(0)" onclick="changePage(${i})">${i}</a>
        </li>`;
            }
            $("#pagination").html(paginationHtml);
        },
        error: function () {
            $("#trainersTableBody").html(`<tr><td colspan="7" class="text-center text-danger">Error loading trainers.</td></tr>`);
        }
    });
}

function changePage(page) {
    currentPage = page;
    const query = $("#searchBox").val();
    const branch = $("#branchFilter").val();
    loadTrainers(currentPage, query, branch);
}

$(document).ready(function () {

    // Load branches for dropdown
    $.ajax({
        url: "/admin/get-branches-name",
        type: "GET",
        success: function (branches) {
            branches.branches.forEach(branch => {
                $("#branchFilter").append(`<option value="${branch._id}">${branch.name}</option>`);
            });
        }
    });

    loadTrainers();

    // Search handler
    $("#searchBox").on("keyup", function () {
        const query = $(this).val();
        const branch = $("#branchFilter").val();
        loadTrainers(1, query, branch);
    });

    // Branch filter handler
    $("#branchFilter").on("change", function () {
        const query = $("#searchBox").val();
        const branch = $(this).val();
        loadTrainers(1, query, branch);
    });
});

async function confirmDelete(trainerId) {
    if (!confirm("⚠️ Are you sure you want to permanently delete this Trainer?")) return;

    try {
        const res = await fetch(`/admin/delete-trainers/${trainerId}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" }
        });

        const result = await res.json();

        if (result.success) {
            alert("✅ Admin deleted successfully!");
            // Reload or remove the row dynamically
            window.location.reload();
        } else {
            alert("❌ " + (result.error || "Failed to delete admin"));
        }
    } catch (err) {
        console.error("❌ Error deleting admin:", err);
        alert("⚠️ Server error, please try again later");
    }
}
