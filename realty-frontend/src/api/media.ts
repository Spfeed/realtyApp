import { API_BASE_URL } from "./config";

export function getMediaUrl(url?: string | null) {
  if (!url) return "";

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  return `${API_BASE_URL}${url}`;
}

export async function loadProtectedMedia(url: string) {
  const token = sessionStorage.getItem("token");

  const response = await fetch(getMediaUrl(url), {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Ошибка загрузки медиа: ${response.status}`);
  }

  const blob = await response.blob();
  return URL.createObjectURL(blob);
}