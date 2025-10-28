// Использование
document.addEventListener('DOMContentLoaded', function() {
    initializeMap();
    trackCheckboxesSimple(); // Перенесено после инициализации карты
});

// ОШИБКА: Слой osmLayer создается, но никогда не добавляется на карту
const osmLayer = new ol.layer.Tile({
    source: new ol.source.OSM(),
    visible: true,
    // title: 'OpenStreetMap'
});

let wmsLayers = []; // Массив для хранения всех WMS слоев
let map; // ОШИБКА: map не была объявлена глобально для доступа из других функций

// Функция для создания WMS слоя
function createWmsLayer(layerConfig) {
    return new ol.layer.Tile({
        source: new ol.source.TileWMS({
            url: 'https://rgis.permkrai.ru/geoserver/wms',
            params: {
                'LAYERS': layerConfig.layerName, // ОШИБКА: должно быть 'LAYERS' вместо 'layers'
                'TRANSPARENT': 'true',
                'VERSION': '1.3.0',
                'TILED': true,
                'FORMAT': 'image/png', // ОШИБКА: добавлен обязательный параметр FORMAT
                'WIDTH': 256,  // Исправлены размеры
                'HEIGHT': 256,
                'CRS': 'EPSG:3857'
                // ОШИБКА: удалены лишние параметры filter, env, label, bbox которые могут вызывать ошибки
            },
            serverType: 'geoserver'
        }),
        opacity: 0.9,
        visible: layerConfig.checked,
        title: layerConfig.title,
        id: layerConfig.id
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
            layerName: 'geo:naspunktpolygon32640',
            title: 'Населенный пункт',
            checked: true
        }
    ];
    
    // Создаем WMS слои и добавляем их на карту
    layerConfigs.forEach(config => {
        const wmsLayer = createWmsLayer(config);
        wmsLayers.push(wmsLayer);
        
        // ОШИБКА: слои создавались, но не добавлялись на карту
        map.addLayer(wmsLayer);
        
        // Находим соответствующий чекбокс
        const checkbox = document.getElementById(config.id);
        if (checkbox) {
            checkbox.checked = config.checked;
            
            // Добавляем обработчик изменения чекбокса
            checkbox.addEventListener('change', function() {
                wmsLayer.setVisible(this.checked);
                
                console.log(`Checkbox ${config.id} changed to: ${this.checked}`);
                console.log(`Layer ${config.layerName} visibility: ${this.checked}`);
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
    map = new ol.Map({ // ОШИБКА: добавлено присвоение глобальной переменной
        target: 'map',
        layers: [
            new ol.layer.Tile({
                source: new ol.source.XYZ({
                    url: 'https://a-rgis.permkrai.ru/osm/tile/{z}/{x}/{y}.png',
                    attributions: '© Пермский край' // Добавлены атрибуции
                })
            })
        ],
        view: new ol.View({
            center: ol.proj.fromLonLat([56.2294, 58.0103]),
            zoom: 8,
            maxZoom: 18,
            minZoom: 5
        })
    });

    // ОШИБКА: Проверка существования элементов перед добавлением обработчиков
    const baseLayerCheckbox = document.getElementById('baseLayer');
    if (baseLayerCheckbox) {
        baseLayerCheckbox.addEventListener('change', function(e) {
            // ОШИБКА: osmLayer не добавлялся на карту, поэтому эта функция не работала
            if (map.getLayers().getArray().includes(osmLayer)) {
                osmLayer.setVisible(e.target.checked);
            }
        });
    }

    const opacitySlider = document.getElementById('opacitySlider');
    const opacityValue = document.getElementById('opacityValue');

    if (opacitySlider && opacityValue) {
        opacitySlider.addEventListener('input', function() {
            const opacity = this.value / 100;
            wmsLayers.forEach(layer => {
                layer.setOpacity(opacity);
            });
            opacityValue.textContent = `${this.value}%`;
        });
    }

    const resetViewBtn = document.getElementById('resetView');
    if (resetViewBtn) {
        resetViewBtn.addEventListener('click', function() {
            map.getView().setCenter(ol.proj.fromLonLat([56.2294, 58.0103]));
            map.getView().setZoom(8);
        });
    }

    const toggleSidebarBtn = document.getElementById('toggleSidebar');
    if (toggleSidebarBtn) {
        toggleSidebarBtn.addEventListener('click', function() {
            const sidebar = document.querySelector('.sidebar');
            if (sidebar) {
                sidebar.style.display = sidebar.style.display === 'none' ? 'block' : 'none';
                setTimeout(() => {
                    map.updateSize();
                }, 300);
            }
        });
    }

    const toggleFullscreenBtn = document.getElementById('toggleFullscreen');
    if (toggleFullscreenBtn) {
        toggleFullscreenBtn.addEventListener('click', function() {
            const mapContainer = document.querySelector('.map-container');
            if (!mapContainer) return;
            
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
    }

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
        
        const coordinatesElement = document.getElementById('coordinates');
        if (coordinatesElement) {
            coordinatesElement.innerHTML = 
                `Координаты: ${coordinate[1].toFixed(4)}° с.ш., ${coordinate[0].toFixed(4)}° в.д. | Масштаб: 1:${scale} | Уровень зума: ${zoom.toFixed(1)}`;
        }
    });

    // Попап для отображения информации при клике
    const popupElement = document.createElement('div');
    popupElement.className = 'ol-popup';
    popupElement.style.cssText = `
        background: white;
        padding: 10px;
        border-radius: 4px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        border: 1px solid #ccc;
        font-size: 0.9rem;
        max-width: 300px;
        display: none;
    `;

    const popup = new ol.Overlay({
        element: popupElement,
        positioning: 'bottom-center',
        stopEvent: false
    });

    map.addOverlay(popup);

    map.on('click', function(evt) {
        const coordinate = ol.proj.toLonLat(evt.coordinate);
        const content = `
            <strong>Координаты точки:</strong><br>
            Широта: ${coordinate[1].toFixed(6)}°<br>
            Долгота: ${coordinate[0].toFixed(6)}°
        `;
        
        popupElement.innerHTML = content;
        popupElement.style.display = 'block';
        popup.setPosition(evt.coordinate);
        
        setTimeout(() => {
            popupElement.style.display = 'none';
        }, 3000);
    });

    // Адаптация для мобильных устройств
    if (window.innerWidth <= 768) {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            sidebar.style.display = 'none';
        }
    }

    // Обработка ошибок загрузки WMS (перенесена в trackCheckboxesSimple)
    setTimeout(() => {
        wmsLayers.forEach(layer => {
            const source = layer.getSource();
            if (source) {
                source.on('tileloaderror', function() {
                    console.error(`Ошибка загрузки WMS-слоя: ${layer.get('title')}`);
                });

                source.on('tileloadstart', function() {
                    console.log(`Началась загрузка WMS-тайла: ${layer.get('title')}`);
                });

                source.on('tileloadend', function() {
                    console.log(`WMS-тайл успешно загружен: ${layer.get('title')}`);
                });
            }
        });
    }, 1000);

    return map;
}