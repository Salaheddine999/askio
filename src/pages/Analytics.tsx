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
      const eventsQuery = query(collection(db, "analytics_events"), where("chatbotId", "in", chatbotIds));
      const eventsSnap = await getDocs(eventsQuery);
      setEvents(eventsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date(),
      } as AnalyticsEvent)));

      // 3. Fetch Unanswered Queries
      const unansweredQuery = query(collection(db, "unanswered_queries"), where("chatbotId", "in", chatbotIds));
      const unansweredSnap = await getDocs(unansweredQuery);
      setUnanswered(unansweredSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date(),
      } as UnansweredQuery)));

      // 4. Fetch Leads
      const leadsQuery = query(collection(db, "leads"), where("chatbotId", "in", chatbotIds));
      const leadsSnap = await getDocs(leadsQuery);
      setLeads(leadsSnap.docs.map(doc => ({
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
        <LoaderCircle className="animate-spin text-[#37322F] dark:text-[#F5F5F4]" size={48} />
      </div>
    );
  }

  return (
    <div className="bg-[#F7F5F3] dark:bg-[#1C1917] min-h-screen font-sans text-[#37322F]">
      <Helmet>
        <title>Analytics | Askio Chatbot</title>
      </Helmet>

      <div className="w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-full bg-white dark:bg-[#292524] flex items-center justify-center border border-[#E0DEDB] dark:border-[#44403C] shadow-sm">
          <BarChart2 className="w-5 h-5 text-[#37322F] dark:text-[#F5F5F4]" />
        </div>
        <div>
          <h1 className="text-h1 font-serif text-[#37322F] dark:text-[#F5F5F4]">Analytics & Leads</h1>
          <p className="text-body text-[#605A57] dark:text-[#A8A29E]">Track performance and view collected leads.</p>
        </div>
      </div>

      {chatbots.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <h2 className="text-h3 font-semibold text-[#37322F] dark:text-[#F5F5F4] mb-2">No Chatbots Found</h2>
          <p className="text-body text-[#605A57] dark:text-[#A8A29E]">
            Create a chatbot to start collecting analytics and leads.
          </p>
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
              icon={<Users size={20} className="text-blue-500" />}
              trend="Growing"
              trendDirection="up"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Popular Questions */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp size={18} className="text-indigo-500" />
                <h2 className="text-lg font-semibold text-[#37322F] dark:text-[#F5F5F4]">Most Popular Questions</h2>
              </div>
              {popularQuestions.length > 0 ? (
                <div className="space-y-4">
                  {popularQuestions.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-[#FAFAF9] dark:bg-[#1C1917] border border-[#E0DEDB] dark:border-[#44403C]">
                      <span className="text-body-sm text-[#37322F] dark:text-[#F5F5F4] font-medium truncate pr-4">{item.question}</span>
                      <span className="flex-shrink-0 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 text-xs font-bold px-2 py-1 rounded-full">{item.count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[#A8A29E] text-center py-8">No data available yet.</p>
              )}
            </Card>

            {/* Unanswered Queries */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <HelpCircle size={18} className="text-red-500" />
                <h2 className="text-lg font-semibold text-[#37322F] dark:text-[#F5F5F4]">Recent Unanswered Queries</h2>
              </div>
              {unanswered.length > 0 ? (
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                  {unanswered.sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 5).map((u) => (
                    <div key={u.id} className="p-3 rounded-lg bg-[#FAFAF9] dark:bg-[#1C1917] border border-[#E0DEDB] dark:border-[#44403C]">
                      <p className="text-body-sm text-[#37322F] dark:text-[#F5F5F4] font-medium mb-1">"{u.query}"</p>
                      <div className="flex justify-between items-center text-xs text-[#A8A29E]">
                        <span>Bot: {getChatbotName(u.chatbotId)}</span>
                        <span>{format(u.timestamp, "MMM d, h:mm a")}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[#A8A29E] text-center py-8">Great job! All queries have been answered.</p>
              )}
            </Card>
          </div>

          {/* Leads Table */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Users size={18} className="text-blue-500" />
              <h2 className="text-lg font-semibold text-[#37322F] dark:text-[#F5F5F4]">Captured Leads</h2>
            </div>
            {leads.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#E0DEDB] dark:border-[#44403C]">
                      <th className="py-3 px-4 text-xs font-semibold text-[#78716C] uppercase tracking-wider">Email</th>
                      <th className="py-3 px-4 text-xs font-semibold text-[#78716C] uppercase tracking-wider">Chatbot</th>
                      <th className="py-3 px-4 text-xs font-semibold text-[#78716C] uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E0DEDB] dark:divide-[#44403C]">
                    {leads.sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime()).map((lead) => (
                      <tr key={lead.id} className="hover:bg-[#FAFAF9] dark:hover:bg-[#1C1917] transition-colors">
                        <td className="py-3 px-4 text-sm font-medium text-[#37322F] dark:text-[#F5F5F4]">{lead.email}</td>
                        <td className="py-3 px-4 text-sm text-[#605A57] dark:text-[#A8A29E]">{getChatbotName(lead.chatbotId)}</td>
                        <td className="py-3 px-4 text-sm text-[#605A57] dark:text-[#A8A29E]">{format(lead.timestamp, "MMM d, yyyy")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-[#A8A29E] text-center py-8">No leads captured yet. Enable Lead Capture in your chatbot settings.</p>
            )}
          </Card>
        </div>
      )}
      </div>
    </div>
  );
}
