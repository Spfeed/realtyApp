import { useEffect, useRef, useState } from "react";
import "./ListingMap.css";

declare global {
  interface Window {
    ymaps?: any;
  }
}

type NearbyMapPlace = {
  name: string;
  distanceMeters: number;
  latitude: number;
  longitude: number;
  categoryTitle: string;
};

type Props = {
  latitude?: number | null;
  longitude?: number | null;
  title?: string;
  address?: string;
  nearbyPlaces?: NearbyMapPlace[];
  onMapView?: () => void;
};

const YANDEX_MAPS_SCRIPT_ID = "yandex-maps-script";

function loadYandexMaps(apiKey: string) {
  return new Promise<void>((resolve, reject) => {
    if (window.ymaps) {
      window.ymaps.ready(() => resolve());
      return;
    }

    const existingScript = document.getElementById(YANDEX_MAPS_SCRIPT_ID);

    if (existingScript) {
      existingScript.addEventListener("load", () => {
        window.ymaps?.ready(() => resolve());
      });
      existingScript.addEventListener("error", reject);
      return;
    }

    const script = document.createElement("script");
    script.id = YANDEX_MAPS_SCRIPT_ID;
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${apiKey}&lang=ru_RU`;
    script.async = true;

    script.onload = () => {
      window.ymaps?.ready(() => resolve());
    };

    script.onerror = reject;

    document.body.appendChild(script);
  });
}

function getPoiIcon(categoryTitle: string) {
  if (categoryTitle.includes("Транспорт")) return "/icons/transport_marker.svg";
  if (categoryTitle.includes("Парки")) return "/icons/park_marker.svg";
  if (categoryTitle.includes("Магазины")) return "/icons/shop_marker.svg";
  if (categoryTitle.includes("Медицина")) return "/icons/hospital_marker.svg";
  if (categoryTitle.includes("Аптеки")) return "/icons/hospital_marker.svg";
  if (categoryTitle.includes("Школы")) return "/icons/education_marker.svg";
  if (categoryTitle.includes("Детские")) return "/icons/education_marker.svg";
  if (categoryTitle.includes("Вузы")) return "/icons/education_marker.svg";
  if (categoryTitle.includes("Еда")) return "/icons/food_marker.svg";

  return "/icons/shop_marker.svg";
}

function createCustomBalloonLayout() {
  return window.ymaps.templateLayoutFactory.createClass(
    `
      <div class="custom-map-balloon">
        <button class="custom-map-balloon-close" type="button">×</button>
        <div class="custom-map-balloon-content">
          $[properties.balloonContent]
        </div>
      </div>
    `,
    {
      build: function () {
        this.constructor.superclass.build.call(this);

        const closeButton = this.getParentElement().querySelector(
          ".custom-map-balloon-close",
        );

        closeButton?.addEventListener("click", this.onCloseClick.bind(this));
      },

      clear: function () {
        const closeButton = this.getParentElement().querySelector(
          ".custom-map-balloon-close",
        );

        closeButton?.removeEventListener("click", this.onCloseClick.bind(this));

        this.constructor.superclass.clear.call(this);
      },

      onCloseClick: function (e: Event) {
        e.preventDefault();
        this.events.fire("userclose");
      },
    },
  );
}

export function ListingMap({
  latitude,
  longitude,
  title,
  address,
  nearbyPlaces = [],
  onMapView,
}: Props) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!latitude || !longitude || !mapRef.current) return;

    const apiKey = import.meta.env.VITE_YANDEX_MAPS_API_KEY;

    if (!apiKey) {
      setError("Не указан ключ Yandex Maps API");
      return;
    }

    let cancelled = false;

    loadYandexMaps(apiKey)
      .then(() => {
        if (cancelled || !mapRef.current || !window.ymaps) return;

        if (mapInstanceRef.current) {
          mapInstanceRef.current.destroy();
          mapInstanceRef.current = null;
        }

        const coordinates = [latitude, longitude];

        const map = new window.ymaps.Map(mapRef.current, {
          center: coordinates,
          zoom: 16,
          controls: ["zoomControl", "fullscreenControl"],
        });

        const customBalloonLayout = createCustomBalloonLayout();

        const placemark = new window.ymaps.Placemark(
          coordinates,
          {
            balloonContent: `
                <div class="custom-map-balloon-title">${title ?? "Объявление"}</div>
                <div class="custom-map-balloon-text">${address ?? ""}</div>
            `,
          },
          {
            iconLayout: "default#image",
            iconImageHref: "/icons/house_marker.svg",
            iconImageSize: [44, 44],
            iconImageOffset: [-22, -44],
            balloonLayout: customBalloonLayout,
            balloonPanelMaxMapArea: 0,
            hideIconOnBalloonOpen: false,
            balloonOffset: [0, -46],
          },
        );

        map.geoObjects.add(placemark);
        nearbyPlaces.forEach((place) => {
          const poiPlacemark = new window.ymaps.Placemark(
            [place.latitude, place.longitude],
            {
              balloonContent: `
                <div class="map-balloon map-balloon--poi">
                    <strong>${place.name}</strong>
                    <p>${place.categoryTitle} • ${place.distanceMeters} м</p>
                </div>
              `,
              hintContent: place.name,
            },
            {
              iconLayout: "default#image",
              iconImageHref: getPoiIcon(place.categoryTitle),
              iconImageSize: [32, 32],
              iconImageOffset: [-16, -32],

              balloonLayout: customBalloonLayout,
              balloonPanelMaxMapArea: 0,
              hideIconOnBalloonOpen: false,
              balloonOffset: [0, -34],
            },
          );

          map.geoObjects.add(poiPlacemark);
        });

        mapInstanceRef.current = map;
      })
      .catch(() => {
        setError("Не удалось загрузить карту");
      });

    return () => {
      cancelled = true;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy();
        mapInstanceRef.current = null;
      }
    };
  }, [latitude, longitude, title, address, nearbyPlaces]);

  if (!latitude || !longitude) {
    return (
      <div className="listing-map-placeholder">
        <span>Карта недоступна</span>
        {address && <p>{address}</p>}
      </div>
    );
  }

  if (error) {
    return (
      <div className="listing-map-placeholder">
        <span>{error}</span>
        {address && <p>{address}</p>}
      </div>
    );
  }

  return (
    <div className="listing-map-card">
      <div
        ref={mapRef}
        className="listing-map"
        onMouseDown={() => {
          onMapView?.();
        }}
      />
    </div>
  );
}
