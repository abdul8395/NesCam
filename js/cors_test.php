<?php header('Access-Control-Allow-Origin: *'); ?>

<script>
  // ...

  fetch('https://trafficcamarchive.com/ws/browse/getVideoDates?cameraId=379', {
    mode: 'cors',
    credentials: 'include'
    })
    .then((response) => {
      return response.json();
    })
</script>