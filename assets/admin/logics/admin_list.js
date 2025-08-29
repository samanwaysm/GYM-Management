// Fetch admins via AJAX
function loadAdmins(query = "") {
    $.ajax({
        url: "/superadmin/admin-list",   // backend API route
        type: "GET",
        data: { search: query },    // send search query
        success: function (response) {
            console.log(response);

            let rows = "";

            if (response.length === 0) {
                rows = `<tr><td colspan="5" class="text-center">No admins found.</td></tr>`;
            } else {
                response.forEach(admin => {
                    rows += `
                            <tr class="text-white">
                                <td>${admin.name}</td>
                                <td>${admin.email}</td>
                                <td>${admin.phone}</td>
                                <td>
                                    <a href="/superadmin-edit-admin/${admin._id}" class="btn btn-outline-secondary btn-icon-text"> 
                                        Edit <i class="mdi mdi-file-check btn-icon-append"></i>
                                    </a>
                                </td>
                                <td>
                                    <button type="button" class="btn btn-outline-danger btn-icon-text" 
                                            onclick="confirmDelete('${admin._id}')">Delete
                                        <i class="mdi mdi-delete btn-icon-prepend"></i> 
                                    </button>
                                </td>
                            </tr>`;
                });
            }

            $("#adminsTableBody").html(rows);
        },
        error: function () {
            $("#adminsTableBody").html(`<tr><td colspan="5" class="text-center text-danger">Error loading admins.</td></tr>`);
        }
    });
}

function confirmUnlist(adminId) {
    if (confirm("Are you sure you want to unlist this admin?")) {
        $.ajax({
            url: "/superadmin/unlist-admin/" + adminId,
            type: "POST",
            success: function (res) {
                alert(res.message || "Admin unlisted successfully!");
                loadAdmins(); // reload list
            },
            error: function () {
                alert("Error unlisting admin.");
            }
        });
    }
}


// Load all admins on page load
$(document).ready(function () {
    loadAdmins();

    // Search functionality
    $("#searchBox").on("keyup", function () {
        const query = $(this).val();
        loadAdmins(query);
    });
});

async function confirmDelete(adminId) {
    if (!confirm("⚠️ Are you sure you want to permanently delete this admin?")) return;

    try {
        const res = await fetch(`/superadmin/delete-admin/${adminId}`, {
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