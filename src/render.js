const { ipcRenderer } = require('electron/renderer');
const { writeFile } = require('fs');

// Global state
let mediaRecorder; // MediaRecorder instance to capture footage
const recordedChunks = [];

// Buttons
const videoElement = document.querySelector('video');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const videoSelectBtn = document.getElementById('videoSelectBtn');

// Start Button
startBtn.onclick = (e) => {
  mediaRecorder.start();
  startBtn.classList.add('is-danger');
  startBtn.innerText = 'Recording';
};

// Stop Button
stopBtn.onclick = (e) => {
  mediaRecorder.stop();
  startBtn.classList.remove('is-danger');
  startBtn.innerText = 'Start';
};

// Get the available video source
videoSelectBtn.onclick = async () => {
  // Send to main process
  ipcRenderer.send('select-video-sources');
};

// Saves the video file on stop
async function handleStop(e) {
  ipcRenderer.send('handle-stop');
}

// Captures all recorded chunks
function handleDataAvailable(e) {
  console.log('video data available');
  recordedChunks.push(e.data);
}

// Change the videoSource window to record
ipcRenderer.on('select-source', async (event, source) => {
  videoSelectBtn.innerText = source.name;

  const constraints = {
    audio: false,
    video: {
      mandatory: {
        chromeMediaSource: 'desktop',
        chromeMediaSourceId: source.id,
      },
    },
  };

  // Create a Stream
  const stream = await navigator.mediaDevices.getUserMedia(constraints);

  // Preview the source in a video element
  videoElement.srcObject = stream;
  videoElement.play();

  // Create the media recorder
  const options = { mimeType: 'video/webm; codecs=vp9' };
  mediaRecorder = new MediaRecorder(stream, options);

  // Register Event handlers
  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.onstop = handleStop;

  // Updates the UI
});

// Save file
ipcRenderer.on('save-file', async (event, filePath) => {
  const blob = new Blob(recordedChunks, {
    type: 'video/webm; codecs=vp9',
  });

  const buffer = Buffer.from(await blob.arrayBuffer());

  if (filePath) {
    writeFile(filePath, buffer, () => console.log('video saved successfully!'));
  }
});
