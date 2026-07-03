document.addEventListener('DOMContentLoaded', () => {

    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');

    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        if (themeToggle) {
            const icon = themeToggle.querySelector('i');
            icon.className = theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
        }
    }

    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme');
            setTheme(current === 'dark' ? 'light' : 'dark');
        });
    }

    const navToggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');

    if (navToggle && navLinks) {
        navToggle.addEventListener('click', () => {
            navLinks.classList.toggle('open');
        });

        navLinks.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => navLinks.classList.remove('open'));
        });
    }

    const form = document.getElementById('contactForm');
    const submitBtn = document.getElementById('submitBtn');
    const successMsg = document.getElementById('successMsg');
    const closeSuccess = document.getElementById('closeSuccess');

    if (form) {
        const isLocal = window.location.protocol === 'file:';

        form.addEventListener('submit', function (e) {
            const nombre = document.getElementById('nombre').value.trim();
            const email = document.getElementById('email').value.trim();
            const asunto = document.getElementById('asunto').value.trim();
            const mensaje = document.getElementById('mensaje').value.trim();

            if (!nombre || !email || !asunto || !mensaje) {
                e.preventDefault();
                return;
            }

            if (isLocal) {
                e.preventDefault();
                window.location.href = 'mailto:calderonguacamaya@gmail.com?subject='
                    + encodeURIComponent(asunto)
                    + '&body=' + encodeURIComponent('De: ' + nombre + ' (' + email + ')\n\n' + mensaje);
                return;
            }

            e.preventDefault();
            submitBtn.textContent = 'Enviando...';
            submitBtn.disabled = true;

            fetch('https://formsubmit.co/ajax/calderonguacamaya@gmail.com', {
                method: 'POST',
                body: new FormData(form)
            })
            .then(r => r.json())
            .then(data => {
                if (data.success) {
                    form.reset();
                    submitBtn.textContent = 'Enviar mensaje';
                    submitBtn.disabled = false;
                    if (successMsg) successMsg.classList.add('active');
                }
            })
            .catch(() => {
                submitBtn.textContent = 'Enviar mensaje';
                submitBtn.disabled = false;
                window.location.href = 'mailto:calderonguacamaya@gmail.com?subject='
                    + encodeURIComponent(asunto)
                    + '&body=' + encodeURIComponent('De: ' + nombre + ' (' + email + ')\n\n' + mensaje);
            });
        });
    }

    if (closeSuccess && successMsg) {
        closeSuccess.addEventListener('click', () => {
            successMsg.classList.remove('active');
        });

        successMsg.addEventListener('click', (e) => {
            if (e.target === successMsg) successMsg.classList.remove('active');
        });
    }

    const navLinksAll = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section[id]');

    function updateActiveLink() {
        let current = '';
        sections.forEach(section => {
            const top = section.offsetTop - 100;
            if (window.scrollY >= top) {
                current = section.getAttribute('id');
            }
        });
        navLinksAll.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === '#' + current) {
                link.classList.add('active');
            }
        });
    }

    updateActiveLink();
    window.addEventListener('scroll', updateActiveLink);

});
