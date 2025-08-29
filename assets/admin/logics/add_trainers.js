$(document).ready(function () {
    // Fetch branches via AJAX
    $.ajax({
        url: '/admin/get-branches-name', // your backend API route
        type: 'GET',
        success: function (response) {
            if (response.success) {
                $('#branch').empty();
                $('#branch').append('<option class="text-white" value="">-- Select Branch --</option>');

                response.branches.forEach(branch => {
                    $('#branch').append(
                        `<option class="text-white" value="${branch._id}">${branch.name}</option>`
                    );
                });
            } else {
                $('#branch').append('<option class="text-white" value="">No branches found</option>');
            }
        },
        error: function () {
            $('#branch').append('<option class="text-white" value="">Error loading branches</option>');
        }
    });
});