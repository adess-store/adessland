/**
 * Edit these for your deployment.
 * Logo file: place image at adessland/images/logo.png (same folder as this file → images/)
 *
 * Instagram: leave instagramUrl empty to use the href on the <a id="instagram-link"> in index.html.
 * Only set instagramUrl below if you want JavaScript to override that href.
 *
 * Firebase: copy firebase-config.example.js → firebase-config.js (see FIREBASE.md).
 */
var ADESS = {
  instagramUrl: "https://www.instagram.com/adess.coo",
  logoSrc: "./images/logo.png",
  firestoreCollection: "waitlist",
};

(function () {
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  var ig = document.getElementById("instagram-link");
  var igUrl = ADESS && typeof ADESS.instagramUrl === "string" ? ADESS.instagramUrl.trim() : "";
  if (ig && igUrl) ig.setAttribute("href", igUrl);

  var logo = document.getElementById("site-logo");
  var wordmark = document.getElementById("site-wordmark");
  var logoSrc = (ADESS && ADESS.logoSrc) || (logo && logo.getAttribute("src")) || "";

  if (logo && wordmark) {
    if (!logoSrc) {
      logo.classList.add("logo-block__img--pending");
      wordmark.hidden = false;
    } else {
      var probe = new Image();
      probe.onload = function () {
        logo.classList.remove("logo-block__img--pending");
        wordmark.hidden = true;
      };
      probe.onerror = function () {
        logo.classList.add("logo-block__img--pending");
        wordmark.hidden = false;
      };
      probe.src = logoSrc;
    }
  }

  var firestoreDb = null;

  function isPlaceholderConfig(cfg) {
    if (!cfg || typeof cfg !== "object") return true;
    var projectId = String(cfg.projectId || "").trim();
    var apiKey = String(cfg.apiKey || "").trim();
    if (!projectId || !apiKey) return true;
    if (projectId.indexOf("YOUR_") === 0 || apiKey.indexOf("YOUR_") === 0) return true;
    return false;
  }

  function initFirestore() {
    if (firestoreDb) return firestoreDb;
    if (typeof firebase === "undefined") return null;
    var cfg = window.ADESS_FIREBASE;
    if (isPlaceholderConfig(cfg)) return null;
    try {
      if (!firebase.apps.length) {
        firebase.initializeApp(cfg);
      }
      firestoreDb = firebase.firestore();
      return firestoreDb;
    } catch (err) {
      console.error("Firebase init failed:", err);
      return null;
    }
  }

  var form = document.getElementById("subscribe-form");
  var msg = document.getElementById("form-message");
  var emailInput = document.getElementById("email");
  var submitBtn = form ? form.querySelector(".form__btn") : null;

  function setMessage(text, kind) {
    if (!msg) return;
    msg.textContent = text;
    msg.hidden = !text;
    msg.removeAttribute("data-kind");
    if (kind) msg.setAttribute("data-kind", kind);
  }

  function setSubmitting(busy) {
    if (submitBtn) {
      submitBtn.disabled = busy;
      submitBtn.setAttribute("aria-busy", busy ? "true" : "false");
    }
  }

  function isDuplicateError(err) {
    if (!err) return false;
    return err.code === "already-exists" || err.code === 6;
  }

  function firestoreErrorMessage(err) {
    if (!err) return "Something went wrong. Please try again.";
    if (err.message === "Firebase is not configured") {
      return "Sign-up is not set up yet. Please try again later.";
    }
    if (isDuplicateError(err)) return null;
    if (err.code === "permission-denied" || err.code === 7) {
      return "Could not save your email. In Firebase Console, open Firestore → Rules, publish the waitlist rules, then try again.";
    }
    if (err.code === "unavailable" || err.code === 14) {
      return "Network error. Check your connection and try again.";
    }
    return "Something went wrong. Please try again.";
  }

  function saveEmail(email) {
    var db = initFirestore();
    if (!db) {
      return Promise.reject(new Error("Firebase is not configured"));
    }
    var collection =
      ADESS && typeof ADESS.firestoreCollection === "string"
        ? ADESS.firestoreCollection.trim()
        : "waitlist";
    // .create() is not in all Firebase compat builds — .set() works (create or update)
    return db.collection(collection).doc(email).set({
      email: email,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
  }

  if (form && emailInput) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var v = (emailInput.value || "").trim().toLowerCase();
      var ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      if (!ok) {
        setMessage("Enter a valid email.", "error");
        return;
      }

      var dupKey = "adess_waitlist_" + v;
      if (sessionStorage.getItem(dupKey)) {
        setMessage("You're Already On The List.", "notice");
        emailInput.value = "";
        return;
      }

      setSubmitting(true);
      setMessage("", null);

      saveEmail(v)
        .then(function () {
          sessionStorage.setItem(dupKey, "1");
          setMessage("Thanks — we will email you at launch.", "success");
          emailInput.value = "";
        })
        .catch(function (err) {
          console.error("Firestore save failed:", err);
          if (isDuplicateError(err)) {
            setMessage("You're already on the list.", "notice");
            emailInput.value = "";
            return;
          }
          setMessage(firestoreErrorMessage(err), "error");
        })
        .finally(function () {
          setSubmitting(false);
        });
    });

    emailInput.addEventListener("input", function () {
      if (msg && !msg.hidden) setMessage("", null);
    });
  }
})();
