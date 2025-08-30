        let currentPage = 1;

        function loadBranches(page = 1, query = "") {
            $.ajax({
                url: "/admin/branch-list",  // your backend route
                type: "GET",
                data: { page: page, search: query },
                success: function (res) {
                    let rows = "";
                    if (!res.branches || res.branches.length === 0) {
                        rows = `<tr><td colspan="5" class="text-center">No Branches found.</td></tr>`;
                    } else {
                        res.branches.forEach(branch => {
                            rows += `
                            <tr class="text-white">
                                <td>${branch.name}</td>
                                <td>${branch.trainersCount}</td>
                                <td>${branch.clientsCount}</td>
                                <td>
                                    <a href="/admin-edit-branch/${branch._id}" class="btn btn-outline-secondary btn-icon-text" title="Edit"> 
                                        <i class="mdi mdi-file-check btn-icon-append"></i>
                                    </a>
                                    <button type="button" class="btn btn-outline-danger btn-icon-text" 
                                            onclick="confirmDelete('${branch._id}')" title="Delete">
                                        <i class="mdi mdi-delete btn-icon-prepend"></i> 
                                    </button>
                                </td>
                            </tr>`;
                        });
                    }
                    $("#branchesTableBody").html(rows);

                    // Build pagination
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
                    $("#branchesTableBody").html(`<tr><td colspan="5" class="text-center text-danger">Error loading branches.</td></tr>`);
                }
            });
        }

        function changePage(page) {
            currentPage = page;
            const query = $("#searchBox").val();
            loadBranches(currentPage, query);
        }

        $(document).ready(function () {
            loadBranches();

            // Search box
            $("#searchBox").on("keyup", function () {
                const query = $(this).val();
                loadBranches(1, query); // reset to page 1 on search
            });
        });

        async function confirmDelete(branchId) {
            if (!confirm("⚠️ Are you sure you want to permanently delete this Branch?")) return;

            try {
                const res = await fetch(`/admin/delete-branch/${branchId}`, {
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