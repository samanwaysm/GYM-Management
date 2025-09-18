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
                                    <a href="/superadmin-edit-admin/${admin._id}" class="btn btn-outline-secondary btn-icon-text" title="Edit"> 
                                        <i class="mdi mdi-file-check btn-icon-append"></i>
                                    </a>
                                    <button type="button" class="btn btn-outline-danger btn-icon-text" 
                                            onclick="confirmDelete('${admin._id}')" title="Delete">
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
    const { isConfirmed } = await Swal.fire({
        title: '⚠️ Delete Admin',
        text: "Are you sure you want to permanently delete this admin?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete!',
        cancelButtonText: 'Cancel',
        background: "#1e1e2f",
        color: "#ffffff",
        iconColor: "#ffc107"
    });

    if (!isConfirmed) return;

    try {
        const res = await fetch(`/superadmin/delete-admin/${adminId}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" }
        });

        const result = await res.json();

        if (result.success) {
            Swal.fire({
                title: '✅ Deleted!',
                text: "Admin has been successfully deleted.",
                icon: 'success',
                timer: 1500,
                showConfirmButton: false,
                background: "#1e1e2f",
                color: "#ffffff",
                iconColor: "#00d97e"
            }).then(() => {
                window.location.reload(); // reload page or update dynamically
            });
        } else {
            Swal.fire({
                title: '❌ Error!',
                text: result.error || "Failed to delete admin.",
                icon: 'error',
                background: "#1e1e2f",
                color: "#ffffff",
                iconColor: "#ff6b6b"
            });
        }
    } catch (err) {
        console.error("❌ Error deleting admin:", err);
    }
}
