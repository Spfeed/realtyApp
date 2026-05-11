import { useEffect, useMemo, useRef, useState } from "react";
import type { Listing } from "../../api/listingApi";
import type { ListingPhoto } from "../../api/listingPhotoApi";
import "./ListingsMapCard.css";
import { loadProtectedMedia } from "../../api/media";

declare global {
  interface Window {
    ymaps?: any;
  }
}

type Props = {
  listings: Listing[];
  photos: Record<number, ListingPhoto | null>;
};

type ListingMapGroup = {
  key: string;
  latitude: number;
  longitude: number;
  listings: Listing[];
};

const YANDEX_MAPS_SCRIPT_ID = "yandex-maps-script";

function loadYandexMaps() {
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
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${
      import.meta.env.VITE_YANDEX_MAPS_API_KEY
    }&lang=ru_RU`;
    script.async = true;

    script.onload = () => {
      window.ymaps?.ready(() => resolve());
    };

    script.onerror = reject;

    document.body.appendChild(script);
  });
}

function createListingBalloonLayout() {
  return window.ymaps.templateLayoutFactory.createClass(
    `
      <div class="listings-map-balloon">
        <button class="listings-map-balloon-close" type="button">×</button>
        <div class="listings-map-balloon-content">
          $[properties.balloonContent]
        </div>
      </div>
    `,
    {
      build: function () {
        this.constructor.superclass.build.call(this);

        const closeButton = this.getParentElement().querySelector(
          ".listings-map-balloon-close",
        );

        closeButton?.addEventListener("click", this.onCloseClick.bind(this));
      },

      clear: function () {
        const closeButton = this.getParentElement().querySelector(
          ".listings-map-balloon-close",
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

function createSingleMarkerLayout() {
  return window.ymaps.templateLayoutFactory.createClass(`
    <div class="listings-map-marker">
      <img src="/icons/house_marker.svg" alt="" />
    </div>
  `);
}

function createGroupMarkerLayout() {
  return window.ymaps.templateLayoutFactory.createClass(`
    <div class="listings-map-marker listings-map-marker--group">
      <img src="/icons/house_marker.svg" alt="" />
      <span>$[properties.count]</span>
    </div>
  `);
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function buildBalloonContent(
  group: ListingMapGroup,
  photoUrls: Record<number, string>,
) {
  if (group.listings.length === 1) {
    const listing = group.listings[0];
    const photo = photoUrls[listing.id];

    return `
      <article class="listings-map-balloon-listing">
        ${
          photo
            ? `<img src="${photo}" alt="" class="listings-map-balloon-image" />`
            : `<div class="listings-map-balloon-image listings-map-balloon-image--empty"></div>`
        }

        <div class="listings-map-balloon-body">
          <h3>${escapeHtml(listing.title)}</h3>
          <strong>${listing.price.toLocaleString("ru-RU")} ₽ / мес</strong>
          <p>${escapeHtml(listing.cityName)}, ${escapeHtml(listing.street)}, ${escapeHtml(listing.houseNumber)}</p>
          <a href="/listings/${listing.id}" class="listings-map-balloon-button">
            Посмотреть
          </a>
        </div>
      </article>
    `;
  }

  return `
    <div class="listings-map-balloon-group">
      <h3>${group.listings.length} объявлений в этом доме</h3>

      <div class="listings-map-balloon-group-list">
        ${group.listings
          .map((listing) => {
            const photo = photoUrls[listing.id];

            return `
              <a href="/listings/${listing.id}" class="listings-map-balloon-mini">
                ${
                  photo
                    ? `<img src="${photo}" alt="" />`
                    : `<div class="listings-map-balloon-mini-empty"></div>`
                }

                <span>
                  <b>${escapeHtml(listing.title)}</b>
                  <small>${listing.price.toLocaleString("ru-RU")} ₽ / мес</small>
                </span>
              </a>
            `;
          })
          .join("")}
      </div>
    </div>
  `;
}

function groupListingsByCoordinates(listings: Listing[]): ListingMapGroup[] {
  const map = new Map<string, ListingMapGroup>();

  listings.forEach((listing) => {
    if (listing.latitude == null || listing.longitude == null) return;

    const lat = Number(listing.latitude);
    const lon = Number(listing.longitude);

    const key = `${lat.toFixed(6)}:${lon.toFixed(6)}`;

    const existing = map.get(key);

    if (existing) {
      existing.listings.push(listing);
    } else {
      map.set(key, {
        key,
        latitude: lat,
        longitude: lon,
        listings: [listing],
      });
    }
  });

  return Array.from(map.values());
}

export function ListingsMapCard({ listings, photos }: Props) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const [error, setError] = useState("");
  const [photoUrls, setPhotoUrls] = useState<Record<number, string>>({});

  const listingsWithCoordinates = useMemo(
    () =>
      listings.filter(
        (listing) => listing.latitude != null && listing.longitude != null,
      ),
    [listings],
  );

  const listingGroups = useMemo(
    () => groupListingsByCoordinates(listingsWithCoordinates),
    [listingsWithCoordinates],
  );
  useEffect(() => {
    let active = true;
    const objectUrls: string[] = [];

    async function loadMapPhotos() {
      const entries = await Promise.all(
        listingsWithCoordinates.map(async (listing) => {
          const photoUrl = photos[listing.id]?.url;

          if (!photoUrl) {
            return [listing.id, ""] as const;
          }

          try {
            const objectUrl = await loadProtectedMedia(photoUrl);

            objectUrls.push(objectUrl);

            return [listing.id, objectUrl] as const;
          } catch {
            return [listing.id, ""] as const;
          }
        }),
      );

      if (active) {
        setPhotoUrls(Object.fromEntries(entries));
      }
    }

    loadMapPhotos();

    return () => {
      active = false;

      objectUrls.forEach((url) => {
        URL.revokeObjectURL(url);
      });
    };
  }, [listingsWithCoordinates, photos]);

  useEffect(() => {
    if (!mapRef.current) return;

    const apiKey = import.meta.env.VITE_YANDEX_MAPS_API_KEY;

    if (!apiKey) {
      setError("Не указан ключ Yandex Maps API");
      return;
    }

    let cancelled = false;

    loadYandexMaps()
      .then(() => {
        if (cancelled || !mapRef.current || !window.ymaps) return;

        if (mapInstanceRef.current) {
          mapInstanceRef.current.destroy();
          mapInstanceRef.current = null;
        }

        const defaultCenter = [55.755864, 37.617698];

        const center =
          listingGroups.length > 0
            ? [listingGroups[0].latitude, listingGroups[0].longitude]
            : defaultCenter;

        const map = new window.ymaps.Map(mapRef.current, {
          center,
          zoom: listingGroups.length > 0 ? 11 : 10,
          controls: ["zoomControl", "fullscreenControl"],
        });

        const balloonLayout = createListingBalloonLayout();
        const singleMarkerLayout = createSingleMarkerLayout();
        const groupMarkerLayout = createGroupMarkerLayout();

        listingGroups.forEach((group) => {
          const isGroup = group.listings.length > 1;

          const placemark = new window.ymaps.Placemark(
            [group.latitude, group.longitude],
            {
              count: group.listings.length,
              balloonContent: buildBalloonContent(group, photoUrls),
              hintContent:
                group.listings.length > 1
                  ? `${group.listings.length} объявлений`
                  : group.listings[0].title,
            },
            {
              iconLayout: isGroup ? groupMarkerLayout : singleMarkerLayout,
              iconShape: {
                type: "Circle",
                coordinates: [0, 0],
                radius: isGroup ? 25 : 22,
              },

              balloonLayout,
              balloonPanelMaxMapArea: 0,
              hideIconOnBalloonOpen: false,
              balloonOffset: [0, -46],
            },
          );

          map.geoObjects.add(placemark);
        });

        if (listingGroups.length > 1) {
          const bounds = map.geoObjects.getBounds();

          if (bounds) {
            map.setBounds(bounds, {
              checkZoomRange: true,
              zoomMargin: 36,
            });
          }
        }

        mapInstanceRef.current = map;
      })
      .catch(() => setError("Не удалось загрузить карту"));

    return () => {
      cancelled = true;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy();
        mapInstanceRef.current = null;
      }
    };
  }, [listingGroups, photoUrls]);

  return (
    <section className="listings-map-card">
      <div className="listings-map-header">
        <h2>Карта объявлений</h2>
        <span>{listings.length} объектов</span>
      </div>

      {error ? (
        <div className="listings-map-placeholder">
          <p>{error}</p>
        </div>
      ) : (
        <div ref={mapRef} className="listings-map-placeholder" />
      )}

      <div className="listings-map-footer">
        <p>
          На карте показано {listingsWithCoordinates.length} из{" "}
          {listings.length} объявлений с координатами.
        </p>

        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          К фильтрам
        </button>
      </div>
    </section>
  );
}
