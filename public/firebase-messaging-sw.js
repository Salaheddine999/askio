/* global importScripts, firebase */
// Push notifications for chatbot owners (Firebase Cloud Messaging). The app
// registers this worker with its Firebase settings in the address, since a
// file in public/ can't read the build's environment variables.
importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js");

const params = new URL(self.location.href).searchParams;
firebase.initializeApp({
  apiKey: params.get("apiKey"),
  projectId: params.get("projectId"),
  messagingSenderId: params.get("messagingSenderId"),
  appId: params.get("appId"),
});
// Messages carry a "notification", which Firebase shows (and opens its link
// when tapped) on its own; this just needs to be set up.
firebase.messaging();
