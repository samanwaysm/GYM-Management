document.addEventListener("DOMContentLoaded", function () {
    const pathParts = window.location.pathname.split("/");
    const branchId = pathParts[pathParts.length - 1]; // last part = id

    // ✅ Load admin data
    fetch(`/admin/get-branch/${branchId}`)
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                document.getElementById("name").value = data.branch.name;
                document.getElementById("phone").value = data.branch.phone;
                document.getElementById("address").value = data.branch.location.address;
                document.getElementById("city").value = data.branch.location.city;
                document.getElementById("state").value = data.branch.location.state;
                document.getElementById("pincode").value = data.branch.location.pincode;
                document.getElementById("lat").value = data.branch.geo.lat;
                document.getElementById("lng").value = data.branch.geo.lng;
            }
        })
        .catch(err => console.error("❌ Error fetching admin:", err));

    // ✅ Handle form submit (AJAX)
    document.getElementById("editBranchForm").addEventListener("submit", async function (e) {
        e.preventDefault();

        const updatedData = {
            name: document.getElementById("name").value,
            phone: document.getElementById("phone").value,
            address: document.getElementById("address").value,
            city: document.getElementById("city").value,
            state: document.getElementById("state").value,
            pincode: document.getElementById("pincode").value,
            lat: document.getElementById("lat").value,
            lng: document.getElementById("lng").value
        };

        try {
            const res = await fetch(`/admin/update-branch/${branchId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedData)
            });

            const result = await res.json();

            if (result.success) {
                // ✅ Redirect after success
                window.location.href = "/admin-branches-list";
            } else {
                alert(result.error || "Failed to update branch");
            }
        } catch (err) {
            console.error("❌ Error updating admin:", err);
        }
    });
});