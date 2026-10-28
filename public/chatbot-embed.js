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
      // Opening fades and lifts the panel in; sizes change at once.
      iframe.style.transition = "opacity 0.2s ease, transform 0.28s cubic-bezier(0.2, 0.8, 0.2, 1)";
      iframe.style.overflow = "visible";
      iframe.style.background = "transparent";
      iframe.scrolling = "no";

      // Start with a fixed size for the closed state
      iframe.style.width = "62px";
      iframe.style.height = "62px";
      iframe.style.borderRadius = "31px";

      container.appendChild(iframe);

      // The open panel is exactly the widget's size, and the page draws its
      // rounded corners and soft shadow, so nothing gets cut off. On phones
      // it fills the screen. The widget is told the size, so it keeps its
      // shape from the first frame.
      function panel() {
        if (window.innerWidth < 480) {
          return { width: window.innerWidth, height: window.innerHeight, fullscreen: true };
        }
        return { width: Math.min(360, window.innerWidth - 32), height: Math.min(600, window.innerHeight - 32), fullscreen: false };
      }
      function sendSpace() {
        if (!iframe.contentWindow) return;
        var p = panel();
        iframe.contentWindow.postMessage({ type: "askioSpace", width: p.width, height: p.height, fullscreen: p.fullscreen }, frameOrigin);
      }
      var frameOpen = false;
      window.addEventListener("resize", function () {
        sendSpace();
        if (isOpen) updatePosition(currentPosition, true);
      });

      function updatePosition(position, isOpen) {
        var edge = "10px";
        if (isOpen) {
          var p = panel();
          iframe.style.width = p.width + "px";
          iframe.style.height = p.height + "px";
          iframe.style.borderRadius = p.fullscreen ? "0" : "22px";
          iframe.style.boxShadow = p.fullscreen
            ? "none"
            : "0 20px 56px -16px rgba(16, 23, 35, 0.32), 0 4px 16px rgba(16, 23, 35, 0.08)";
          edge = p.fullscreen ? "0px" : "16px";
        } else if (greetingSize) {
          // Just enough room for the greeting bubble beside the launcher.
          iframe.style.width = greetingSize.width + "px";
          iframe.style.height = greetingSize.height + "px";
          iframe.style.borderRadius = "0";
          iframe.style.boxShadow = "none";
        } else {
          iframe.style.width = "62px";
          iframe.style.height = "62px";
          iframe.style.borderRadius = "31px";
          iframe.style.boxShadow = "none";
        }

        if (position.includes("bottom")) {
          iframe.style.bottom = edge;
          iframe.style.top = "auto";
        } else {
          iframe.style.top = edge;
          iframe.style.bottom = "auto";
        }

        if (position.includes("right")) {
          iframe.style.right = edge;
          iframe.style.left = "auto";
        } else {
          iframe.style.left = edge;
          iframe.style.right = "auto";
        }

        // Opening: the panel fades in and lifts from the launcher's corner.
        if (isOpen && !frameOpen) {
          iframe.style.transformOrigin = (position.includes("bottom") ? "bottom " : "top ") + (position.includes("right") ? "right" : "left");
          iframe.style.transition = "none";
          iframe.style.opacity = "0";
          iframe.style.transform = "translateY(" + (position.includes("bottom") ? "12px" : "-12px") + ") scale(0.97)";
          void iframe.offsetWidth;
          iframe.style.transition = "opacity 0.2s ease, transform 0.28s cubic-bezier(0.2, 0.8, 0.2, 1)";
          iframe.style.opacity = "1";
          iframe.style.transform = "none";
        }
        frameOpen = isOpen;
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
