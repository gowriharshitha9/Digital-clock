// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCk_CcjNdrbb1yNdQFaw86zq84bLMXAvE0",
  authDomain: "project-2-c075d.firebaseapp.com",
  projectId: "project-2-c075d",
  storageBucket: "project-2-c075d.firebasestorage.app",
  messagingSenderId: "66043099986",
  appId: "1:66043099986:web:1c656d750794e0b924988b",
  measurementId: "G-Y6NY82WW14"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const clockElement = document.getElementById("clock");
const dateElement = document.getElementById("date");
const toggleFormatBtn = document.getElementById("toggleFormatBtn");
const alarmTimeInput = document.getElementById("alarmTime");
const setAlarmBtn = document.getElementById("setAlarmBtn");
const alarmStatus = document.getElementById("alarmStatus");

// Create the modal element for alarm alert
const alarmModal = document.createElement('div');
alarmModal.style.position = 'fixed';
alarmModal.style.top = 0;
alarmModal.style.left = 0;
alarmModal.style.width = '100vw';
alarmModal.style.height = '100vh';
alarmModal.style.backgroundColor = 'rgba(0,0,0,0.6)';
alarmModal.style.display = 'flex';
alarmModal.style.flexDirection = 'column';
alarmModal.style.justifyContent = 'center';
alarmModal.style.alignItems = 'center';
alarmModal.style.zIndex = '9999';
alarmModal.style.color = '#fff';
alarmModal.style.fontSize = '2rem';
alarmModal.style.fontWeight = 'bold';
alarmModal.style.visibility = 'hidden';

const modalText = document.createElement('div');
modalText.textContent = '⏰ Alarm ringing!';
modalText.style.marginBottom = '20px';

const dismissBtn = document.createElement('button');
dismissBtn.textContent = 'Dismiss Alarm';
dismissBtn.style.fontSize = '1.5rem';
dismissBtn.style.padding = '10px 20px';
dismissBtn.style.borderRadius = '10px';
dismissBtn.style.border = 'none';
dismissBtn.style.cursor = 'pointer';
dismissBtn.style.backgroundColor = '#b0a9ff';
dismissBtn.style.color = '#fff';
dismissBtn.style.transition = 'background-color 0.3s ease';

dismissBtn.onmouseenter = () => dismissBtn.style.backgroundColor = '#8c7ae6';
dismissBtn.onmouseleave = () => dismissBtn.style.backgroundColor = '#b0a9ff';

dismissBtn.addEventListener('click', () => {
  stopAlarm();
  hideModal();
});

alarmModal.appendChild(modalText);
alarmModal.appendChild(dismissBtn);
document.body.appendChild(alarmModal);

// Load alarm audio (add 'alarm-sound.mp3' to your project)
const alarmAudio = new Audio('alarm-sound.mp3');

let use24HourFormat = false;
let alarmTime = null;
let alarmPlaying = false;

// Request notification permission on user interaction (one time)
function requestNotificationPermission() {
  if ("Notification" in window && Notification.permission !== "granted") {
    Notification.requestPermission();
  }
}

// Function to show modal
function showModal() {
  alarmModal.style.visibility = 'visible';
}

// Function to hide modal
function hideModal() {
  alarmModal.style.visibility = 'hidden';
}

// Function to stop alarm sound and reset status
function stopAlarm() {
  if (alarmPlaying) {
    alarmAudio.pause();
    alarmAudio.currentTime = 0;
    alarmPlaying = false;
    alarmStatus.textContent = '';
  }
}

// Update the clock display every second
function updateClock() {
  const now = new Date();

  let hours = now.getHours();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();

  let ampm = '';
  if (!use24HourFormat) {
    ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
  }

  const displayTime = [
    hours.toString().padStart(2, '0'),
    minutes.toString().padStart(2, '0'),
    seconds.toString().padStart(2, '0')
  ].join(':') + (use24HourFormat ? '' : ' ' + ampm);

  clockElement.textContent = displayTime;

  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  dateElement.textContent = now.toLocaleDateString(undefined, options);

  // Check alarm
  if (alarmTime) {
    const alarmHours = parseInt(alarmTime.split(':')[0], 10);
    const alarmMinutes = parseInt(alarmTime.split(':')[1], 10);
    if (now.getHours() === alarmHours && now.getMinutes() === alarmMinutes && seconds === 0) {
      alarmStatus.textContent = "⏰ Alarm ringing!";

      if (!alarmPlaying) {
        // Play alarm sound
        alarmAudio.play().catch(() => {
          // Autoplay might be blocked, user interaction needed
        });
        alarmPlaying = true;
      }
      
      // Show modal alert
      showModal();

      // Show notification if permission granted
      if (Notification.permission === "granted") {
        new Notification("Alarm", {
          body: `Alarm set for ${alarmTime} is ringing!`,
          icon: 'alarm-icon.png' // optional icon file
        });
      }

    } else if (alarmPlaying) {
      // Clear alarm if time passed (optional auto-stop: commented out to keep modal until user dismisses)
      // stopAlarm();
      // hideModal();
    }
  }
}

// Toggle 12/24 hour format
toggleFormatBtn.addEventListener("click", () => {
  use24HourFormat = !use24HourFormat;
  updateClock();
});

// Unlock audio and request notification permission on user interaction (click anywhere)
document.body.addEventListener('click', () => {
  alarmAudio.play().then(() => {
    alarmAudio.pause();
    alarmAudio.currentTime = 0;
  }).catch(() => {
    // Autoplay blocked, will play later on alarm time
  });
  requestNotificationPermission();
}, { once: true });

// Save alarm to Firestore
setAlarmBtn.addEventListener("click", () => {
  if (!alarmTimeInput.value) return;
  
  alarmTime = alarmTimeInput.value;

  console.log("Setting alarm time:", alarmTime);

  db.collection("alarms").doc("userAlarm").set({
    time: alarmTime,
    setAt: new Date()
  }).then(() => {
    alarmStatus.textContent = `Alarm set for ${alarmTime}`;
  }).catch((error) => {
    alarmStatus.textContent = `Error setting alarm: ${error.message}`;
  });
});

// Load alarm from Firestore on page load
db.collection("alarms").doc("userAlarm").get().then(doc => {
  if (doc.exists) {
    alarmTime = doc.data().time;
    alarmTimeInput.value = alarmTime;
    alarmStatus.textContent = `Loaded alarm set for ${alarmTime}`;
  } else {
    alarmStatus.textContent = '';
  }
}).catch(() => {
  alarmStatus.textContent = '';
});

// Start the clock
setInterval(updateClock, 1000);
updateClock();
