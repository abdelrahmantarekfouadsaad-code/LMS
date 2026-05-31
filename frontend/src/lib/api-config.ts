export const getDjangoApi = () => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
  const cleanedUrl = baseUrl.replace(/\/$/, "");
  
  if (cleanedUrl.includes("vercel.app")) {
    return `${cleanedUrl}/_/backend/api`;
  }
  return `${cleanedUrl}/api`;
};

export const DJANGO_API = getDjangoApi();

export const getDjangoWs = () => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
  const cleanedUrl = baseUrl.replace(/\/$/, "");
  return cleanedUrl.replace(/^http/, "ws");
};

export const DJANGO_WS = getDjangoWs();
