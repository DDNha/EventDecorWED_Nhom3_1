
/* ============== GOOGLE CLIENT ID ============== */
const googleButtonElement = document.getElementById("googleBtn");
const GOOGLE_CLIENT_ID = googleButtonElement?.dataset.clientId ||
  "921639641123-44j6hefhg2iobahvm24cdi3u290rabl0.apps.googleusercontent.com";


/* ============== HIỆN / ẨN MẬT KHẨU ============== */
function togglePassword(inputId, icon) {
  const input = document.getElementById(inputId);

  if (!input) return;

  if (input.type === "password") {
    input.type = "text";
    icon.textContent = "Ẩn";
  } else {
    input.type = "password";
    icon.textContent = "Hiện";
  }
}


/* ============== KIỂM TRA EMAIL ============== */
function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}


/* ============== HIỂN THỊ THÔNG BÁO ============== */
function showMessage(type, message) {
  const errorDiv = document.getElementById("errorMsg");
  const successDiv = document.getElementById("successMsg");

  if (errorDiv) {
    errorDiv.textContent = "";
    errorDiv.style.display = "none";
  }

  if (successDiv) {
    successDiv.textContent = "";
    successDiv.style.display = "none";
  }

  const target = type === "error" ? errorDiv : successDiv;

  if (target) {
    target.textContent = message;
    target.style.display = "block";
  } else {
    alert(message);
  }
}


/* ============== ĐĂNG NHẬP ============== */
async function handleLogin(e) {
  e.preventDefault();

  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;

  if (!email || !password) {
    return showMessage("error", "Vui lòng nhập email và mật khẩu!");
  }

  if (!isValidEmail(email)) {
    return showMessage("error", "Email không hợp lệ!");
  }

  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "same-origin",
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      return showMessage("error", data.message || "Đăng nhập thất bại.");
    }

    showMessage("success", data.message || "Đăng nhập thành công!");

    // Chuyển trang sau khi backend xác nhận đăng nhập thành công
    window.location.href = data.redirect || "/";

  } catch (error) {
    console.error("Lỗi đăng nhập:", error);
    showMessage("error", "Không thể kết nối máy chủ. Vui lòng thử lại.");
  }
}


/* ============== ĐĂNG KÝ ============== */
async function handleRegister(e) {
  e.preventDefault();

  const fullName = document.getElementById("fullName").value.trim();
  const email = document.getElementById("registerEmail").value.trim();
  const password = document.getElementById("registerPassword").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  // Các trường này có thể chưa tồn tại trong giao diện hiện tại
  const usernameInput = document.getElementById("username");
  const phoneInput = document.getElementById("phone");

  const username = usernameInput ? usernameInput.value.trim() : "";
  const phone = phoneInput ? phoneInput.value.trim() : "";

  if (!fullName || !email || !password || !confirmPassword) {
    return showMessage("error", "Vui lòng điền đầy đủ thông tin!");
  }

  if (!isValidEmail(email)) {
    return showMessage("error", "Email không hợp lệ!");
  }

  // Backend hiện yêu cầu mật khẩu ít nhất 8 ký tự
  if (password.length < 8) {
    return showMessage("error", "Mật khẩu phải có ít nhất 8 ký tự!");
  }

  if (password !== confirmPassword) {
    return showMessage("error", "Mật khẩu xác nhận không khớp!");
  }

  try {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "same-origin",
      body: JSON.stringify({
        fullName,
        username,
        email,
        phone,
        password
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return showMessage("error", data.message || "Đăng ký thất bại.");
    }

    showMessage("success", data.message || "Đăng ký thành công!");

    // Đăng ký xong chuyển tới route đăng nhập của Express
    setTimeout(() => {
      window.location.href = "/loggin";
    }, 1200);

  } catch (error) {
    console.error("Lỗi đăng ký:", error);
    showMessage("error", "Không thể kết nối máy chủ. Vui lòng thử lại.");
  }
}


/* ============== LẤY LẠI MẬT KHẨU ============== */
async function handleForgotPassword(e) {
  e.preventDefault();

  const email = document.getElementById("forgotEmail").value.trim();

  if (!email) {
    return showMessage("error", "Vui lòng nhập email!");
  }

  if (!isValidEmail(email)) {
    return showMessage("error", "Email không hợp lệ!");
  }

  // Chưa gọi API vì backend gửi email đặt lại mật khẩu
  // chưa được triển khai.
  showMessage(
    "error",
    "Chức năng lấy lại mật khẩu chưa được kết nối máy chủ."
  );
}


/* ============== GOOGLE SIGN-IN ============== */
async function handleGoogleCredentialResponse(response) {
  if (!response || !response.credential) {
    return showMessage("error", "Không nhận được thông tin từ Google. Vui lòng thử lại.");
  }

  try {
    const result = await fetch("/api/auth/google", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ credential: response.credential })
    });
    const data = await result.json();

    if (!result.ok) {
      return showMessage("error", data.message || "Đăng nhập bằng Google thất bại.");
    }

    window.location.href = data.redirect || "/";
  } catch (error) {
    console.error("Lỗi đăng nhập Google:", error);
    showMessage("error", "Không thể kết nối máy chủ. Vui lòng thử lại.");
  }
}

function initGoogleSignIn() {
  if (typeof google === "undefined") {
    console.warn("Google Identity Services chưa được tải.");
    return;
  }

  const googleButton = document.getElementById("googleBtn");

  if (!googleButton) return;

  google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: handleGoogleCredentialResponse
  });

  google.accounts.id.renderButton(googleButton, {
    theme: "outline",
    size: "large",
    width: "100%",
    text: "continue_with",
    shape: "rectangular"
  });
}


/* ============== KHỞI TẠO TRANG ============== */
window.addEventListener("load", function () {
  if (document.getElementById("googleBtn")) {
    if (typeof google !== "undefined") {
      initGoogleSignIn();
    } else {
      const checkGoogle = setInterval(() => {
        if (typeof google !== "undefined") {
          clearInterval(checkGoogle);
          initGoogleSignIn();
        }
      }, 100);

      // Tránh để interval chạy mãi nếu Google không tải được
      setTimeout(() => clearInterval(checkGoogle), 10000);
    }
  }
});
