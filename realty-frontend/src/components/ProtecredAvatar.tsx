import { useEffect, useState } from "react";
import { loadProtectedMedia } from "../api/media";

type Props = {
  avatarUrl?: string | null;
  fallback: string;
  className?: string;
  imgClassName?: string;
};

export function ProtectedAvatar({
  avatarUrl,
  fallback,
  className = "chat-avatar",
  imgClassName = "chat-avatar-img",
}: Props) {
  const [blobUrl, setBlobUrl] = useState("");

  useEffect(() => {
    if (!avatarUrl) {
      setBlobUrl("");
      return;
    }

    let objectUrl = "";

    loadProtectedMedia(avatarUrl)
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
  }, [avatarUrl]);

  return (
    <div className={className}>
      {blobUrl ? (
        <img src={blobUrl} alt="" className={imgClassName} />
      ) : (
        fallback
      )}
    </div>
  );
}