import { getFirestore } from "firebase/firestore";
import { app } from "./firebase";

// Kept apart from ./firebase (app + auth) so pages that never touch the
// database, like the homepage, don't download the Firestore SDK.
export const db = getFirestore(app);
