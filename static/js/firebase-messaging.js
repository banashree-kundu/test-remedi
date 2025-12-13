import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getMessaging, getToken } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging.js";

async function fetchFirebaseConfig() {
  const response = await fetch('/api/get_firebase_config');
  return await response.json();
}
firebaseConfig = await fetchFirebaseConfig();
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);
// Register service worker ONCE
if ("serviceWorker" in navigator) {
  await navigator.serviceWorker.register("/static/js/firebase-messaging-sw.js");
}
document.addEventListener("DOMContentLoaded", async () => {
  const btn = document.getElementById("enableNotif");
  if (!btn) return;

  btn.addEventListener("click", async (e) => {
    e.preventDefault();

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return;

    const token = await getToken(messaging, {
      vapidKey: firebaseConfig.vapidKey
    });

    await fetch("/save-fcm-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token })
    });

    alert("Notifications enabled ✅");
  });
});