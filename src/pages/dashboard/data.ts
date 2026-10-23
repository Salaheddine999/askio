import { collection, getDocs, limit, orderBy, query, where, DocumentData } from "firebase/firestore";
import { format } from "date-fns";
import { db } from "../../utils/db";

// Firestore "in" queries accept at most 10 values, so ids are fetched in batches.
const IN_QUERY_LIMIT = 10;

export async function fetchOwnedByChatbots(
  collectionName: "leads" | "unanswered_queries",
  ownerId: string,
  chatbotIds: string[]
): Promise<(DocumentData & { id: string; timestamp: Date })[]> {
  const results: (DocumentData & { id: string; timestamp: Date })[] = [];
  for (let i = 0; i < chatbotIds.length; i += IN_QUERY_LIMIT) {
    const batchIds = chatbotIds.slice(i, i + IN_QUERY_LIMIT);
    const snap = await getDocs(
      query(
        collection(db, collectionName),
        where("ownerId", "==", ownerId),
        where("chatbotId", "in", batchIds)
      )
    );
    snap.docs.forEach((d) => {
      const data = d.data();
      results.push({
        ...data,
        id: d.id,
        timestamp: data.timestamp?.toDate?.() || data.createdAt?.toDate?.() || new Date(0),
      });
    });
  }
  return results;
}

/** The owner's most recent records, newest first; for lists that only show the latest few. */
export async function fetchRecentOwned(
  collectionName: "leads" | "unanswered_queries",
  ownerId: string,
  max: number
): Promise<(DocumentData & { id: string; timestamp: Date })[]> {
  const snap = await getDocs(
    query(collection(db, collectionName), where("ownerId", "==", ownerId), orderBy("timestamp", "desc"), limit(max))
  );
  return snap.docs.map((d) => {
    const data = d.data();
    return { ...data, id: d.id, timestamp: data.timestamp?.toDate?.() || data.createdAt?.toDate?.() || new Date(0) };
  });
}

const csvCell = (value: string | number) =>
  typeof value === "number" ? String(value) : `"${value.replace(/"/g, '""')}"`;

/** Builds a CSV from rows and hands it to the browser as a dated download. */
export function downloadCsv(baseName: string, headers: string[], rows: (string | number)[][]) {
  const csv = [headers.map(csvCell), ...rows.map((row) => row.map(csvCell))]
    .map((row) => row.join(","))
    .join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `${baseName}_${format(new Date(), "yyyy-MM-dd")}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
