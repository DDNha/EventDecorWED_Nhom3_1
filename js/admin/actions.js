(function () {
  'use strict';

  const savedScroll = sessionStorage.getItem('adminScrollY');
  if (savedScroll !== null) {
    sessionStorage.removeItem('adminScrollY');
    requestAnimationFrame(() => window.scrollTo({ top: Number(savedScroll), behavior: 'instant' }));
  }

  function showToast(message, type) {
    let region = document.getElementById('admin-toast-region');
    if (!region) {
      region = document.createElement('div');
      region.id = 'admin-toast-region';
      region.className = 'toast-region';
      region.setAttribute('aria-live', 'polite');
      document.body.appendChild(region);
    }

    const toast = document.createElement('div');
    toast.className = `admin-toast ${type === 'error' ? 'error' : 'success'}`;
    toast.innerHTML = `<span class="toast-icon">${type === 'error' ? '!' : '✓'}</span><span></span>`;
    toast.lastElementChild.textContent = message;
    region.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 200);
    }, 3500);
  }

  function setButtonLoading(button, loading) {
    if (!button) return;
    if (loading) {
      button.dataset.originalText = button.textContent;
      button.disabled = true;
      button.classList.add('is-loading');
      button.textContent = 'Đang lưu...';
    } else {
      button.disabled = false;
      button.classList.remove('is-loading');
      button.textContent = button.dataset.originalText || 'Lưu';
    }
  }

  document.addEventListener('submit', async function (event) {
    const form = event.target.closest('form[data-admin-action]');
    if (!form) return;

    const confirmation = form.dataset.confirm;
    if (confirmation && !window.confirm(confirmation)) {
      event.preventDefault();
      return;
    }

    event.preventDefault();
    const button = form.querySelector('button[type="submit"], button:not([type])');
    setButtonLoading(button, true);

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/json'
        },
        body: new URLSearchParams(new FormData(form))
      });

      const contentType = response.headers.get('content-type') || '';
      const payload = contentType.includes('application/json')
        ? await response.json()
        : { message: await response.text() };

      if (!response.ok || payload.ok === false) {
        throw new Error(payload.message || 'Không thể thực hiện thao tác.');
      }

      showToast(payload.message || 'Đã lưu thay đổi.', 'success');
      sessionStorage.setItem('adminScrollY', String(window.scrollY));
      setTimeout(() => window.location.reload(), 650);
    } catch (error) {
      showToast(error.message || 'Có lỗi xảy ra. Vui lòng thử lại.', 'error');
      setButtonLoading(button, false);
    }
  });

  document.querySelectorAll('form.filter-bar').forEach((form) => {
    form.addEventListener('submit', () => {
      const button = form.querySelector('button[type="submit"], button:not([type])');
      if (button) {
        button.disabled = true;
        button.textContent = 'Đang lọc...';
      }
    });
  });
})();

// Biến lưu ID người dùng đang thao tác
let currentUserId = null;

// 1. Mở Modal Khóa tài khoản khẩn cấp
function openBanModal(userId) {
    currentUserId = userId;
    const modalElement = document.getElementById('banModal');
    if (modalElement) {
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
    } else {
        alert('Không tìm thấy giao diện Modal khóa tài khoản!');
    }
}

// 2. Gửi yêu cầu Khóa tài khoản về Server
async function submitBan() {
    const duration = document.getElementById('banDuration').value;
    const reason = document.getElementById('banReason').value.trim();
    
    if (!reason) {
        return alert('Vui lòng nhập lý do khóa tài khoản!');
    }

    try {
        const res = await fetch(`/admin/users/${currentUserId}/ban`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ duration, reason })
        });

        if (res.ok) {
            alert('Đã khóa tài khoản thành công!');
            location.reload();
        } else {
            alert('Có lỗi xảy ra khi thực hiện khóa tài khoản.');
        }
    } catch (err) {
        console.error('Lỗi khi khóa tài khoản:', err);
    }
}

// 3. Xóa ảnh đại diện vi phạm tiêu chuẩn
async function deleteAvatar(userId) {
    if (confirm('Bạn có chắc chắn muốn xóa ảnh đại diện này do vi phạm tiêu chuẩn cộng đồng?')) {
        try {
            const res = await fetch(`/admin/users/${userId}/avatar`, { 
                method: 'DELETE' 
            });
            if (res.ok) {
                alert('Đã xóa ảnh đại diện thành công!');
                location.reload();
            }
        } catch (err) {
            console.error('Lỗi xóa avatar:', err);
        }
    }
}

// 4. Thêm ghi chú nội bộ Admin
async function addInternalNote(userId) {
    const input = document.getElementById('newNoteInput');
    const content = input.value.trim();
    
    if (!content) {
        return alert('Vui lòng nhập nội dung ghi chú nội bộ!');
    }

    try {
        const res = await fetch(`/admin/users/${userId}/notes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content })
        });

        if (res.ok) {
            location.reload();
        }
    } catch (err) {
        console.error('Lỗi thêm ghi chú:', err);
    }
}

// 5. Đặt lại mật khẩu cho khách hàng
async function resetPassword(userId) {
    if (confirm('Tự động tạo mật khẩu mới hoặc gửi link khôi phục về email khách hàng?')) {
        try {
            const res = await fetch(`/admin/users/${userId}/reset-password`, { 
                method: 'POST' 
            });
            if (res.ok) {
                alert('Đã gửi thông tin đặt lại mật khẩu thành công!');
            }
        } catch (err) {
            console.error('Lỗi đặt lại mật khẩu:', err);
        }
    }
}

// 6. Mở khung Chat hỗ trợ trực tiếp
function openLiveChat(userId) {
    window.location.href = `/admin/chat?userId=${userId}`;
}