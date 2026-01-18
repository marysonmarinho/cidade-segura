// home-script.js

let map; // Variável global para o mapa
let currentFilter = 'all'; // Definido para compatibilidade

// Inicializar Mapa e Estatísticas
document.addEventListener('DOMContentLoaded', function() {
    console.log('Página inicial carregada');
    // Verificar Firebase com retry
    const checkFirebase = () => {
        if (typeof window.auth === 'undefined' || typeof window.db === 'undefined') {
            console.log('Firebase ainda não carregado, tentando novamente em 500ms...');
            setTimeout(checkFirebase, 500); // Retry em 500ms
            return;
        }
        console.log('Firebase carregado, inicializando mapa e estatísticas');
        initMap();
        updateStats();
        setupStatsToggle(); // Adicionar toggle para estatísticas
    };
    checkFirebase(); // Iniciar verificação
});

// Inicializar Mapa
function initMap() {
    map = L.map('map').setView([-1.7528, -47.0536], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    
    console.log('Mapa inicializado com sucesso!');
    
    // Carregar e exibir marcadores existentes do Firestore
    loadExistingMarkers();
}

// Função para carregar e exibir marcadores existentes do Firestore
function loadExistingMarkers() {
    const db = window.db;
    db.collection('occurrences').onSnapshot(snapshot => {  // Listener em tempo real
        snapshot.docChanges().forEach(change => {
            if (change.type === 'added') {
                const occurrence = change.doc.data();
                const isRecentOccurrence = isRecent(occurrence);
                const icon = L.icon({
                    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34],
                    className: isRecentOccurrence ? 'pulse' : ''
                });
                
                const marker = L.marker([occurrence.lat, occurrence.lng], { icon: icon }).addTo(map);
                marker.bindPopup(`Descrição: ${occurrence.descricao}<br>Data: ${occurrence.data}<br>Hora: ${occurrence.horario}<br>Objetos: ${occurrence.objetos}`).openPopup();
                
                console.log('Marcador carregado do Firestore:', occurrence);
            }
        });
    });
}

// Função para verificar se a ocorrência é recente
function isRecent(occurrence) {
    const occurrenceDate = new Date(`${occurrence.data}T${occurrence.horario}`);
    const now = new Date();
    const diff = now - occurrenceDate;
    return diff < 24 * 60 * 60 * 1000;
}

// Atualizar Estatísticas com Gráficos (carregando do Firestore) - Dados gerais sem filtros
function updateStats() {
    console.log('Iniciando updateStats');
    const db = window.db;
    db.collection('occurrences').get().then(snapshot => {
        const occurrences = [];
        snapshot.forEach(doc => occurrences.push(doc.data()));
        
        console.log('Total de ocorrências no Firestore:', occurrences.length);
        
        // Sem filtros para dados gerais
        const filteredOccurrences = occurrences;
        
        // Destruir gráficos existentes nos canvas antes de criar novos
        const canvasIds = ['chart-bairro', 'chart-modalidade', 'chart-objetos', 'chart-crimes', 'chart-horarios'];
        canvasIds.forEach(id => {
            const canvas = document.getElementById(id);
            if (canvas) {
                const existingChart = Chart.getChart(canvas);
                if (existingChart) {
                    existingChart.destroy();
                    console.log('Gráfico destruído para canvas:', id);
                }
            } else {
                console.error('Canvas não encontrado:', id);
            }
        });
        
        const barColors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'];
        const pieColors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#C9CBCF'];
        
        // Sempre criar gráficos, mesmo vazios
        console.log('Criando gráficos (sempre, mesmo vazios)');
        
        // Gráfico de Bairro (sempre)
        const bairrosCount = {};
        filteredOccurrences.forEach(o => { bairrosCount[o.bairro] = (bairrosCount[o.bairro] || 0) + 1; });
        const bairroLabels = Object.keys(bairrosCount).length > 0 ? Object.keys(bairrosCount) : ['Nenhum Bairro'];
        const bairroData = Object.keys(bairrosCount).length > 0 ? Object.values(bairrosCount) : [0];
        new Chart(document.getElementById('chart-bairro'), { type: 'bar', data: { labels: bairroLabels, datasets: [{ label: 'Ocorrências por Bairro', data: bairroData, backgroundColor: barColors.slice(0, bairroLabels.length), borderColor: barColors.slice(0, bairroLabels.length).map(color => color.replace('0.2', '1')), borderWidth: 1 }] }, options: { scales: { y: { beginAtZero: true } } } });
        console.log('Gráfico de bairro criado');
        
        // Gráfico de Modalidade (sempre)
        const tiposCount = {};
        filteredOccurrences.forEach(o => { tiposCount[o.tipoCrime] = (tiposCount[o.tipoCrime] || 0) + 1; });
        const modalidadeLabels = Object.keys(tiposCount).length > 0 ? Object.keys(tiposCount) : ['Nenhum Crime'];
        const modalidadeData = Object.keys(tiposCount).length > 0 ? Object.values(tiposCount) : [0];
        new Chart(document.getElementById('chart-modalidade'), { type: 'pie', data: { labels: modalidadeLabels, datasets: [{ label: 'Total por Modalidade', data: modalidadeData, backgroundColor: pieColors.slice(0, modalidadeLabels.length), borderColor: '#fff', borderWidth: 2 }] } });
        console.log('Gráfico de modalidade criado');
        
        // Gráfico de Objetos (sempre)
        const objetosCount = {};
        filteredOccurrences.forEach(o => { o.objetos.split(',').forEach(obj => { objetosCount[obj.trim()] = (objetosCount[obj.trim()] || 0) + 1; }); });
        const objetoLabels = Object.keys(objetosCount).length > 0 ? Object.keys(objetosCount) : ['Nenhum Objeto'];
        const objetoData = Object.keys(objetosCount).length > 0 ? Object.values(objetosCount) : [0];
        new Chart(document.getElementById('chart-objetos'), { type: 'bar', data: { labels: objetoLabels, datasets: [{ label: 'Objetos Roubados', data: objetoData, backgroundColor: barColors.slice(0, objetoLabels.length), borderColor: barColors.slice(0, objetoLabels.length).map(color => color.replace('0.2', '1')), borderWidth: 1 }] }, options: { scales: { y: { beginAtZero: true } } } });
        console.log('Gráfico de objetos criado');
        
        // Gráfico de Crimes (sempre)
        const crimesCount = {};
        filteredOccurrences.forEach(o => { crimesCount[o.tipoCrime] = (crimesCount[o.tipoCrime] || 0) + 1; });
        const crimeLabels = Object.keys(crimesCount).length > 0 ? Object.keys(crimesCount) : ['Nenhum Crime'];
        const crimeData = Object.keys(crimesCount).length > 0 ? Object.values(crimesCount) : [0];
        new Chart(document.getElementById('chart-crimes'), { type: 'bar', data: { labels: crimeLabels, datasets: [{ label: 'Crimes Mais Cometidos', data: crimeData, backgroundColor: barColors.slice(0, crimeLabels.length), borderColor: barColors.slice(0, crimeLabels.length).map(color => color.replace('0.2', '1')), borderWidth: 1 }] }, options: { scales: { y: { beginAtZero: true } } } });
        console.log('Gráfico de crimes criado');
        
        // Gráfico de Horários (sempre)
        const horariosCount = {};
        filteredOccurrences.forEach(o => { horariosCount[o.horario] = (horariosCount[o.horario] || 0) + 1; });
        const horarioLabels = Object.keys(horariosCount).length > 0 ? Object.keys(horariosCount) : ['Nenhum Horário'];
        const horarioData = Object.keys(horariosCount).length > 0 ? Object.values(horariosCount) : [0];
        new Chart(document.getElementById('chart-horarios'), { type: 'line', data: { labels: horarioLabels, datasets: [{ label: 'Horários de Incidência', data: horarioData, backgroundColor: 'rgba(255, 99, 132, 0.2)', borderColor: '#FF6384', borderWidth: 2, fill: true }] }, options: { scales: { y: { beginAtZero: true } } } });
        console.log('Gráfico de horários criado');
        
        console.log('Estatísticas atualizadas com dados gerais');
    }).catch(error => {
        console.error('Erro ao carregar estatísticas:', error);
    });
}

// Função para toggle das estatísticas
function setupStatsToggle() {
    const toggleBtn = document.getElementById('toggle-stats');
    const statsPanel = document.getElementById('stats-panel');
    
    console.log('Botão toggle-stats encontrado:', toggleBtn);
    console.log('Painel stats-panel encontrado:', statsPanel);
    
    if (toggleBtn && statsPanel) {
        // Forçar exibição do painel
        statsPanel.classList.add('show');
        statsPanel.style.display = 'block'; // Forçar visibilidade
        console.log('Painel de estatísticas forçado a aparecer');
        
        toggleBtn.addEventListener('click', function(event) {
            event.preventDefault(); // Prevenir comportamento padrão se for um link
            console.log('Botão Estatística Geral clicado');
            statsPanel.classList.toggle('show');
            console.log('Classe show adicionada/removida:', statsPanel.classList.contains('show'));
            // Forçar atualização dos gráficos quando o painel abrir
            if (statsPanel.classList.contains('show')) {
                updateStats();
            }
        });
    } else {
        console.error('Botão ou painel de estatísticas não encontrado. Verifique os IDs no HTML.');
    }
}