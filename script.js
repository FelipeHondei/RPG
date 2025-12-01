var characters = {
    1: {},
    2: {},
    3: {},
    4: {},
    5: {}
};

// Storage helpers: prefer API /.netlify/functions/characters, fallback to localStorage
async function storageGet(key) {
    const match = key.match(/character_(\d+)/);
    if (!match) {
        return { value: localStorage.getItem(key) };
    }

    const charNumber = match[1];
    try {
        const response = await fetch(`/.netlify/functions/characters?char=${encodeURIComponent(charNumber)}`);
        if (!response.ok) {
            return { value: localStorage.getItem(key) };
        }
        const json = await response.json();
        if (json && json.data) {
            localStorage.setItem(key, JSON.stringify(json.data));
            return { value: JSON.stringify(json.data) };
        }
        return { value: null };
    } catch (error) {
        console.warn('API error, using localStorage:', error);
        return { value: localStorage.getItem(key) };
    }
}

async function storageSet(key, value) {
    const match = key.match(/character_(\d+)/);
    if (!match) {
        localStorage.setItem(key, value);
        return;
    }

    const charNumber = parseInt(match[1], 10);
    const data = JSON.parse(value);

    localStorage.setItem(key, value);

    try {
        const response = await fetch('/.netlify/functions/characters', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ char_number: charNumber, data })
        });
        const respText = await response.text();
        let respJson = null;
        try { respJson = respText ? JSON.parse(respText) : null; } catch (e) { respJson = null; }
        if (!response.ok) {
            const errMsg = (respJson && respJson.error) ? respJson.error : ('HTTP ' + response.status);
            console.warn('Failed to save to API:', errMsg);
            throw new Error(errMsg);
        }
        return respJson || { ok: true };
    } catch (error) {
        console.warn('API error, data saved locally:', error);
        throw error;
    }
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

function saveField(input) {
    var charId = input.dataset.char;
    var field = input.dataset.field;
    var value = input.value;

    if (!characters[charId]) characters[charId] = {};
    characters[charId][field] = value;

    try {
        var btn = document.querySelector('[onclick="saveCharacterSheet(' + charId + ')"]');
        if (btn) btn.classList.add('unsaved');
    } catch (e) {
        // ignore
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

async function saveCharacterSheet(charId) {
    try {
        var inputs = document.querySelectorAll('[data-char="' + charId + '"]');
        inputs.forEach(function (input) {
            characters[charId][input.dataset.field] = input.value;
        });

        await storageSet('character_' + charId, JSON.stringify(characters[charId]));
        showSaveStatus('Ficha ' + charId + ' salva com sucesso!');
        
        displaySavedData(charId);
    } catch (error) {
        console.error('Erro ao salvar ficha:', error);
        showSaveStatus('Erro ao salvar ficha!', true);
    }
}

function displaySavedData(charId) {
    var char = characters[charId];
    var tableId = 'savedDataTable_' + charId;
    var table = document.getElementById(tableId);
    
    if (!table) return;
    
    var html = '<table class="character-data-table"><tbody>';
    var fieldsToShow = ['nome', 'conceito', 'cla', 'geracao', 'humanidade', 'fome', 'forca_vontade'];
    
    fieldsToShow.forEach(function (field) {
        var label = field.replace(/_/g, ' ').toUpperCase();
        var value = char[field] || '-';
        html += '<tr><td><strong>' + label + ':</strong></td><td>' + value + '</td></tr>';
    });
    
    html += '</tbody></table>';
    table.innerHTML = html;
}

function showSaveStatus(message, isError) {
    var status = document.getElementById('saveStatus');
    status.textContent = message || '✓ Salvo!';
    status.classList.add('show');
    if (isError) {
        status.classList.add('error');
    } else {
        status.classList.remove('error');
    }
    setTimeout(function () {
        status.classList.remove('show');
        status.classList.remove('error');
    }, 3000);
}

// --- Abre o menu de seleção de dados ---
function rollDice() {
    document.getElementById("diceSelectorOverlay").classList.add("show");
    document.getElementById("diceSelector").style.display = "block";
}

// --- Fecha o menu de seleção de dados ---
function closeDiceSelector() {
    document.getElementById("diceSelectorOverlay").classList.remove("show");
    document.getElementById("diceSelector").style.display = "none";
}

// --- Função genérica para rolar qualquer dado ---
function rollSelectedDice(sides) {
    closeDiceSelector(); // Fecha o seletor de dados

    const result = Math.floor(Math.random() * sides) + 1;

    const overlay = document.getElementById('diceOverlay');
    const resultDiv = document.getElementById('diceResult');
    const resultValue = document.getElementById('diceResultValue');

    resultValue.textContent = result;
    overlay.classList.add('show');
    resultDiv.classList.add('show');

    resultValue.style.animation = 'none';
    setTimeout(() => {
        resultValue.style.animation = 'diceRoll 0.5s ease';
    }, 10);
}

// --- Fecha o modal do resultado ---
function closeDiceResult() {
    document.getElementById('diceOverlay').classList.remove('show');
    document.getElementById('diceResult').classList.remove('show');
}

// Permite clicar fora do modal para fechar
document.getElementById("diceSelectorOverlay").addEventListener("click", closeDiceSelector);
document.getElementById("diceOverlay").addEventListener("click", closeDiceResult);


window.addEventListener('DOMContentLoaded', async function() {
    await loadData();
    for (var i = 1; i <= 5; i++) {
        displaySavedData(i);
    }
    if (typeof switchTab === 'function') switchTab(6);
});