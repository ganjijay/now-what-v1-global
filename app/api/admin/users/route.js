import { FieldValue } from "firebase-admin/firestore";
import {
  requireAdmin,
  adminErrorResponse
} from "../../../../lib/adminAuth";
import {
  getAdminAuth,
  getAdminDb
} from "../../../../lib/firebaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function timestampToIso(value) {
  if (!value) return null;

  if (typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }

  return null;
}

function authDateToIso(value) {
  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

async function getAuthUsersByUid(uids) {
  const auth = getAdminAuth();
  const result = new Map();

  for (let index = 0; index < uids.length; index += 100) {
    const batch = uids.slice(index, index + 100);
    const response = await auth.getUsers(
      batch.map((uid) => ({ uid }))
    );

    response.users.forEach((account) => {
      result.set(account.uid, account);
    });
  }

  return result;
}

export async function GET(request) {
  try {
    await requireAdmin(request);

    const url = new URL(request.url);
    const query = String(url.searchParams.get("q") || "")
      .trim()
      .toLowerCase();

    const snapshot = await getAdminDb()
      .collection("users")
      .orderBy("createdAt", "desc")
      .limit(300)
      .get();

    const firestoreUsers = snapshot.docs.map((document) => {
      const data = document.data();

      return {
        uid: document.id,
        email: data.email || "",
        displayName: data.displayName || "",
        photoURL: data.photoURL || "",
        credits: Number(data.credits || 0),
        referralCode: data.referralCode || "",
        firstPurchaseCompleted:
          Boolean(data.firstPurchaseCompleted),
        createdAt: timestampToIso(data.createdAt),
        updatedAt: timestampToIso(data.updatedAt)
      };
    });

    const authUsers = await getAuthUsersByUid(
      firestoreUsers.map((user) => user.uid)
    );

    const users = firestoreUsers
      .map((user) => {
        const authUser = authUsers.get(user.uid);

        return {
          ...user,
          email: authUser?.email || user.email,
          displayName:
            authUser?.displayName || user.displayName,
          photoURL: authUser?.photoURL || user.photoURL,
          disabled: Boolean(authUser?.disabled),
          emailVerified: Boolean(authUser?.emailVerified),
          authCreatedAt: authDateToIso(
            authUser?.metadata?.creationTime
          ),
          lastSignInAt: authDateToIso(
            authUser?.metadata?.lastSignInTime
          ),
          providerIds:
            authUser?.providerData
              ?.map((provider) => provider.providerId)
              .filter(Boolean) || []
        };
      })
      .filter((user) => {
        if (!query) return true;

        return (
          user.email.toLowerCase().includes(query) ||
          user.displayName.toLowerCase().includes(query) ||
          user.uid.toLowerCase().includes(query)
        );
      })
      .slice(0, 100);

    return Response.json({ users });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function PATCH(request) {
  try {
    const admin = await requireAdmin(request);
    const body = await request.json();

    const uid = String(body?.uid || "").trim();
    const disabled = Boolean(body?.disabled);
    const reason = String(
      body?.reason || "Manual account status change"
    )
      .trim()
      .slice(0, 300);

    if (!uid) {
      return Response.json(
        { error: "사용자 UID가 없습니다." },
        { status: 400 }
      );
    }

    if (uid === admin.uid && disabled) {
      return Response.json(
        { error: "현재 로그인한 관리자 계정은 정지할 수 없습니다." },
        { status: 400 }
      );
    }

    const auth = getAdminAuth();
    const db = getAdminDb();

    const before = await auth.getUser(uid);

    await auth.updateUser(uid, {
      disabled
    });

    await db.collection("users").doc(uid).set(
      {
        disabled,
        disabledAt: disabled
          ? FieldValue.serverTimestamp()
          : null,
        disabledReason: disabled ? reason : "",
        updatedAt: FieldValue.serverTimestamp()
      },
      { merge: true }
    );

    await db.collection("adminActions").add({
      type: disabled
        ? "user_disabled"
        : "user_enabled",
      targetUid: uid,
      previousDisabled: Boolean(before.disabled),
      nextDisabled: disabled,
      reason,
      adminUid: admin.uid,
      adminEmail: admin.email,
      createdAt: FieldValue.serverTimestamp()
    });

    return Response.json({
      success: true,
      uid,
      disabled
    });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
