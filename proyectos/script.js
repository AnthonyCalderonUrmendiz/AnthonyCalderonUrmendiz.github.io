document.addEventListener('DOMContentLoaded', () => {
    const state = {
        notes: [],
        currentCategory: 'all',
        searchQuery: '',
        editingId: null,
        currentTheme: localStorage.getItem('notevault-theme') || 'light'
    };

    const elements = {
        notesGrid: document.getElementById('notesGrid'),
        emptyState: document.getElementById('emptyState'),
        searchInput: document.getElementById('searchInput'),
        notesCount: document.getElementById('notesCount'),
        modalOverlay: document.getElementById('modalOverlay'),
        noteModal: document.getElementById('noteModal'),
        modalTitle: document.getElementById('modalTitle'),
        noteTitle: document.getElementById('noteTitle'),
        noteCategory: document.getElementById('noteCategory'),
        noteTags: document.getElementById('noteTags'),
        noteContent: document.getElementById('noteContent'),
        modalSave: document.getElementById('modalSave'),
        modalCancel: document.getElementById('modalCancel'),
        modalClose: document.getElementById('modalClose'),
        addNoteBtn: document.getElementById('addNoteBtn'),
        emptyAddBtn: document.getElementById('emptyAddBtn'),
        sidebar: document.getElementById('sidebar'),
        overlay: document.getElementById('overlay'),
        menuToggle: document.getElementById('menuToggle'),
        closeSidebar: document.getElementById('closeSidebar'),
        toggleThemeBtn: document.getElementById('toggleThemeBtn'),
        themeLabel: document.getElementById('themeLabel'),
        categoryList: document.getElementById('categoryList'),
        countAll: document.getElementById('countAll'),
        countMatematicas: document.getElementById('countMatematicas'),
        countProgramacion: document.getElementById('countProgramacion'),
        countCiencia: document.getElementById('countCiencia'),
        countIdiomas: document.getElementById('countIdiomas'),
        countGeneral: document.getElementById('countGeneral')
    };

    loadNotes();
    applyTheme();

    function loadNotes() {
        try {
            const saved = localStorage.getItem('notevault-notes');
            state.notes = saved ? JSON.parse(saved) : [];
        } catch {
            state.notes = [];
        }
        renderNotes();
        updateCounts();
    }

    function saveNotes() {
        localStorage.setItem('notevault-notes', JSON.stringify(state.notes));
        updateCounts();
    }

    function updateCounts() {
        const counts = { all: state.notes.length, matematicas: 0, programacion: 0, ciencia: 0, idiomas: 0, general: 0 };
        state.notes.forEach(n => { if (counts[n.category] !== undefined) counts[n.category]++; });
        elements.countAll.textContent = counts.all;
        elements.countMatematicas.textContent = counts.matematicas;
        elements.countProgramacion.textContent = counts.programacion;
        elements.countCiencia.textContent = counts.ciencia;
        elements.countIdiomas.textContent = counts.idiomas;
        elements.countGeneral.textContent = counts.general;
    }

    function getFilteredNotes() {
        return state.notes.filter(note => {
            const matchCategory = state.currentCategory === 'all' || note.category === state.currentCategory;
            const query = state.searchQuery.toLowerCase();
            const matchSearch = !query
                || note.title.toLowerCase().includes(query)
                || note.content.toLowerCase().includes(query)
                || (note.tags && note.tags.some(t => t.toLowerCase().includes(query)));
            return matchCategory && matchSearch;
        });
    }

    function renderNotes() {
        const filtered = getFilteredNotes();
        elements.notesCount.textContent = `${filtered.length} nota${filtered.length !== 1 ? 's' : ''}`;

        const cards = elements.notesGrid.querySelectorAll('.note-card');

        if (filtered.length === 0) {
            cards.forEach(c => c.remove());
            elements.emptyState.style.display = 'block';
            elements.emptyState.querySelector('h3').textContent =
                state.notes.length === 0 ? 'No hay notas todavía' : 'No se encontraron notas';
            elements.emptyState.querySelector('p').textContent =
                state.notes.length === 0 ? 'Crea tu primera nota para empezar a organizar tus apuntes.' : 'Intenta con otros términos de búsqueda.';
            return;
        }

        elements.emptyState.style.display = 'none';

        const existingIds = new Set();
        cards.forEach(c => {
            const id = c.dataset.id;
            if (filtered.some(n => n.id === id)) {
                existingIds.add(id);
            } else {
                c.remove();
            }
        });

        filtered.forEach(note => {
            if (existingIds.has(note.id)) return;
            const card = createNoteCard(note);
            elements.notesGrid.appendChild(card);
        });
    }

    function createNoteCard(note) {
        const card = document.createElement('div');
        card.className = 'note-card';
        card.dataset.id = note.id;

        const date = new Date(note.updatedAt || note.createdAt);
        const dateStr = date.toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

        const categoryLabels = { matematicas: 'Matemáticas', programacion: 'Programación', ciencia: 'Ciencia', idiomas: 'Idiomas', general: 'General' };
        const catClass = `cat-${note.category}`;
        const catLabel = categoryLabels[note.category] || 'General';

        const tagsHTML = note.tags && note.tags.length > 0
            ? `<div class="note-tags">${note.tags.map(t => `<span class="note-tag">${escapeHtml(t)}</span>`).join('')}</div>`
            : '';

        card.innerHTML = `
            <span class="note-category-badge ${catClass}">${catLabel}</span>
            <h3>${escapeHtml(note.title)}</h3>
            <div class="note-preview">${escapeHtml(note.content)}</div>
            ${tagsHTML}
            <div class="note-meta">
                <span>${dateStr}</span>
                <div class="note-actions">
                    <button class="edit-btn" data-id="${note.id}" aria-label="Editar nota"><i class="fa-solid fa-pen"></i></button>
                    <button class="delete-btn" data-id="${note.id}" aria-label="Eliminar nota"><i class="fa-solid fa-trash-can"></i></button>
                </div>
            </div>
        `;

        card.addEventListener('click', (e) => {
            if (e.target.closest('.note-actions')) return;
            openEditModal(note.id);
        });

        card.querySelector('.edit-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            openEditModal(note.id);
        });

        card.querySelector('.delete-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            deleteNote(note.id);
        });

        return card;
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function openCreateModal() {
        state.editingId = null;
        elements.modalTitle.textContent = 'Nueva Nota';
        elements.noteTitle.value = '';
        elements.noteCategory.value = 'general';
        elements.noteTags.value = '';
        elements.noteContent.value = '';
        elements.modalOverlay.classList.add('active');
        setTimeout(() => elements.noteTitle.focus(), 100);
    }

    function openEditModal(id) {
        const note = state.notes.find(n => n.id === id);
        if (!note) return;
        state.editingId = id;
        elements.modalTitle.textContent = 'Editar Nota';
        elements.noteTitle.value = note.title;
        elements.noteCategory.value = note.category;
        elements.noteTags.value = (note.tags || []).join(', ');
        elements.noteContent.value = note.content;
        elements.modalOverlay.classList.add('active');
        setTimeout(() => elements.noteTitle.focus(), 100);
    }

    function closeModal() {
        elements.modalOverlay.classList.remove('active');
        state.editingId = null;
    }

    function saveNoteFromForm() {
        const title = elements.noteTitle.value.trim();
        const category = elements.noteCategory.value;
        const tags = elements.noteTags.value.split(',').map(t => t.trim()).filter(t => t);
        const content = elements.noteContent.value.trim();

        if (!title || !content) return;

        if (state.editingId) {
            const idx = state.notes.findIndex(n => n.id === state.editingId);
            if (idx !== -1) {
                state.notes[idx] = {
                    ...state.notes[idx],
                    title,
                    category,
                    tags,
                    content,
                    updatedAt: new Date().toISOString()
                };
            }
        } else {
            state.notes.push({
                id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
                title,
                category,
                tags,
                content,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
        }

        saveNotes();
        renderNotes();
        closeModal();
    }

    function deleteNote(id) {
        if (!confirm('¿Estás seguro de eliminar esta nota?')) return;
        state.notes = state.notes.filter(n => n.id !== id);
        saveNotes();
        renderNotes();
    }

    function applyTheme() {
        if (state.currentTheme === 'dark') {
            document.body.classList.add('dark');
            elements.themeLabel.textContent = 'Modo Claro';
        } else {
            document.body.classList.remove('dark');
            elements.themeLabel.textContent = 'Modo Oscuro';
        }
    }

    function toggleTheme() {
        state.currentTheme = state.currentTheme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('notevault-theme', state.currentTheme);
        applyTheme();
    }

    // Event listeners
    elements.addNoteBtn.addEventListener('click', openCreateModal);
    elements.emptyAddBtn.addEventListener('click', openCreateModal);

    elements.modalSave.addEventListener('click', saveNoteFromForm);

    elements.modalCancel.addEventListener('click', closeModal);
    elements.modalClose.addEventListener('click', closeModal);
    elements.modalOverlay.addEventListener('click', (e) => {
        if (e.target === elements.modalOverlay) closeModal();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });

    elements.noteContent.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            saveNoteFromForm();
        }
    });

    let searchTimeout;
    elements.searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            state.searchQuery = elements.searchInput.value;
            renderNotes();
        }, 250);
    });

    elements.categoryList.addEventListener('click', (e) => {
        const item = e.target.closest('.category-item');
        if (!item) return;
        elements.categoryList.querySelectorAll('.category-item').forEach(el => el.classList.remove('active'));
        item.classList.add('active');
        state.currentCategory = item.dataset.category;
        renderNotes();
    });

    elements.menuToggle.addEventListener('click', () => {
        elements.sidebar.classList.add('open');
        elements.overlay.classList.add('active');
    });

    elements.closeSidebar.addEventListener('click', closeSidebar);
    elements.overlay.addEventListener('click', closeSidebar);

    function closeSidebar() {
        elements.sidebar.classList.remove('open');
        elements.overlay.classList.remove('active');
    }

    elements.toggleThemeBtn.addEventListener('click', toggleTheme);
});
