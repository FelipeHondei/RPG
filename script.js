var characters = {
    1: {},
    2: {},
    3: {},
    4: {},
    5: {}
};

// Storage helpers: prefer `window.storage` (if provided by host), fallback to localStorage
async function storageGet(key) {
    if (window.storage && typeof window.storage.get === 'function') {
        try {
            return await window.storage.get(key);
        } catch (e) {
            return { value: localStorage.getItem(key) };
        }
    }
    return { value: localStorage.getItem(key) };
}

async function storageSet(key, value) {
    if (window.storage && typeof window.storage.set === 'function') {
        try {
            return await window.storage.set(key, value);
        } catch (e) {
            localStorage.setItem(key, value);
            return;
        }
    }
    localStorage.setItem(key, value);
}

async function loadData() {
    for (var i = 1; i <= 5; i++) {
        try {
            var result = await storageGet('character_' + i);
            if (result && result.value) {
                try {
                    characters[i] = JSON.parse(result.value);
                } catch (e) {
                    characters[i] = {};
                }
                populateForm(i);
            }
        } catch (error) {
            console.warn('Erro ao carregar character_' + i, error);
        }
    }
}

async function saveField(input) {
    var charId = input.dataset.char;
    var field = input.dataset.field;
    var value = input.value;

    characters[charId][field] = value;

    try {
        await storageSet('character_' + charId, JSON.stringify(characters[charId]));
        showSaveStatus();
    } catch (error) {
        console.error('Erro ao salvar:', error);
    }
}

function showSaveStatus() {
    var status = document.getElementById('saveStatus');
    status.classList.add('show');
    setTimeout(function () {
        status.classList.remove('show');
    }, 2000);
}

function populateForm(charId) {
    var inputs = document.querySelectorAll('[data-char="' + charId + '"]');
    inputs.forEach(function (input) {
        var field = input.dataset.field;
        if (characters[charId][field]) {
            input.value = characters[charId][field];
        }
    });
}

function switchTab(tabNumber) {
    var menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(function (item, index) {
        if (index + 1 === tabNumber) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    var forms = document.querySelectorAll('.form-section');
    forms.forEach(function (form, index) {
        if (index + 1 === tabNumber) {
            form.classList.add('active');
        } else {
            form.classList.remove('active');
        }
    });

    if (tabNumber === 6) {
        updateOverview();
    }

    if (window.innerWidth <= 768) {
        document.getElementById('sidebar').classList.remove('open');
    }
}

function updateOverview() {
    var grid = document.getElementById('overviewGrid');
    grid.innerHTML = '';

    for (var i = 1; i <= 5; i++) {
        var char = characters[i];
        var card = document.createElement('div');
        card.className = 'character-card';
        card.innerHTML = '<h3>Ficha ' + i + '</h3>' +
            '<div class="character-info">' +
            '<p><strong>Nome:</strong> <span>' + (char.nome || '-') + '</span></p>' +
            '<p><strong>Conceito:</strong> <span>' + (char.conceito || '-') + '</span></p>' +
            '<p><strong>Clã:</strong> <span>' + (char.cla || '-') + '</span></p>' +
            '<p><strong>Geração:</strong> <span>' + (char.geracao || '-') + '</span></p>' +
            '<p><strong>Humanidade:</strong> <span>' + (char.humanidade || '-') + '</span></p>' +
            '<p><strong>Força:</strong> <span>' + (char.forca || '0') + '</span></p>' +
            '<p><strong>Destreza:</strong> <span>' + (char.destreza || '0') + '</span></p>' +
            '<p><strong>Vigor:</strong> <span>' + (char.vigor || '0') + '</span></p>' +
            '</div>';
        grid.appendChild(card);
    }
}

function toggleMenu() {
    document.getElementById('sidebar').classList.toggle('open');
}

window.addEventListener('DOMContentLoaded', async function() {
    await loadData();
    // Garantir que a Visão Geral (aba 6) seja exibida ao abrir o app
    if (typeof switchTab === 'function') switchTab(6);
});