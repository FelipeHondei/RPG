var characters = {
    1: {},
    2: {},
    3: {},
    4: {},
    5: {}
};

// Config do supa realtime
const SUPABASE_URL = 'https://xxrimrlllwlwkzyjrwdq.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4cmltcmxsbHdsd2t6eWpyd2RxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzMDc3MjAsImV4cCI6MjA3OTg4MzcyMH0.HMBO-5V-Ef20S8Ae6lMcpaK3yGwRq8LSuAMKboD0xhM';

// Supabase client e channel
let supabaseClient = null;
let realtimeChannel = null;

// Inicia usando o cliente do supa
function initializeRealtime() {
    // Verifica se carregou
    if (typeof supabase === 'undefined') {
        console.error('Supabase library not loaded!');
        return;
    }
    
    // Create Supabase client
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    
    console.log('🎲 Inicializando Realtime...');
    
    // Subscribe to INSERT events on dice_rolls table
    realtimeChannel = supabaseClient
        .channel('dice-rolls-channel')
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'dice_rolls'
            },
            (payload) => {
                console.log('🎲 Novo dado rolado:', payload);
                const roll = payload.new;
                showDiceResultFromRealtime(roll.dice_type, roll.result);
            }
        )
        .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                console.log('✅ Realtime conectado com sucesso!');
            } else {
                console.log('⏳ Status da conexão:', status);
            }
        });
}

// Salva o resultado do dado no supa
async function saveDiceRoll(diceType, result) {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/dice_rolls`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'apikey': SUPABASE_KEY,
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({
                dice_type: diceType,
                result: result
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to save dice roll');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error saving dice roll:', error);
        throw error;
    }
}

// Mostra o resultado realtime para todos
function showDiceResultFromRealtime(diceType, result) {
    const overlay = document.getElementById('diceOverlay');
    const resultDiv = document.getElementById('diceResult');
    const resultValue = document.getElementById('diceResultValue');
    const resultTitle = resultDiv.querySelector('h3');
    
    resultTitle.textContent = `Alguém rolou um D${diceType}!`;
    resultValue.textContent = result;
    overlay.classList.add('show');
    resultDiv.classList.add('show');
    
    resultValue.style.animation = 'none';
    setTimeout(() => {
        resultValue.style.animation = 'diceRoll 0.5s ease';
    }, 10);
    
    // Auto-close (depois de 5 sec)
    setTimeout(() => {
        closeDiceResult();
    }, 5000);
}

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

// --- Função para rolar qualquer dado ---
async function rollSelectedDice(sides) {
    closeDiceSelector();

    const result = Math.floor(Math.random() * sides) + 1;
    
    try {
        // salva no supa para mostrar para todos os usuarios
        await saveDiceRoll(sides, result);
    } catch (error) {
        console.error('Error broadcasting dice roll:', error);
        // Fallback
        showDiceResultFromRealtime(sides, result);
    }
}

// --- Fecha o modal do resultado ---
function closeDiceResult() {
    document.getElementById('diceOverlay').classList.remove('show');
    document.getElementById('diceResult').classList.remove('show');
}

document.getElementById("diceSelectorOverlay").addEventListener("click", closeDiceSelector);
document.getElementById("diceOverlay").addEventListener("click", closeDiceResult);


window.addEventListener('DOMContentLoaded', async function() {
    await loadData();
    for (var i = 1; i <= 5; i++) {
        displaySavedData(i);
    }
    if (typeof switchTab === 'function') switchTab(6);
    
    // Inicia o realtime (para ver se ta tudo certo, ao clicar F12 na página e olhar console deve aparecer uma mensagem que a conexão deu certo)
    initializeRealtime();
});