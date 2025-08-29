document.addEventListener("DOMContentLoaded", () => {
    fetchPackages();

    // Handle form submit
    document.getElementById("addPackageForm").addEventListener("submit", function (e) {
        e.preventDefault();
        addPackage();
    });
});

// Fetch & display packages
function fetchPackages() {
    fetch("/admin/package-list")
        .then(res => res.json())
        .then(data => {
            const tbody = document.querySelector("#packageBody");
            tbody.innerHTML = "";

            // If backend sends {packages: [...]}, use data.packages
            const packageList = Array.isArray(data) ? data : data.packages;
            data.data.forEach((pkg, index) => {
                tbody.innerHTML += `
                <tr class="text-white">
                    <td>${pkg.packageType}</td>
                    <td>${pkg.durationInDays}</td>
                    <td>${pkg.price}</td>
                    <td><button class="btn btn-outline-secondary">Edit</button></td>
                    <td><button class="btn btn-outline-danger">Delete</button></td>
                </tr>
            `;
            });
        })
        .catch(err => console.error(err));
}

// Add new package
function addPackage() {
    const packageType = document.getElementById("packageType").value.trim();
    const durationInDays = document.getElementById("durationInDays").value.trim();
    const price = document.getElementById("price").value.trim();

    if (!packageType || !price || !durationInDays) {
        Swal.fire("Error", "Package Type and Price are required", "error");
        return;
    }

    fetch("/admin/add-packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageType, durationInDays, price })
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                Swal.fire("Success", data.message, "success");
                document.getElementById("addPackageForm").reset();
                $('#addPackageModal').modal('hide'); // close modal
                fetchPackages();
            } else {
                Swal.fire("Error", data.error || "Failed to add package", "error");
            }
        })
        .catch(err => console.error(err));
}