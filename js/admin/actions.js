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

