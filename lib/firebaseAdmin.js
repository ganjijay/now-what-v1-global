import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function getServiceAccount() {
  const encoded = process.env.FIREBASE_ADMIN_BASE64;

  if (!encoded) {
    throw new Error("FIREBASE_ADMIN_BASE64 is not configured.");
  }

  const json = Buffer.from(encoded, "base64").toString("utf8");
  return JSON.parse(json);
}

function getAdminApp() {
  if (getApps().length) {
    return getApps()[0];
  }

  return initializeApp({
    credential: cert(getServiceAccount())
  });
}

export function getAdminAuth() {
  return getAuth(getAdminApp());
}

export function getAdminDb() {
  return getFirestore(getAdminApp());
}
