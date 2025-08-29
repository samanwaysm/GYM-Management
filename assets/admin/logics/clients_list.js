let currentPage = 1;

function loadClients(page = 1, query = "", branchId = "") {
    $.ajax({
        url: "/admin/clients-list",
        type: "GET",
        data: { page: page, search: query, branchId: branchId },
        success: function (res) {
            let rows = "";

            if (!res.clients || res.clients.length === 0) {
                rows = `<tr><td colspan="7" class="text-center">No Clients found.</td></tr>`;
            } else {
                res.clients.forEach(client => {
                    rows += `
                    <tr class="text-white" style="cursor: pointer;" onclick="window.location='/admin-client-details/${client.clientId}'">
                        <td>${client.name}</td>
                        <td>${client.email}</td>
                        <td>${client.phone}</td>
                        <td>${client.branch || "-"}</td>
                        <td>${client.trainer || "-"}</td>
                        <td>
                            <a href="/admin-edit-clients/${client.clientId}" class="btn btn-outline-secondary btn-icon-text"> 
                                Edit <i class="mdi mdi-file-check btn-icon-append"></i>
                            </a>
                        </td>
                        <td>
                            <button type="button" class="btn btn-outline-danger btn-icon-text" 
                                onclick="confirmDelete('${client.clientId}')">Delete
                                    <i class="mdi mdi-delete btn-icon-prepend"></i> 
                            </button>
                        </td>
                    </tr>`;
                });
            }

            $("#clientsTableBody").html(rows);

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
            $("#clientsTableBody").html(`<tr><td colspan="7" class="text-center text-danger">Error loading clients.</td></tr>`);
        }
    });
}

function changePage(page) {
    currentPage = page;
    const query = $("#searchBox").val();
    const branchId = $("#branchFilter").val();
    loadClients(currentPage, query, branchId);
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

    // Load clients initially
    loadClients();

    // Live Search
    $("#searchBox").on("keyup", function () {
        const query = $(this).val();
        const branchId = $("#branchFilter").val();
        loadClients(1, query, branchId);
    });

    // Branch filter
    $("#branchFilter").on("change", function () {
        const branchId = $(this).val();
        const query = $("#searchBox").val();
        loadClients(1, query, branchId);
    });
});

async function confirmDelete(clientId) {
    if (!confirm("⚠️ Are you sure you want to permanently delete this Trainer?")) return;

    try {
        const res = await fetch(`/admin/delete-clients/${clientId}`, {
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
