function fetchVideoList() {
    var videoList = $('#videoList');

    $.get('api/videos/list', function (result) {
        console.log(result);
        videoList.empty();
        for (var i = 0; i < result.length; i++) {
            var videoItem = $('<li class="list-group-item" fileName="' + result[i].title + '"></li>').text(result[i].title);
            videoItem.on('click', streamVideo);
            videoList.append(videoItem);
        }
    });
}

function uploadVideos() {
    var files = $('#fileInput')[0].files; // Get the selected files

    if (files.length > 0) {

        var formData = new FormData();
        for (var i = 0; i < files.length; i++) {
            formData.append('videoFiles', files[i]); // Append each file to the FormData object
        }

        $.ajax({
            url: 'api/videos/upload', // Replace with your server-side script
            type: 'POST',
            data: formData,
            processData: false, // Important: Don't process the data
            contentType: false, // Important: Don't set content type
            success: function (response) {
                console.log('Upload successful:', response);
                $('#fileInput').val(null); // clear the upload control
                // switch to the list tab
                switchToTab('list-tab');
                fetchVideoList();
            },
            error: function (jqXHR, textStatus, errorThrown) {
                console.log(textStatus);
                console.log(errorThrown);
                console.error('Upload failed:', textStatus, errorThrown);
                // Handle error
            }
        });
    } else {
        alert('Please select files to upload.');
    }
}

function switchToTab(tabName) {
    // Get the tab trigger element
    var uploadTab = document.querySelector('#' + tabName);

    // Create a new Bootstrap Tab instance
    var tab = new bootstrap.Tab(uploadTab);

    // Show the tab
    tab.show();
}

function streamVideo() {

    var fileName = $(this).attr('fileName');
    console.log(fileName);
    const videoPlayer = document.getElementById('videoPlayer');
    const videoSource = document.getElementById('videoSource');
    videoSource.src = `api/videos/stream/${fileName}.mp4`;
    //videoSource.src = `api/videos/chunk/${fileName}.mp4`;
    videoPlayer.load();
    videoPlayer.play();
}

$(function () {
    fetchVideoList();

    $('#uploadButton').off('click') // avoid triggering the click twice
        .on('click', uploadVideos);
});