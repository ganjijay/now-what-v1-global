import { getAdminAuth } from "./firebaseAdmin";

export async function requireAdmin(request) {
  const header = request.headers.get("authorization") || "";

  if (!header.startsWith("Bearer ")) {
    throw new AdminAuthError("로그인이 필요합니다.", 401);
  }

  const token = header.slice(7).trim();

  if (!token) {
    throw new AdminAuthError("로그인이 필요합니다.", 401);
  }

  const decoded = await getAdminAuth().verifyIdToken(token, true);
  const allowedEmail = String(process.env.ADMIN_EMAIL || "")
    .trim()
    .toLowerCase();
  const email = String(decoded.email || "").trim().toLowerCase();

  if (!allowedEmail) {
    throw new AdminAuthError(
      "ADMIN_EMAIL 환경변수가 설정되지 않았습니다.",
      500
    );
  }

  if (!decoded.email_verified || email !== allowedEmail) {
    throw new AdminAuthError("관리자 권한이 없습니다.", 403);
  }

  return {
    uid: decoded.uid,
    email
  };
}

export class AdminAuthError extends Error {
  constructor(message, status = 403) {
    super(message);
    this.status = status;
  }
}

export function adminErrorResponse(error) {
  console.error("ADMIN_API_ERROR", error);

  return Response.json(
    {
      error: error?.message || "관리자 요청 처리 중 오류가 발생했습니다."
    },
    {
      status: Number(error?.status || 500)
    }
  );
}
