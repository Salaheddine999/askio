import { useEffect, useState, useMemo } from "react";
import { db, auth } from "../utils/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { BarChart2, MessageCircle, AlertCircle, Users, LoaderCircle, TrendingUp, HelpCircle } from "lucide-react";
import StatsCard from "../components/StatsCard";
import Card from "../components/Card";
import { format } from "date-fns";
import { Helmet } from "react-helmet-async";

interface AnalyticsEvent {
  id: string;
  chatbotId: string;
  type: string;
  question: string;
  userQuery?: string;
  timestamp: Date;
}

interface UnansweredQuery {
  id: string;
  chatbotId: string;
  query: string;
  timestamp: Date;
}

interface Lead {
  id: string;
  chatbotId: string;
  email: string;
  timestamp: Date;
}

interface Chatbot {
  id: string;
  title: string;
}

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [chatbots, setChatbots] = useState<Chatbot[]>([]);
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [unanswered, setUnanswered] = useState<UnansweredQuery[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) return;

      // 1. Fetch user's chatbots
      const chatbotsQuery = query(collection(db, "chatbot_configs"), where("user_id", "==", user.uid));
      const chatbotsSnap = await getDocs(chatbotsQuery);
      const userChatbots = chatbotsSnap.docs.map(doc => ({ id: doc.id, title: doc.data().title }));
      setChatbots(userChatbots);

      const chatbotIds = userChatbots.map(c => c.id);
      if (chatbotIds.length === 0) {
        setLoading(false);
        return;
      }

      // 2. Fetch Analytics Events
      const eventsQuery = query(collection(db, "analytics_events"), where("ownerId", "==", user.uid));
      const eventsSnap = await getDocs(eventsQuery);
      setEvents(eventsSnap.docs.filter(doc => chatbotIds.includes(doc.data().chatbotId)).map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date(),
      } as AnalyticsEvent)));

      // 3. Fetch Unanswered Queries
      const unansweredQuery = query(collection(db, "unanswered_queries"), where("ownerId", "==", user.uid));
      const unansweredSnap = await getDocs(unansweredQuery);
      setUnanswered(unansweredSnap.docs.filter(doc => chatbotIds.includes(doc.data().chatbotId)).map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date(),
      } as UnansweredQuery)));

      // 4. Fetch Leads
      const leadsQuery = query(collection(db, "leads"), where("ownerId", "==", user.uid));
      const leadsSnap = await getDocs(leadsQuery);
      setLeads(leadsSnap.docs.filter(doc => chatbotIds.includes(doc.data().chatbotId)).map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date(),
      } as Lead)));

    } catch (error) {
      console.error("Error fetching analytics data:", error);
    } finally {
      setLoading(false);
    }
  };

  const popularQuestions = useMemo(() => {
    const counts: Record<string, number> = {};
    events.forEach(event => {
      if (event.type === "faq_matched" || event.type === "suggestion_clicked") {
        counts[event.question] = (counts[event.question] || 0) + 1;
      }
    });

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([question, count]) => ({ question, count }));
  }, [events]);

  const getChatbotName = (id: string) => chatbots.find(c => c.id === id)?.title || "Unknown Bot";

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-100px)]">
        <LoaderCircle className="animate-spin text-[#101723] dark:text-[#D7DFE5]" size={48} />
      </div>
    );
  }

  return (
    <div className="bg-[#F3F7FC] dark:bg-[#141D2B] min-h-screen font-sans text-[#101723]">
      <Helmet>
        <title>Analytics | Askio Chatbot</title>
      </Helmet>

      <div className="w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-full bg-[#F9FCFF] dark:bg-[#1A2533] flex items-center justify-center border border-[#D8DFE9] dark:border-[#2B3646] shadow-sm">
          <BarChart2 className="w-5 h-5 text-[#101723] dark:text-[#D7DFE5]" />
        </div>
        <div>
          <h1 className="text-h1 font-serif text-[#101723] dark:text-[#D7DFE5]">Analytics & Leads</h1>
          <p className="text-body text-[#566273] dark:text-[#9BAABD]">Track performance and view collected leads.</p>
        </div>
      </div>

      {chatbots.length === 0 ? (
        <Card className="p-12 text-center shadow-sm">
          <h2 className="text-lg font-semibold text-[#101723] dark:text-[#D7DFE5] mb-2">No chatbots yet</h2>
          <p className="text-sm text-[#566273] dark:text-[#9BAABD] mb-4">
            Create a chatbot first, then come back here to view analytics and leads.
          </p>
          <a
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#101723] dark:bg-[#D7DFE5] text-white dark:text-[#141D2B] text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Go to Dashboard
          </a>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Top Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatsCard
              title="Total Answered Queries"
              value={events.length.toString()}
              icon={<MessageCircle size={20} className="text-emerald-500" />}
              trend="Good"
              trendDirection="up"
            />
            <StatsCard
              title="Unanswered Queries"
              value={unanswered.length.toString()}
              icon={<AlertCircle size={20} className="text-red-500" />}
              trend="Needs attention"
              trendDirection="neutral"
            />
            <StatsCard
              title="Leads Collected"
              value={leads.length.toString()}
              icon={<Users size={20} className="text-[#566273] dark:text-[#9BAABD]" />}
              trend="Growing"
              trendDirection="up"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Popular Questions */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp size={18} className="text-[#566273] dark:text-[#9BAABD]" />
                <h2 className="text-lg font-semibold text-[#101723] dark:text-[#D7DFE5]">Most Popular Questions</h2>
              </div>
              {popularQuestions.length > 0 ? (
                <div className="space-y-4">
                  {popularQuestions.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-[#F3F7FC] dark:bg-[#141D2B] border border-[#D8DFE9] dark:border-[#2B3646]">
                      <span className="text-body-sm text-[#101723] dark:text-[#D7DFE5] font-medium truncate pr-4">{item.question}</span>
                      <span className="flex-shrink-0 bg-[#E7EDF6] text-[#243040] dark:bg-[#243040] dark:text-[#D7DFE5] text-xs font-bold px-2 py-1 rounded-full">{item.count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[#647184] text-center py-8">No data available yet.</p>
              )}
            </Card>

            {/* Unanswered Queries */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <HelpCircle size={18} className="text-red-500" />
                <h2 className="text-lg font-semibold text-[#101723] dark:text-[#D7DFE5]">Recent Unanswered Queries</h2>
              </div>
              {unanswered.length > 0 ? (
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                  {unanswered.sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 5).map((u) => (
                    <div key={u.id} className="p-3 rounded-lg bg-[#F3F7FC] dark:bg-[#141D2B] border border-[#D8DFE9] dark:border-[#2B3646]">
                      <p className="text-body-sm text-[#101723] dark:text-[#D7DFE5] font-medium mb-1">"{u.query}"</p>
                      <div className="flex justify-between items-center text-xs text-[#647184]">
                        <span>Bot: {getChatbotName(u.chatbotId)}</span>
                        <span>{format(u.timestamp, "MMM d, h:mm a")}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[#647184] text-center py-8">Great job! All queries have been answered.</p>
              )}
            </Card>
          </div>

          {/* Leads Table */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Users size={18} className="text-[#566273] dark:text-[#9BAABD]" />
              <h2 className="text-lg font-semibold text-[#101723] dark:text-[#D7DFE5]">Captured Leads</h2>
            </div>
            {leads.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#D8DFE9] dark:border-[#2B3646]">
                      <th className="py-3 px-4 text-xs font-semibold text-[#647184] uppercase tracking-wider">Email</th>
                      <th className="py-3 px-4 text-xs font-semibold text-[#647184] uppercase tracking-wider">Chatbot</th>
                      <th className="py-3 px-4 text-xs font-semibold text-[#647184] uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D8DFE9] dark:divide-[#2B3646]">
                    {leads.sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime()).map((lead) => (
                      <tr key={lead.id} className="hover:bg-[#F3F7FC] dark:hover:bg-[#141D2B] transition-colors">
                        <td className="py-3 px-4 text-sm font-medium text-[#101723] dark:text-[#D7DFE5]">{lead.email}</td>
                        <td className="py-3 px-4 text-sm text-[#566273] dark:text-[#9BAABD]">{getChatbotName(lead.chatbotId)}</td>
                        <td className="py-3 px-4 text-sm text-[#566273] dark:text-[#9BAABD]">{format(lead.timestamp, "MMM d, yyyy")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-[#647184] text-center py-8">No leads captured yet. Enable Lead Capture in your chatbot settings.</p>
            )}
          </Card>
        </div>
      )}
      </div>
    </div>
  );
}
