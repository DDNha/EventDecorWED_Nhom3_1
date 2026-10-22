// ============== CẤU HÌNH GOOGLE CLIENT ID ==============
// Thay bằng Client ID thật của bạn từ Google Cloud Console
const GOOGLE_CLIENT_ID = "921639641123-44j6hefhg2iobahvm24cdi3u290rabl0.apps.googleusercontent.com";

// ============== HIỂN THỊ / ẨN MẬT KHẨU ==============
function togglePassword(inputId, icon) {
  const input = document.getElementById(inputId);
  if (input.type === "password") {
    input.type = "text";
    icon.textContent = "Ẩn";
  } else {
    input.type = "password";
    icon.textContent = "Hiện";
  }
}

// ============== VALIDATE EMAIL ==============
function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// ============== ĐĂNG NHẬP ==============
function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;
  const errorDiv = document.getElementById("errorMsg");
  const successDiv = document.getElementById("successMsg");

  errorDiv.style.display = "none";
  successDiv.style.display = "none";

  if (!email || !password) {
    errorDiv.textContent = "Vui lòng nhập đầy đủ email và mật khẩu!";
    errorDiv.style.display = "block";
    return;
  }

  if (!isValidEmail(email)) {
    errorDiv.textContent = "Email không hợp lệ!";
    errorDiv.style.display = "block";
    return;
  }

  // Gửi request lên backend (thay URL thật của bạn)
  // Ví dụ: fetch('http://localhost:8080/api/auth/login', {...})

  // Demo tạm thời (xóa khi có backend)
  console.log("Đăng nhập với:", { email, password });
  successDiv.textContent = "Đăng nhập thành công! (Demo)";
  successDiv.style.display = "block";

  // Chuyển hướng sau 1.5s
  // setTimeout(() => window.location.href = "/dashboard.html", 1500);
}

// ============== ĐĂNG KÝ ==============
function handleRegister(e) {
  e.preventDefault();
  const fullName = document.getElementById("fullName").value.trim();
  const email = document.getElementById("registerEmail").value.trim();
  const password = document.getElementById("registerPassword").value;
  const confirmPassword = document.getElementById("confirmPassword").value;
  const errorDiv = document.getElementById("errorMsg");
  const successDiv = document.getElementById("successMsg");

  errorDiv.style.display = "none";
  successDiv.style.display = "none";

  if (!fullName || !email || !password || !confirmPassword) {
    errorDiv.textContent = "Vui lòng điền đầy đủ thông tin!";
    errorDiv.style.display = "block";
    return;
  }

  if (!isValidEmail(email)) {
    errorDiv.textContent = "Email không hợp lệ!";
    errorDiv.style.display = "block";
    return;
  }

  if (password.length < 6) {
    errorDiv.textContent = "Mật khẩu phải có ít nhất 6 ký tự!";
    errorDiv.style.display = "block";
    return;
  }

  if (password !== confirmPassword) {
    errorDiv.textContent = "Mật khẩu xác nhận không khớp!";
    errorDiv.style.display = "block";
    return;
  }

  // Gửi request lên backend
  console.log("Đăng ký với:", { fullName, email, password });
  successDiv.textContent = "Đăng ký thành công! Vui lòng đăng nhập.";
  successDiv.style.display = "block";

  // setTimeout(() => window.location.href = "login.html", 2000);
}

// ============== LẤY LẠI MẬT KHẨU ==============
function handleForgotPassword(e) {
  e.preventDefault();
  const email = document.getElementById("forgotEmail").value.trim();
  const errorDiv = document.getElementById("errorMsg");
  const successDiv = document.getElementById("successMsg");

  errorDiv.style.display = "none";
  successDiv.style.display = "none";

  if (!email) {
    errorDiv.textContent = "Vui lòng nhập email!";
    errorDiv.style.display = "block";
    return;
  }

  if (!isValidEmail(email)) {
    errorDiv.textContent = "Email không hợp lệ!";
    errorDiv.style.display = "block";
    return;
  }

  // Gửi request lên backend để gửi mail reset
  console.log("Gửi link reset mật khẩu tới:", email);
  successDiv.textContent = "Đã gửi link đặt lại mật khẩu vào email của bạn (nếu email tồn tại)!";
  successDiv.style.display = "block";
}

// ============== GOOGLE SIGN-IN ==============
function handleGoogleCredentialResponse(response) {
  // response.credential là JWT token từ Google
  console.log("Google ID Token:", response.credential);

  // Gửi token này lên backend để xác thực
  // fetch('http://localhost:8080/api/auth/google', {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify({ token: response.credential })
  // })
  // .then(res => res.json())
  // .then(data => {
  //     // Lưu token, chuyển hướng...
  // });

  alert("Đăng nhập Google thành công! (Demo - kiểm tra console)");
}

// Khởi tạo Google Identity Services
function initGoogleSignIn() {
  if (typeof google === "undefined") {
    console.warn("Google Identity Services chưa load");
    return;
  }

  google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: handleGoogleCredentialResponse
  });

  // Render nút Google
  google.accounts.id.renderButton(
    document.getElementById("googleBtn"),
    {
      theme: "outline",
      size: "large",
      width: "100%",
      text: "continue_with",
      shape: "rectangular"
    }
  );
}

// Tự động khởi tạo khi trang load
window.onload = function () {
  // Chỉ init Google nếu có element
  if (document.getElementById("googleBtn")) {
    // Đợi script Google load xong
    const checkGoogle = setInterval(() => {
      if (typeof google !== "undefined") {
        clearInterval(checkGoogle);
        initGoogleSignIn();
      }
    }, 100);
  }
};
