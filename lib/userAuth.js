import { getAdminAuth } from "./firebaseAdmin";

export async function requireUser(request) {
  const header = request.headers.get("authorization") || "";

  if (!header.startsWith("Bearer ")) {
    const error = new Error("로그인이 필요합니다.");
    error.status = 401;
    throw error;
  }

  const token = header.slice(7).trim();

  if (!token) {
    const error = new Error("로그인이 필요합니다.");
    error.status = 401;
    throw error;
  }

  const decoded = await getAdminAuth().verifyIdToken(token, true);

  return {
    uid: decoded.uid,
    email: String(decoded.email || ""),
    displayName: String(decoded.name || "")
  };
}

export function userErrorResponse(error) {
  console.error("USER_API_ERROR", error);

  return Response.json(
    {
      error: error?.message || "요청 처리 중 오류가 발생했습니다."
    },
    {
      status: Number(error?.status || 500)
    }
  );
}
