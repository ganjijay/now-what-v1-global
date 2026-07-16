import { doc, getDoc, onSnapshot, runTransaction, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "./firebase";

export async function ensureUserProfile(user) {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      uid: user.uid, email: user.email || "", displayName: user.displayName || "",
      photoURL: user.photoURL || "", credits: 3, freeCreditsGranted: true,
      referralCode: user.uid.slice(0, 8).toUpperCase(), referredBy: null,
      firstPurchaseCompleted: false, createdAt: serverTimestamp(), updatedAt: serverTimestamp()
    });
  } else {
    await setDoc(ref, { email: user.email || "", displayName: user.displayName || "",
      photoURL: user.photoURL || "", updatedAt: serverTimestamp() }, { merge: true });
  }
}

export function watchCredits(uid, callback) {
  return onSnapshot(doc(db, "users", uid), snap => callback(Number(snap.data()?.credits || 0)));
}

export async function consumeOneCredit(uid) {
  const ref = doc(db, "users", uid);
  return runTransaction(db, async tx => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("USER_NOT_FOUND");
    const current = Number(snap.data().credits || 0);
    if (current < 1) throw new Error("NO_CREDITS");
    const next = current - 1;
    tx.update(ref, { credits: next, updatedAt: serverTimestamp() });
    return next;
  });
}
