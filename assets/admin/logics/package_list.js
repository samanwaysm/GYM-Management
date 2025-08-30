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
                    <td>
                        <button type="button" class="btn btn-outline-secondary btn-icon-text" 
                            onclick='openEditModal(${JSON.stringify(pkg._id)})' title="Edit">
                            <i class="mdi mdi-file-check btn-icon-append"></i>
                        </button>
                        <button type="button" class="btn btn-outline-danger btn-icon-text" 
                            onclick="confirmDelete('${pkg._id}')" title="Delete">
                            <i class="mdi mdi-delete btn-icon-prepend"></i>
                        </button>
                    </td>
                    <td></td>
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

// open edit modal with values
function openEditModal(id) {
    console.log(id);
    
    fetch(`/admin/get-package-details/${id}`)
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                const pkg = data.package;
                document.getElementById("editPackageId").value = pkg._id;
                document.getElementById("editPackageType").value = pkg.packageType;
                document.getElementById("editDurationInDays").value = pkg.durationInDays;
                document.getElementById("editPrice").value = pkg.price;
                $('#editPackageModal').modal('show');
            } else {
                Swal.fire("Error", data.message, "error");
            }
        })
        .catch(err => console.error(err));
}


// handle edit form submit
document.getElementById("editPackageForm").addEventListener("submit", function(e) {
    e.preventDefault();
    const id = document.getElementById("editPackageId").value;
    const packageType = document.getElementById("editPackageType").value.trim();
    const durationInDays = document.getElementById("editDurationInDays").value.trim();
    const price = document.getElementById("editPrice").value.trim();

    fetch(`/admin/update-package/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageType, durationInDays, price })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            Swal.fire("Updated!", data.message, "success");
            $('#editPackageModal').modal('hide');
            fetchPackages();
        } else {
            Swal.fire("Error", data.error || "Update failed", "error");
        }
    })
    .catch(err => console.error(err));
});

function confirmDelete(id) {
    Swal.fire({
        title: "Are you sure?",
        text: "This package will be permanently deleted!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, delete it!",
        cancelButtonText: "Cancel"
    }).then((result) => {
        if (result.isConfirmed) {
            deletePackage(id);
        }
    });
}

function deletePackage(id) {
    fetch(`/admin/delete-package/${id}`, {
        method: "DELETE"
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            Swal.fire("Deleted!", data.message, "success");
            fetchPackages();
        } else {
            Swal.fire("Error", data.error || "Delete failed", "error");
        }
    })
    .catch(err => console.error(err));
}
