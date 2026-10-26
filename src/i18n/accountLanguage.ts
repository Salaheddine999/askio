import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../utils/db";
import { isLang, type Lang } from ".";

// The account's language lives on its users/{uid} profile so it follows the
// owner to every device. This module is loaded only once someone is signed
// in, which keeps Firestore off the public homepage.

export async function readAccountLanguage(uid: string): Promise<Lang | null> {
  const value = (await getDoc(doc(db, "users", uid))).data()?.language;
  return isLang(value) ? value : null;
}

export async function saveAccountLanguage(uid: string, lang: Lang) {
  await updateDoc(doc(db, "users", uid), { language: lang });
}
