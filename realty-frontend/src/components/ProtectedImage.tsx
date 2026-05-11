import { useEffect, useState } from "react";
import { loadProtectedMedia } from "../api/media";

type Props = {
  src?: string | null;
  alt?: string;
  className?: string;
  placeholderClassName?: string;
};

export function ProtectedImage({
  src,
  alt = "",
  className,
  placeholderClassName,
}: Props) {
  const [blobUrl, setBlobUrl] = useState("");

  useEffect(() => {
    if (!src) {
      setBlobUrl("");
      return;
    }

    let objectUrl = "";

    loadProtectedMedia(src)
      .then((url) => {
        objectUrl = url;
        setBlobUrl(url);
      })
      .catch(() => setBlobUrl(""));

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [src]);

  if (!blobUrl) {
    return <div className={placeholderClassName ?? className} />;
  }

  return <img src={blobUrl} alt={alt} className={className} />;
}