// Использование
document.addEventListener('DOMContentLoaded', function() {
    trackCheckboxesSimple();
    initializeMap();
});

const osmLayer = new ol.layer.Tile({
    source: new ol.source.OSM(),
    visible: true,
   // title: 'OpenStreetMap'
});

let wmsLayers = []; // Массив для хранения всех WMS слоев

// Функция для создания WMS слоя
function createWmsLayer(layerConfig) {
    return new ol.layer.Tile({
        source: new ol.source.TileWMS({
            url: 'https://rgis.permkrai.ru/geoserver/wms',
            params: {
                'service':'WMS',
                'request':'GetMap',
                'layers': layerConfig.layerName,
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
        visible: layerConfig.checked,
        title: layerConfig.title,
        id: layerConfig.id // Сохраняем ID для идентификации
    });
}

// Функция для отслеживания чекбоксов и управления слоями
function trackCheckboxesSimple() {
    const layerConfigs = [
        { 
            id: 'wmsLayer1',
            layerName: 'les:lesnichestvoutverzhdenopolygon32640_portal',
            title: 'Лесничества',
            checked: true
        },
        { 
            id: 'wmsLayer2',
            layerName: 'geo:vodnyiobjektpolygon32640',
            title: 'Водные объекты',
            checked: true
        },
        { 
            id: 'wmsLayer3',
            layerName: 'geo:transportsetline32640',
            title: 'Транспортная сеть',
            checked: true
        },
        { 
            id: 'wmsLayer4',
            layerName: 'les:lesnayadorogapolygon32640',
            title: 'Лесные дороги',
            checked: true
        }
    ];
    
    // Создаем WMS слои
    layerConfigs.forEach(config => {
        const wmsLayer = createWmsLayer(config);
        wmsLayers.push(wmsLayer);
        
        // Находим соответствующий чекбокс
        const checkbox = document.getElementById(config.id);
        if (checkbox) {
            checkbox.checked = config.checked;
            
            // Добавляем обработчик изменения чекбокса
            checkbox.addEventListener('change', function() {
                // Обновляем видимость слоя
                wmsLayer.setVisible(this.checked);
                
                // Логируем состояние
                const states = {};
                layerConfigs.forEach(cfg => {
                    const chk = document.getElementById(cfg.id);
                    states[cfg.id] = chk ? chk.checked : 'not found';
                });
                
               // console.log(`Checkbox ${config.id} changed to: ${this.checked}`);
               // console.log('All states:', states);
               // console.log(`Layer ${config.layerName} visibility: ${this.checked}`);
            });
        } else {
            console.warn(`Checkbox with id "${config.id}" not found`);
        }
    });
    
    return layerConfigs;
}

// Инициализация карты
function initializeMap() {
    // Создание карты
    const map = new ol.Map({
        target: 'map',
        layers: [osmLayer, ...wmsLayers], // Добавляем все WMS слои
        view: new ol.View({
            center: ol.proj.fromLonLat([56.2294, 58.0103]), // Центр на Пермском крае
            zoom: 8,
            maxZoom: 18,
            minZoom: 5
        }),
    });

    // Элементы управления интерфейсом
    document.getElementById('baseLayer').addEventListener('change', function(e) {
        osmLayer.setVisible(e.target.checked);
    });

    const opacitySlider = document.getElementById('opacitySlider');
    const opacityValue = document.getElementById('opacityValue');

    opacitySlider.addEventListener('input', function() {
        const opacity = this.value / 100;
        // Применяем прозрачность ко всем WMS слоям
        wmsLayers.forEach(layer => {
            layer.setOpacity(opacity);
        });
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

    // Обработка ошибок загрузки WMS для всех слоев
    wmsLayers.forEach(layer => {
        layer.getSource().on('tileloaderror', function() {
            console.error(`Ошибка загрузки WMS-слоя: ${layer.get('title')}`);
        });

        layer.getSource().on('tileloadstart', function() {
            console.log(`Началась загрузка WMS-тайла: ${layer.get('title')}`);
        });

        layer.getSource().on('tileloadend', function() {
            console.log(`WMS-тайл успешно загружен: ${layer.get('title')}`);
        });
    });

    return map;
}