document.addEventListener("DOMContentLoaded", () => {
    fetchPackages();

    // Handle add form submit
    document.getElementById("addPackageForm").addEventListener("submit", function (e) {
        e.preventDefault();
        addPackage();
    });

    // Handle edit form submit
    document.getElementById("editPackageForm").addEventListener("submit", function(e) {
        e.preventDefault();
        updatePackage();
    });
});

// Helper to reset all server-side errors
function resetErrors(formId) {
    const form = document.getElementById(formId);
    form.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
}

// Fetch & display packages
function fetchPackages() {
    fetch("/admin/package-list")
        .then(res => res.json())
        .then(data => {
            const tbody = document.querySelector("#packageBody");
            tbody.innerHTML = "";
            const packageList = data.data || data.packages || [];
            packageList.forEach(pkg => {
                tbody.innerHTML += `
                <tr class="text-white">
                    <td>${pkg.packageType}</td>
                    <td>${pkg.durationInDays}</td>
                    <td>${pkg.price}</td>
                    <td>
                        <button type="button" class="btn btn-outline-secondary btn-icon-text" 
                            onclick='openEditModal("${pkg._id}")' title="Edit">
                            <i class="mdi mdi-file-check btn-icon-append"></i>
                        </button>
                        <button type="button" class="btn btn-outline-danger btn-icon-text" 
                            onclick="confirmDelete('${pkg._id}')" title="Delete">
                            <i class="mdi mdi-delete btn-icon-prepend"></i>
                        </button>
                    </td>
                </tr>`;
            });
        })
        .catch(err => console.error(err));
}

// Add new package
function addPackage() {
    resetErrors('addPackageForm');

    const packageType = document.getElementById("packageType").value.trim();
    const durationInDays = document.getElementById("durationInDays").value.trim();
    const price = document.getElementById("price").value.trim();

    let valid = true;

    if (!packageType) {
        document.getElementById("packageType").classList.add("is-invalid");
        valid = false;
    }
    if (!durationInDays || durationInDays < 1) {
        document.getElementById("durationInDays").classList.add("is-invalid");
        valid = false;
    }
    if (!price || price < 0) {
        document.getElementById("price").classList.add("is-invalid");
        valid = false;
    }

    if (!valid) return;

    fetch("/admin/add-packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageType, durationInDays, price })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            $('#addPackageModal').modal('hide');
            Swal.fire({
                title: "Success!",
                text: data.message,
                icon: "success",
                timer: 1000,
                showConfirmButton: false
            }).then(() => {
                document.getElementById("addPackageForm").reset();
                document.getElementById("addPackageForm").classList.remove("was-validated");
                fetchPackages();
            });
        } else {
            // Show server-side validation errors
            if (data.field) {
                document.getElementById(data.field).classList.add("is-invalid");
                document.getElementById(data.field + "Error").textContent = data.message;
            }
        }
    })
    .catch(err => console.error(err));
}

// Open edit modal
function openEditModal(id) {
    resetErrors('editPackageForm');

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
                alert(data.message || "Package not found");
            }
        });
}

// Update package
function updatePackage() {
    resetErrors('editPackageForm');

    const id = document.getElementById("editPackageId").value;
    const packageType = document.getElementById("editPackageType").value.trim();
    const durationInDays = document.getElementById("editDurationInDays").value.trim();
    const price = document.getElementById("editPrice").value.trim();

    let valid = true;

    if (!packageType) {
        document.getElementById("editPackageType").classList.add("is-invalid");
        valid = false;
    }
    if (!durationInDays || durationInDays < 1) {
        document.getElementById("editDurationInDays").classList.add("is-invalid");
        valid = false;
    }
    if (!price || price < 0) {
        document.getElementById("editPrice").classList.add("is-invalid");
        valid = false;
    }

    if (!valid) return;

    fetch(`/admin/update-package/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageType, durationInDays, price })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            $('#editPackageModal').modal('hide');
            Swal.fire({
                title: 'Updated!',
                text: 'Package updated successfully.',
                icon: 'success',
                timer: 1000,
                showConfirmButton: false
            });
            fetchPackages();
        } else if (data.field) {
            document.getElementById(data.field).classList.add("is-invalid");
            document.getElementById(data.field + "Error").textContent = data.message;
        }
    })
    .catch(err => console.error(err));
}

// Delete package (keep as is, optional SweetAlert can be removed)
function confirmDelete(id) {
    Swal.fire({
        title: 'Are you sure?',
        text: "This package will be permanently deleted!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.isConfirmed) {
            deletePackage(id);
        }
    });
}

function deletePackage(id) {
    fetch(`/admin/delete-package/${id}`, { method: "DELETE" })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                Swal.fire({
                    title: 'Deleted!',
                    text: 'The package has been deleted.',
                    icon: 'success',
                    timer: 1000,
                    showConfirmButton: false
                });
                fetchPackages();
            } else {
                Swal.fire({
                    title: 'Error!',
                    text: data.message || 'Failed to delete package.',
                    icon: 'error'
                });
            }
        })
        .catch(err => {
            console.error(err);
            Swal.fire({
                title: 'Error!',
                text: 'Something went wrong. Please try again later.',
                icon: 'error'
            });
        });
}
