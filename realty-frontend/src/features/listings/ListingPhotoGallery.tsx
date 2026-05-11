import { useEffect, useState } from "react";
import { loadProtectedMedia } from "../../api/media";
import type { ListingPhoto } from "../../api/listingPhotoApi";
import "./ListingPhotoGallery.css";

type LoadedPhoto = ListingPhoto & {
  blobUrl: string;
};

type Props = {
  photos: ListingPhoto[];
  onPhotoView?: () => void;
};

export function ListingPhotoGallery({ photos, onPhotoView }: Props) {
  const [loadedPhotos, setLoadedPhotos] = useState<LoadedPhoto[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [thumbStart, setThumbStart] = useState(0);

  useEffect(() => {
    let objectUrls: string[] = [];

    async function loadPhotos() {
      const sorted = [...photos].sort((a, b) => {
        if (a.isMain !== b.isMain) return a.isMain ? -1 : 1;
        return a.sortOrder - b.sortOrder;
      });

      const loaded = await Promise.all(
        sorted.map(async (photo) => {
          const blobUrl = await loadProtectedMedia(photo.url);
          objectUrls.push(blobUrl);

          return {
            ...photo,
            blobUrl,
          };
        }),
      );

      setLoadedPhotos(loaded);
      setActiveIndex(0);
      setThumbStart(0);
    }

    if (photos.length > 0) {
      loadPhotos();
    } else {
      setLoadedPhotos([]);
    }

    return () => {
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [photos]);

  if (loadedPhotos.length === 0) {
    return (
      <div className="listing-photo-gallery">
        <div className="listing-photo-main listing-photo-placeholder" />
      </div>
    );
  }

  const activePhoto = loadedPhotos[activeIndex];
  const showCarouselButtons = loadedPhotos.length > 4;

  function showPrevThumbs() {
    setThumbStart((prev) => Math.max(prev - 1, 0));
  }

  function showNextThumbs() {
    setThumbStart((prev) => Math.min(prev + 1, loadedPhotos.length - 4));
  }

  return (
    <div className="listing-photo-gallery">
      <button
        type="button"
        className="listing-photo-main-button"
        onClick={() => {
          onPhotoView?.();
        }}
      >
        <img src={activePhoto.blobUrl} alt="" className="listing-photo-main" />
      </button>

      {loadedPhotos.length > 1 && (
        <div className="listing-photo-thumbs-wrap">
          {showCarouselButtons && (
            <button
              type="button"
              className="listing-photo-arrow listing-photo-arrow--left"
              onClick={showPrevThumbs}
              disabled={thumbStart === 0}
            >
              <img src="/icons/left_carousel.svg" alt="" />
            </button>
          )}

          <div className="listing-photo-thumbs-viewport">
            <div
              className="listing-photo-thumbs"
              style={{
                transform: `translateX(-${thumbStart * 117}px)`,
              }}
            >
              {loadedPhotos.map((photo, realIndex) => {
                const isActive = realIndex === activeIndex;

                return (
                  <button
                    key={photo.id}
                    type="button"
                    className={
                      isActive
                        ? "listing-photo-thumb listing-photo-thumb--active"
                        : "listing-photo-thumb"
                    }
                    onClick={() => {
                      setActiveIndex(realIndex);
                      onPhotoView?.();
                    }}
                  >
                    <img src={photo.blobUrl} alt="" />
                  </button>
                );
              })}
            </div>
          </div>

          {showCarouselButtons && (
            <button
              type="button"
              className="listing-photo-arrow listing-photo-arrow--right"
              onClick={showNextThumbs}
              disabled={thumbStart >= loadedPhotos.length - 4}
            >
              <img src="/icons/right_carousel.svg" alt="" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
