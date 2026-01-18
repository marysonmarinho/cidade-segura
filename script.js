// script.js

let map; // Variável global para o mapa
let clickedLatLng; // Variável para armazenar a coordenada clicada
let currentFilter = 'all'; // Filtro atual de tipo
let startDate = null; // Data inicial
let endDate = null; // Data final
let markers = []; // Array para armazenar marcadores

// Inicializar Mapa e Estatísticas
document.addEventListener('DOMContentLoaded', function() {
    console.log('Página carregada');
    initMap();
    updateStats();
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
    
    map.on('click', function(e) {
        clickedLatLng = e.latlng;
        document.getElementById('modal').style.display = 'block';
        document.getElementById('bairro').value = 'Bairro aproximado';
        console.log('Modal aberto');
    });
}

// Função para carregar e exibir marcadores existentes do Firestore
function loadExistingMarkers() {
    const db = window.db;
    db.collection('occurrences').get().then(snapshot => {  // Buscar todos os dados
        // Limpar marcadores antigos
        markers.forEach(marker => map.removeLayer(marker));
        markers = [];
        
        snapshot.forEach(doc => {
            const occurrence = doc.data();
            if (isInDateRange(occurrence) && (currentFilter === 'all' || occurrence.tipoCrime === currentFilter)) {
                addMarkerToMap(occurrence);
            }
        });
        
        console.log('Marcadores recarregados e filtrados');
    }).catch(error => {
        console.error('Erro ao carregar marcadores:', error);
    });
}

// Função para adicionar marcador ao mapa
function addMarkerToMap(occurrence) {
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
    
    markers.push(marker);
    console.log('Marcador adicionado:', occurrence);
}

// Função para verificar se a ocorrência está no intervalo de datas
function isInDateRange(occurrence) {
    console.log('Verificando data da ocorrência:', occurrence.data, 'startDate:', startDate, 'endDate:', endDate);
    if (!startDate && !endDate) {
        console.log('Nenhum filtro de data aplicado, retornando true');
        return true;
    }
    if (!occurrence.data) {
        console.log('Ocorrência sem data, retornando false');
        return false;
    }
    
    const occurrenceDate = new Date(occurrence.data + 'T00:00:00');
    console.log('Data da ocorrência convertida:', occurrenceDate);
    
    if (startDate) {
        const start = new Date(startDate + 'T00:00:00');
        console.log('Data de início convertida:', start);
        if (occurrenceDate < start) {
            console.log('Ocorrência antes da data de início, retornando false');
            return false;
        }
    }
    
    if (endDate) {
        const end = new Date(endDate + 'T23:59:59');
        console.log('Data de fim convertida:', end);
        if (occurrenceDate > end) {
            console.log('Ocorrência depois da data de fim, retornando false');
            return false;
        }
    }
    
    console.log('Ocorrência dentro do intervalo, retornando true');
    return true;
}

// Aplicar filtro de datas
document.getElementById('apply-date-filter').addEventListener('click', function() {
    const newStartDate = document.getElementById('start-date').value;
    const newEndDate = document.getElementById('end-date').value;
    console.log('Tentando aplicar filtro - newStartDate:', newStartDate, 'newEndDate:', newEndDate);
    
    if (!newStartDate && !newEndDate) {
        alert('Selecione pelo menos uma data inicial ou final.');
        return;
    }
    
    // Só aplicar se as datas forem válidas
    if (newStartDate && isNaN(new Date(newStartDate).getTime())) {
        alert('Data inicial inválida.');
        return;
    }
    if (newEndDate && isNaN(new Date(newEndDate).getTime())) {
        alert('Data final inválida.');
        return;
    }
    
    startDate = newStartDate;
    endDate = newEndDate;
    console.log('Filtro aplicado - startDate:', startDate, 'endDate:', endDate);
    loadExistingMarkers();
    updateStats();
});

// Função para verificar se a ocorrência é recente
function isRecent(occurrence) {
    const occurrenceDate = new Date(`${occurrence.data}T${occurrence.horario}`);
    const now = new Date();
    const diff = now - occurrenceDate;
    return diff < 24 * 60 * 60 * 1000;
}

// Gerenciar Formulário de Ocorrência
document.getElementById('occurrence-form').addEventListener('submit', function(e) {
    e.preventDefault();
    console.log('Formulário submetido');
    if (!clickedLatLng) {
        alert('Selecione um ponto no mapa primeiro!');
        return;
    }
    
    const occurrence = {
        data: document.getElementById('data').value,
        horario: document.getElementById('horario').value,
        bairro: document.getElementById('bairro').value,
        tipoCrime: document.getElementById('tipo-crime').value,
        objetos: document.getElementById('objetos').value,
        descricao: document.getElementById('descricao').value,
        lat: clickedLatLng.lat,
        lng: clickedLatLng.lng
    };
    
    const db = window.db;
    db.collection('occurrences').add(occurrence).then(() => {
        alert('Ocorrência salva!');
        document.getElementById('modal').style.display = 'none';
        
        // Adicionar marcador ao mapa se estiver no filtro
        if (isInDateRange(occurrence) && (currentFilter === 'all' || occurrence.tipoCrime === currentFilter)) {
            addMarkerToMap(occurrence);
        }
        
        console.log('Ocorrência salva no Firestore:', occurrence);
        updateStats();
    }).catch(error => {
        alert('Erro ao salvar ocorrência: ' + error.message);
    });
});

document.getElementById('close-modal').addEventListener('click', function() {
    document.getElementById('modal').style.display = 'none';
});

// Menu de Navegação
document.getElementById('menu-icon').addEventListener('click', function() {
    const navMenu = document.getElementById('nav-menu');
    navMenu.classList.toggle('show');
});

document.getElementById('enable-notifications').addEventListener('click', function() {
    alert('Permissões solicitadas! Permita localização e notificações no navegador.');
    document.getElementById('nav-menu').classList.remove('show');
});

document.getElementById('profile-link').addEventListener('click', function(e) {
    e.preventDefault();
    console.log('Perfil clicado');
    const profileModal = document.getElementById('profile-modal');
    const profileNome = document.getElementById('profile-nome');
    const profileEmail = document.getElementById('profile-email');
    const profileIdade = document.getElementById('profile-idade');
    const profileDataNascimento = document.getElementById('profile-data-nascimento');
    
    const user = window.auth.currentUser;
    if (user) {
        const db = window.db;
        db.collection('users').doc(user.uid).get().then(doc => {
            if (doc.exists) {
                const userData = doc.data();
                profileNome.textContent = userData.nome || 'Não informado';
                profileEmail.textContent = user.email || 'Não informado';
                profileIdade.textContent = userData.idade || 'Não informado';
                profileDataNascimento.textContent = userData.dataNascimento || 'Não informado';
            } else {
                profileNome.textContent = 'Não informado';
                profileEmail.textContent = user.email || 'Não informado';
                profileIdade.textContent = 'Não informado';
                profileDataNascimento.textContent = 'Não informado';
            }
        }).catch(error => {
            console.error('Erro ao buscar dados do usuário:', error);
        });
        
        profileModal.style.display = 'block';
        console.log('Modal de perfil exibido');
    } else {
        alert('Usuário não encontrado. Faça login novamente.');
        return;
    }
    
    document.getElementById('nav-menu').classList.remove('show');
});

document.getElementById('close-profile-modal').addEventListener('click', function() {
    document.getElementById('profile-modal').style.display = 'none';
});

document.getElementById('logout-link').addEventListener('click', function() {
    window.auth.signOut().then(() => {
        window.location.href = 'index.html';  // CORRIGIDO: Redirecionar para a página inicial após logout
    }).catch(error => {
        console.error('Erro ao fazer logout:', error);
    });
    document.getElementById('nav-menu').classList.remove('show');
});

// Atualizar Estatísticas com Gráficos (carregando do Firestore)
function updateStats() {
    const spinner = document.getElementById('loading-spinner');
    spinner.style.display = 'block'; // Mostrar spinner
    
    const db = window.db;
    db.collection('occurrences').get().then(snapshot => {
        const occurrences = [];
        snapshot.forEach(doc => occurrences.push(doc.data()));
        
        console.log('Total de ocorrências no Firestore:', occurrences.length);
        
        // Aplicar filtros de data e tipo
        const filteredOccurrences = occurrences.filter(o => 
            isInDateRange(o) && (currentFilter === 'all' || o.tipoCrime === currentFilter)
        );
        
        // Destruir gráficos anteriores se existirem
        if (window.chartBairro) window.chartBairro.destroy();
        if (window.chartModalidade) window.chartModalidade.destroy();
        if (window.chartObjetos) window.chartObjetos.destroy();
        if (window.chartCrimes) window.chartCrimes.destroy();
        if (window.chartHorarios) window.chartHorarios.destroy();
        
        const barColors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'];
        const pieColors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#C9CBCF'];
        
        // Sempre criar gráficos, mesmo vazios
        console.log('Criando gráficos (sempre, mesmo vazios)');
        
        // Gráfico de Bairro (sempre)
        const bairrosCount = {};
        filteredOccurrences.forEach(o => { bairrosCount[o.bairro] = (bairrosCount[o.bairro] || 0) + 1; });
        const bairroLabels = Object.keys(bairrosCount).length > 0 ? Object.keys(bairrosCount) : ['Nenhum Bairro'];
        const bairroData = Object.keys(bairrosCount).length > 0 ? Object.values(bairrosCount) : [0];
        window.chartBairro = new Chart(document.getElementById('chart-bairro'), { type: 'bar', data: { labels: bairroLabels, datasets: [{ label: 'Ocorrências por Bairro', data: bairroData, backgroundColor: barColors.slice(0, bairroLabels.length), borderColor: barColors.slice(0, bairroLabels.length).map(color => color.replace('0.2', '1')), borderWidth: 1 }] }, options: { scales: { y: { beginAtZero: true } } } });
        chartBairro.resize();
        chartBairro.update();
        chartBairro.render();
        
        // Gráfico de Modalidade (sempre)
        const tiposCount = {};
        filteredOccurrences.forEach(o => { tiposCount[o.tipoCrime] = (tiposCount[o.tipoCrime] || 0) + 1; });
        const modalidadeLabels = Object.keys(tiposCount).length > 0 ? Object.keys(tiposCount) : ['Nenhum Crime'];
        const modalidadeData = Object.keys(tiposCount).length > 0 ? Object.values(tiposCount) : [0];
        window.chartModalidade = new Chart(document.getElementById('chart-modalidade'), { type: 'pie', data: { labels: modalidadeLabels, datasets: [{ label: 'Total por Modalidade', data: modalidadeData, backgroundColor: pieColors.slice(0, modalidadeLabels.length), borderColor: '#fff', borderWidth: 2 }] } });
        chartModalidade.resize();
        chartModalidade.update();
        chartModalidade.render();
        
        // Gráfico de Objetos (sempre)
        const objetosCount = {};
        filteredOccurrences.forEach(o => { o.objetos.split(',').forEach(obj => { objetosCount[obj.trim()] = (objetosCount[obj.trim()] || 0) + 1; }); });
        const objetoLabels = Object.keys(objetosCount).length > 0 ? Object.keys(objetosCount) : ['Nenhum Objeto'];
        const objetoData = Object.keys(objetosCount).length > 0 ? Object.values(objetosCount) : [0];
        window.chartObjetos = new Chart(document.getElementById('chart-objetos'), { type: 'bar', data: { labels: objetoLabels, datasets: [{ label: 'Objetos Roubados', data: objetoData, backgroundColor: barColors.slice(0, objetoLabels.length), borderColor: barColors.slice(0, objetoLabels.length).map(color => color.replace('0.2', '1')), borderWidth: 1 }] }, options: { scales: { y: { beginAtZero: true } } } });
        chartObjetos.resize();
        chartObjetos.update();
        chartObjetos.render();
        
        // Gráfico de Crimes (sempre)
        const crimesCount = {};
        filteredOccurrences.forEach(o => { crimesCount[o.tipoCrime] = (crimesCount[o.tipoCrime] || 0) + 1; });
        const crimeLabels = Object.keys(crimesCount).length > 0 ? Object.keys(crimesCount) : ['Nenhum Crime'];
        const crimeData = Object.keys(crimesCount).length > 0 ? Object.values(crimesCount) : [0];
        window.chartCrimes = new Chart(document.getElementById('chart-crimes'), { type: 'bar', data: { labels: crimeLabels, datasets: [{ label: 'Crimes Mais Cometidos', data: crimeData, backgroundColor: barColors.slice(0, crimeLabels.length), borderColor: barColors.slice(0, crimeLabels.length).map(color => color.replace('0.2', '1')), borderWidth: 1 }] }, options: { scales: { y: { beginAtZero: true } } } });
        chartCrimes.resize();
        chartCrimes.update();
        chartCrimes.render();
        
        // Gráfico de Horários (sempre)
        const horariosCount = {};
        filteredOccurrences.forEach(o => { horariosCount[o.horario] = (horariosCount[o.horario] || 0) + 1; });
        const horarioLabels = Object.keys(horariosCount).length > 0 ? Object.keys(horariosCount) : ['Nenhum Horário'];
        const horarioData = Object.keys(horariosCount).length > 0 ? Object.values(horariosCount) : [0];
        window.chartHorarios = new Chart(document.getElementById('chart-horarios'), { type: 'line', data: { labels: horarioLabels, datasets: [{ label: 'Horários de Incidência', data: horarioData, backgroundColor: 'rgba(255, 99, 132, 0.2)', borderColor: '#FF6384', borderWidth: 2, fill: true }] }, options: { scales: { y: { beginAtZero: true } } } });
        chartHorarios.resize();
        chartHorarios.update();
        chartHorarios.render();
        
        spinner.style.display = 'none'; // Esconder spinner
        console.log('Estatísticas atualizadas com filtros sincronizados');
    }).catch(error => {
        console.error('Erro ao carregar estatísticas:', error);
        spinner.style.display = 'none'; // Esconder spinner em caso de erro
    });
}

// Filtro de estatísticas
document.getElementById('crime-filter').addEventListener('change', function() {
    currentFilter = this.value;
    loadExistingMarkers();  // Recarregar marcadores com novo filtro
    updateStats();
});

// Aplicar filtro de datas
document.getElementById('apply-date-filter').addEventListener('click', function() {
    startDate = document.getElementById('start-date').value;
    endDate = document.getElementById('end-date').value;
    loadExistingMarkers();  // Recarregar marcadores com novo filtro de data
    updateStats();
    console.log('Filtro de datas aplicado:', startDate, 'a', endDate);
});