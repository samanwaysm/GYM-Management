$(document).ready(function () {
    // Fetch branches via AJAX
    $.ajax({
        url: '/admin/get-branches-name', // your backend API route
        type: 'GET',
        success: function (response) {
            if (response.success) {
                $('#branch').empty();
                $('#branch').append('<option value="">-- Select Branch --</option>');

                response.branches.forEach(branch => {
                    $('#branch').append(
                        `<option value="${branch._id}">${branch.name}</option>`
                    );
                });
            } else {
                $('#branch').append('<option value="">No branches found</option>');
            }
        },
        error: function () {
            $('#branch').append('<option value="">Error loading branches</option>');
        }
    });
});