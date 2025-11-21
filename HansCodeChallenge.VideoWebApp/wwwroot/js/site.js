(function () {
    function fetchVideoList() {
        var videoList = $('#videoList');

        $.get('api/videos/list', function (result) {
            console.log(result);
            videoList.empty();
            for (var i = 0; i < result.length; i++) {
                var videoItem = $('<li class="list-group-item" fileName="' + result[i].title + '"></li>').text(result[i].title);
                videoItem.on('click', playVideo);
                videoList.append(videoItem);
            }
        });
    }

    function setProgressBar(percent) {
        percent = percent || 0;

        if (percent === 0) { // if percent is 0, hide the progress bar
            $(".progress-wrapper").hide();
        } else if ($(".progress-wrapper").is(':hidden')) {
            $(".progress-wrapper").show();
        }

        // Update progress bar
        $("#uploadProgress").val(percent);
        // Update percentage text
        $("#uploadPercent").text(percent + "%");
    }

    function toggleUploadButton(disabled) {
        disabled = disabled || false;
        $('#uploadButton').prop('disabled', disabled);
    }

    function getSelectedFiles(fileInput) {
        return $('#' + fileInput)[0].files;
    }

    function successCallback(response) {

        // clear the upload control
        $('#fileInput').val(null);
        // enable upload button again
        toggleUploadButton();

        // let the progress bar disappear after 200ms
        setTimeout(function () {
            setProgressBar();
            // switch to the list tab
            switchToTab('list-tab');
            fetchVideoList();
        }, 500);

        showMessage('Upload is successful', 'success');
    }

    function errorHandler(jqXHR, textStatus, errorThrown) {
        var response = JSON.parse(jqXHR.responseText);

        // Safely extract the message
        var message = response?.errors?.[""]?.[0]
            || response?.title
            || "Upload failed.";


        console.error('Upload failed:', textStatus, message);
        showMessage(`Upload failed: ${message}`, 'danger');
        setProgressBar();
        toggleUploadButton();
    }

    function xhrCallback() {
        var xhr = new window.XMLHttpRequest();
        // Add the listener to track upload progress
        xhr.upload.addEventListener("progress", function (evt) {
            if (evt.lengthComputable) {
                // Calculate the uploaded percentage
                var percentComplete = Math.round((evt.loaded / evt.total) * 100);

                // Update progress bar
                setProgressBar(percentComplete);
            }
        }, false);
        return xhr;
    }

    function sendUploadRequest(formData) {
        toggleUploadButton(true);

        $.ajax({
            url: 'api/videos/upload',
            type: 'POST',
            data: formData,
            processData: false, // Important: Don't process the data
            contentType: false, // Important: Don't set content type
            xhr: xhrCallback,
            success: successCallback,
            error: errorHandler
        });
    }

    function uploadVideos() {
        // Get the selected files
        var files = getSelectedFiles('fileInput');

        if (files.length > 0) {
            var formData = new FormData();
            for (var i = 0; i < files.length; i++) {
                // Append each file to the FormData object
                formData.append('videoFiles', files[i]);
            }

            sendUploadRequest(formData);
        } else {
            showMessage('Please select files to upload.', 'danger');
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

    function playVideo() {

        var fileName = $(this).attr('fileName');

        const videoPlayer = document.getElementById('videoPlayer');
        const videoSource = document.getElementById('videoSource');
        // set the video source
        videoSource.src = `api/videos/stream/${fileName}.mp4`;
        //videoSource.src = `api/videos/chunk/${fileName}.mp4`;
        // load the video and play it
        videoPlayer.load();
        videoPlayer.play();
    }

    // type can be "success", "danger", "warning", "info"
    function showMessage(message, type = "info") {

        var $msg = $("#uploadMessage");
        console.log($msg);
        $msg.removeClass().addClass("alert alert-" + type).text(message).show();
        var timeoutSpan = type !== 'success' ? 4000 : 500;
        setTimeout(function () {
            $msg.removeClass().text(null).hide();
        }, timeoutSpan);
    }


    $(function () {
        // pause the video when switch to other tabs
        $('#videoTab button[data-bs-toggle="tab"]')
            .off('shown.bs.tab')
            .on('shown.bs.tab', function (event) {
                var activatedTab = $(event.target).data('bs-target');

                if (activatedTab !== "#list") {
                    const videoPlayer = document.getElementById('videoPlayer');
                    videoPlayer.pause();
                }
            });

        // fetch the video list when loading the page
        fetchVideoList();

        // bind the upload button click event
        $('#uploadButton').off('click') // avoid triggering the click twice
            .on('click', uploadVideos);
    });
})();