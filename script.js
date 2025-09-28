const osmLayer = new ol.layer.Tile({
    source: new ol.source.OSM(),
    visible: true,
    title: 'OpenStreetMap'
});

// WMS-слой с сервера Пермского края
// ВАЖНО: Замените 'pk:kazminsk_r-n_2023' на актуальное название слоя из GetCapabilities
const wmsLayer = new ol.layer.Tile({
    source: new ol.source.TileWMS({
        url: 'https://rgis.permkrai.ru/geoserver/wms',
        params: {
            'service':'WMS',
            'request':'GetMap',
            'layers':'geo:granicavydelov32640',
            'transparent':'true',
            'version':'1.3.0',
            'filter':'',
            'info_format':'application:json',
            'tiled':true,
            'env':'timezone:-05:00',
            'label':'[object Object]',
            'width':'512',
            'height':'512',
            'crs':'EPSG:3857',
            'bbox':'6251937.417501137,7973910.790709592,6256829.387311388,7978802.760519841'
        },
        serverType: 'geoserver'
    }),
    opacity: 0.7,
    visible: true,
    title: 'РГИС ПК'
});

// Создание карты
const map = new ol.Map({
    target: 'map',
    layers: [osmLayer, wmsLayer],
    view: new ol.View({
        center: ol.proj.fromLonLat([56.2294, 58.0103]), // Центр на Пермском крае
        zoom: 8,
        maxZoom: 18,
        minZoom: 5
    }),
    // controls: ol.control.defaults().extend([
    //     new ol.control.ScaleLine({
    //         units: 'metric'
    //     })
    // ])
});

// Элементы управления интерфейсом
document.getElementById('baseLayer').addEventListener('change', function(e) {
    osmLayer.setVisible(e.target.checked);
});

document.getElementById('wmsLayer').addEventListener('change', function(e) {
    wmsLayer.setVisible(e.target.checked);
});

const opacitySlider = document.getElementById('opacitySlider');
const opacityValue = document.getElementById('opacityValue');

opacitySlider.addEventListener('input', function() {
    const opacity = this.value / 100;
    wmsLayer.setOpacity(opacity);
    opacityValue.textContent = `${this.value}%`;
});

document.getElementById('resetView').addEventListener('click', function() {
    map.getView().setCenter(ol.proj.fromLonLat([56.2294, 58.0103]));
    map.getView().setZoom(8);
});

document.getElementById('toggleSidebar').addEventListener('click', function() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.style.display = sidebar.style.display === 'none' ? 'block' : 'none';
    
    // Обновляем размер карты после изменения видимости боковой панели
    setTimeout(() => {
        map.updateSize();
    }, 300);
});

document.getElementById('toggleFullscreen').addEventListener('click', function() {
    const mapContainer = document.querySelector('.map-container');
    
    if (!document.fullscreenElement) {
        if (mapContainer.requestFullscreen) {
            mapContainer.requestFullscreen();
        } else if (mapContainer.webkitRequestFullscreen) {
            mapContainer.webkitRequestFullscreen();
        } else if (mapContainer.msRequestFullscreen) {
            mapContainer.msRequestFullscreen();
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    }
});

// Обработчик изменения размера экрана
document.addEventListener('fullscreenchange', updateMapSize);
document.addEventListener('webkitfullscreenchange', updateMapSize);
document.addEventListener('msfullscreenchange', updateMapSize);

function updateMapSize() {
    setTimeout(() => {
        map.updateSize();
    }, 100);
}

// Отображение координат и масштаба
map.on('pointermove', function(evt) {
    if (evt.dragging) return;
    
    const coordinate = ol.proj.toLonLat(evt.coordinate);
    const zoom = map.getView().getZoom();
    const resolution = map.getView().getResolution();
    const scale = resolution ? (1 / resolution * 39.37 * 72).toFixed(0) : 'N/A';
    
    document.getElementById('coordinates').innerHTML = 
        `Координаты: ${coordinate[1].toFixed(4)}° с.ш., ${coordinate[0].toFixed(4)}° в.д. | Масштаб: 1:${scale} | Уровень зума: ${zoom.toFixed(1)}`;
});

// Попап для отображения информации при клике
const popup = new ol.Overlay({
    element: document.createElement('div'),
    positioning: 'bottom-center',
    stopEvent: false
});

popup.getElement().className = 'ol-popup';
popup.getElement().style.cssText = `
    background: white;
    padding: 10px;
    border-radius: 4px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    border: 1px solid #ccc;
    font-size: 0.9rem;
    max-width: 300px;
    display: none;
`;

map.addOverlay(popup);

map.on('click', function(evt) {
    const coordinate = ol.proj.toLonLat(evt.coordinate);
    const content = `
        <strong>Координаты точки:</strong><br>
        Широта: ${coordinate[1].toFixed(6)}°<br>
        Долгота: ${coordinate[0].toFixed(6)}°
    `;
    
    popup.getElement().innerHTML = content;
    popup.getElement().style.display = 'block';
    popup.setPosition(evt.coordinate);
    
    // Автоматически скрыть попап через 3 секунды
    setTimeout(() => {
        popup.getElement().style.display = 'none';
    }, 3000);
});

// Адаптация для мобильных устройств
if (window.innerWidth <= 768) {
    document.querySelector('.sidebar').style.display = 'none';
}

// Обработка ошибок загрузки WMS
wmsLayer.getSource().on('tileloaderror', function() {
    console.error('Ошибка загрузки WMS-слоя');
    // Можно добавить уведомление для пользователя
});

// Информация о загрузке
wmsLayer.getSource().on('tileloadstart', function() {
    console.log('Началась загрузка WMS-тайла');
});

wmsLayer.getSource().on('tileloadend', function() {
    console.log('WMS-тайл успешно загружен');
});