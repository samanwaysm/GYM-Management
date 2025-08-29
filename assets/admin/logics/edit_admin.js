document.addEventListener("DOMContentLoaded", function () {
    const pathParts = window.location.pathname.split("/");
    const adminId = pathParts[pathParts.length - 1]; // last part = id

    // ✅ Load admin data
    fetch(`/superadmin/get-admin/${adminId}`)
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                document.getElementById("name").value = data.admin.name;
                document.getElementById("email").value = data.admin.email;
                document.getElementById("phone").value = data.admin.phone;
            }
        })
        .catch(err => console.error("❌ Error fetching admin:", err));

    // ✅ Handle form submit (AJAX)
    document.getElementById("editAdminForm").addEventListener("submit", async function (e) {
        e.preventDefault();

        const updatedData = {
            name: document.getElementById("name").value,
            email: document.getElementById("email").value,
            phone: document.getElementById("phone").value
        };

        try {
            const res = await fetch(`/superadmin/update-admin/${adminId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedData)
            });

            const result = await res.json();

            if (result.success) {
                // ✅ Redirect after success
                window.location.href = "/superadmin-admin-list";
            } else {
                alert(result.error || "Failed to update admin");
            }
        } catch (err) {
            console.error("❌ Error updating admin:", err);
        }
    });
}); F