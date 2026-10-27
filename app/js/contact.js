// Email links: open the mail app (mailto) AND copy the address,
// so contacting still works when no mail client is configured.
(function () {
  let toast;
  let hideTimer;

  function showToast(message) {
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'mail-toast';
      toast.setAttribute('role', 'status');
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    // restart the transition if already visible
    toast.classList.remove('show');
    void toast.offsetWidth;
    toast.classList.add('show');
    clearTimeout(hideTimer);
    hideTimer = setTimeout(function () { toast.classList.remove('show'); }, 4000);
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      const input = document.createElement('input');
      input.value = text;
      input.style.position = 'fixed';
      input.style.opacity = '0';
      document.body.appendChild(input);
      input.select();
      try {
        document.execCommand('copy') ? resolve() : reject();
      } catch (e) {
        reject(e);
      }
      document.body.removeChild(input);
    });
  }

  document.addEventListener('click', function (e) {
    const link = e.target.closest && e.target.closest('a[href^="mailto:"]');
    if (!link) return;
    const address = link.getAttribute('href').replace(/^mailto:/i, '').split('?')[0];
    copyText(address).then(function () {
      showToast('Adresse copiée : ' + address);
    }, function () {
      showToast('Écris-moi à ' + address);
    });
    // no preventDefault: the mailto still opens the mail app when there is one
  });
})();
