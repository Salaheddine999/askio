(function (window, document) {
  window.ChatbotEmbed = {
    // options.launcherStyle: "classic" or "orb" overrides the saved launcher style.
    // options.greetingBubble: true or false overrides the saved greeting bubble.
    init: function (chatbotId, origin, options) {
      options = options || {};
      console.log("Initializing chatbot with ID:", chatbotId);
      var container = document.getElementById("chatbot-container");
      if (!container) {
        console.error("Chatbot container not found");
        return;
      }

      // Remove any existing iframes
      var existingIframes = container.getElementsByTagName("iframe");
      for (var i = existingIframes.length - 1; i >= 0; i--) {
        container.removeChild(existingIframes[i]);
      }

      var iframe = document.createElement("iframe");
      iframe.src = origin + "/chatbot/" + chatbotId;
      var params = [];
      if (options.launcherStyle === "orb" || options.launcherStyle === "classic") {
        params.push("launcher=" + options.launcherStyle);
      }
      if (options.greetingBubble === true || options.greetingBubble === false) {
        params.push("greeting=" + (options.greetingBubble ? "1" : "0"));
      }
      if (params.length) iframe.src += "?" + params.join("&");
      var frameOrigin = new URL(iframe.src, window.location.href).origin;
      // Lets "Continue on Telegram" (and others) copy the visitor's question.
      iframe.allow = "clipboard-write";
      iframe.style.position = "fixed";
      iframe.style.border = "none";
      iframe.style.zIndex = "10000";
      iframe.style.transition = "all 0.3s ease-in-out";
      iframe.style.overflow = "visible";
      iframe.style.background = "transparent";
      iframe.scrolling = "no";

      // Start with a fixed size for the closed state
      iframe.style.width = "62px";
      iframe.style.height = "62px";
      iframe.style.borderRadius = "31px";

      container.appendChild(iframe);

      // The open frame: room for the widget (up to 360 x 600) and its
      // shadow, never larger than the screen. The widget is told the same
      // size, so it keeps its shape while the frame grows.
      function openSize() {
        // The frame sits 10px from the screen's edge.
        return { width: Math.min(380, window.innerWidth - 10), height: Math.min(620, window.innerHeight - 10) };
      }
      function sendSpace() {
        if (!iframe.contentWindow) return;
        iframe.contentWindow.postMessage({ type: "askioSpace", width: openSize().width, height: openSize().height }, frameOrigin);
      }
      window.addEventListener("resize", function () {
        sendSpace();
        if (isOpen) updatePosition(currentPosition, true);
      });

      function updatePosition(position, isOpen) {
        if (isOpen) {
          iframe.style.width = openSize().width + "px";
          iframe.style.height = openSize().height + "px";
          iframe.style.borderRadius = "0";
        } else if (greetingSize) {
          // Just enough room for the greeting bubble beside the launcher.
          iframe.style.width = greetingSize.width + "px";
          iframe.style.height = greetingSize.height + "px";
          iframe.style.borderRadius = "0";
        } else {
          iframe.style.width = "62px";
          iframe.style.height = "62px";
          iframe.style.borderRadius = "31px";
        }

        if (position.includes("bottom")) {
          iframe.style.bottom = "10px";
          iframe.style.top = "auto";
        } else {
          iframe.style.top = "10px";
          iframe.style.bottom = "auto";
        }

        if (position.includes("right")) {
          iframe.style.right = "10px";
          iframe.style.left = "auto";
        } else {
          iframe.style.left = "10px";
          iframe.style.right = "auto";
        }
      }

      var isOpen = false;
      var currentPosition = "bottom-right";
      var greetingSize = null;

      // The orb launcher's eyes follow the visitor's pointer across the page.
      // Positions are sent relative to the iframe, at most once per frame, and
      // only while the chat is closed.
      var pointerFrame = 0;
      var lastPointer = null;
      var forwardingPointer = false;

      function sendPointer() {
        pointerFrame = 0;
        if (!lastPointer || isOpen || !iframe.contentWindow) return;
        var rect = iframe.getBoundingClientRect();
        iframe.contentWindow.postMessage(
          { type: "askioPointer", x: lastPointer.x - rect.left, y: lastPointer.y - rect.top },
          frameOrigin
        );
      }

      function onPointerMove(e) {
        lastPointer = { x: e.clientX, y: e.clientY };
        if (!pointerFrame) pointerFrame = window.requestAnimationFrame(sendPointer);
      }

      // Touch screens have no hovering pointer: taps count as a look, and
      // scrolling points the eyes down (or up) the page.
      var touchOnly = window.matchMedia && window.matchMedia("(hover: none)").matches;
      var lastScrollY = window.scrollY;

      function onScroll() {
        var delta = window.scrollY - lastScrollY;
        lastScrollY = window.scrollY;
        if (Math.abs(delta) < 2) return;
        var rect = iframe.getBoundingClientRect();
        lastPointer = {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2 + (delta > 0 ? 320 : -320),
        };
        if (!pointerFrame) pointerFrame = window.requestAnimationFrame(sendPointer);
      }

      function startPointerForwarding() {
        if (forwardingPointer) return;
        forwardingPointer = true;
        window.addEventListener("pointermove", onPointerMove, { passive: true });
        window.addEventListener("pointerdown", onPointerMove, { passive: true });
        if (touchOnly) window.addEventListener("scroll", onScroll, { passive: true });
      }

      // Opening and closing is reported by the widget ("chatbotState" below).
      // Reaching into the frame instead only works on our own domain and
      // throws a SecurityError on every other site.

      // The page the visitor is on, so the owner can see it in Conversations.
      var lastPage = "";
      var reportingPage = false;
      function reportPage() {
        var page = window.location.origin + window.location.pathname;
        if (page === lastPage || !iframe.contentWindow) return;
        lastPage = page;
        iframe.contentWindow.postMessage({ type: "askioPage", url: page }, frameOrigin);
      }
      function startPageReporting() {
        if (reportingPage) return;
        reportingPage = true;
        reportPage();
        // Single-page sites change the address without reloading.
        window.setInterval(reportPage, 2000);
      }

      window.addEventListener("message", function (event) {
        if (event.data.type === "chatbotReady") {
          if (event.data.config.isActive === false || event.data.config.suspended === true) {
             iframe.style.display = "none";
             return;
          }
          iframe.style.display = "block"; // Ensure visible if active
          currentPosition = event.data.config.position;
          updatePosition(currentPosition, isOpen);
          if (event.source === iframe.contentWindow && event.data.config.launcherStyle === "orb") {
            startPointerForwarding();
          }
          if (event.source === iframe.contentWindow) {
            startPageReporting();
            sendSpace();
          }
        } else if (event.data.type === "chatbotState") {
          isOpen = event.data.isOpen;
          updatePosition(currentPosition, isOpen);
        } else if (event.data.type === "chatbotGreeting" && event.source === iframe.contentWindow) {
          var w = Number(event.data.width);
          var h = Number(event.data.height);
          greetingSize =
            event.data.visible && w > 0 && h > 0
              ? { width: Math.min(w, 360), height: Math.min(h, 240) }
              : null;
          updatePosition(currentPosition, isOpen);
        } else if (event.data.type === "chatbotPosition") {
          currentPosition = event.data.position;
          updatePosition(currentPosition, isOpen);
        }
      });

      iframe.onerror = function () {
        console.error("Failed to load chatbot iframe");
        container.removeChild(iframe);
      };

      iframe.onload = function () {
        console.log("Chatbot iframe loaded successfully");
      };
    },
  };
})(window, document);
