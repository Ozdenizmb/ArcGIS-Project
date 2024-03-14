require([
    "esri/config",
    "esri/Map",
    "esri/views/MapView",
    "esri/Graphic",
    "esri/layers/GraphicsLayer",
    "esri/rest/route",
    "esri/rest/support/RouteParameters",
    "esri/rest/support/FeatureSet"
], function (esriConfig, Map, MapView, Graphic, GraphicsLayer, route, RouteParameters, FeatureSet) {

    esriConfig.apiKey = "AAPK920de75762f54ac5af1a4c38896130bbVIplRoMWIOWwZWVm1SP1-_OtH7evmCludRVpfbG1vsYUg_EBsN8FWCLt8OFATKry";

    const map = new Map({
        basemap: "arcgis/topographic"
    });

    const view = new MapView({
        map: map,
        center: [0, 0],
        zoom: 2,
        container: "viewDiv"
    });

    // Grafiklerin ve rota sonuçlarının gösterileceği katmanlar oluşturulur ve haritaya eklenir.
    const graphicsLayer = new GraphicsLayer();
    map.add(graphicsLayer);

    const routeLayer = new GraphicsLayer();
    map.add(routeLayer);

    // Rota hesaplamak için kullanılacak parametreler belirlenir.
    const routeParams = new RouteParameters({
        apiKey: esriConfig.apiKey,
        stops: new FeatureSet(),
        outSpatialReference: {
            wkid: 3857
        }
    });

    const stopSymbol = {
        type: "simple-marker",
        color: [226, 119, 40],
        size: 8
    };

    const routeSymbol = {
        type: "simple-line",
        color: [0, 0, 255, 0.5],
        width: 5
    };

    const markerCoordinates = [];

    view.on("click", function (event) {
        addStop(event.mapPoint); // Tıklanan noktanın Koordinat bilgisi gönderildi.
    });

    function addStop(mapPoint) {
        // Haritaya tıklandıktan sonra tıklanan noktanın koordinat bilgisi ve şekil bilgileri ile bir nesne oluşturuluyor ve grafik katmanına ekleniyor. Aynı zamanda bu bilgiler rota parametrelerine de ekleniyor. 
        const stop = new Graphic({
            geometry: mapPoint,
            symbol: stopSymbol
        });
        graphicsLayer.add(stop);
        routeParams.stops.features.push(stop);

        // Koordinat bilgilerimizi tutan diziye koordinat bilgisini push'luyoruz.
        markerCoordinates.push(mapPoint.toJSON());

        // EĞER iki veya daha fazla nokta işaretlendi ise, noktalar arasında yol çiziliyor.
        if (routeParams.stops.features.length >= 2) {
            route.solve("https://route-api.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World", routeParams)
                .then(showRoute);

            updatePath();

            checkStartButtonStatus();
        }
    }

    // addStop Fonksiyonundan kullanılan bu fonksiyon, Rota sonucunu ve rota çizgisinin özelliklerini belirliyor.
    function showRoute(data) {
        const routeResult = data.routeResults[0].route;
        routeResult.symbol = routeSymbol;
        routeLayer.add(routeResult);
    }

    // Bu fonksiyon da addStop fonksiyonunda kullanılmaktadır. Haritada yeni bir noktaya tıklandığında mevcut grafik katmanını silip, yeniden rota çiziliyor.
    function updatePath() {
        graphicsLayer.removeAll();

        markerCoordinates.forEach(function (coordinates) {
            const pathGraphic = new Graphic({
                geometry: {
                    type: "point",
                    x: coordinates.x,
                    y: coordinates.y,
                    spatialReference: view.spatialReference
                },
                symbol: {
                    type: "simple-marker",
                    color: [226, 119, 40],
                    size: 8
                }
            });

            graphicsLayer.add(pathGraphic);
        });

        if (markerCoordinates.length >= 2) {
            const polylineGraphic = new Graphic({
                geometry: {
                    type: "polyline",
                    paths: markerCoordinates,
                    spatialReference: view.spatialReference
                },
                symbol: {
                    type: "simple-line",
                    color: [226, 119, 40],
                    width: 2
                }
            });

            graphicsLayer.add(polylineGraphic);
        }

        console.log("Marker Coordinates:", markerCoordinates);
    }

    // AddStop fonksiyonunda kullanılan bu fonksiyon, butonun active veya deactive olma özelliğini belirliyor.
    function checkStartButtonStatus() {
        const startButton = document.getElementById("startButton");
        if (markerCoordinates.length >= 2) {
            startButton.removeAttribute("disabled");
            startButton.classList.add("active");
        } else {
            startButton.setAttribute("disabled", "disabled");
            startButton.classList.remove("active");
        }
    }

    // Butona tıklandığında yeni bir sayfaya gidiyoruz ve buradaki koordinat bilgilerini de yanımızda götürüyoruz. 
    window.startTrip = function () {
        const encodedCoordinates = encodeURIComponent(JSON.stringify(markerCoordinates));
        window.location.href = "destination-page.html?coordinates=" + encodedCoordinates;
    };
});