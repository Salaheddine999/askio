import { Link } from "react-router-dom";
import LegalPage, { ContactEmail, Detail, List, Section, Term, ToConfirm } from "./legal/LegalPage";
import { CONFIRMED } from "./legal/company";

const SECTIONS = [
  { id: "who-we-are", title: "Who we are" },
  { id: "account-data", title: "Data about you as a customer" },
  { id: "visitor-data", title: "Data about visitors to your chatbot" },
  { id: "use-and-legal-basis", title: "How we use data and why" },
  { id: "ai", title: "AI processing" },
  { id: "storage", title: "Cookies and browser storage" },
  { id: "sharing", title: "Service providers and transfers" },
  { id: "retention", title: "How long we keep data" },
  { id: "rights", title: "Your rights" },
  { id: "security", title: "Security" },
  { id: "children", title: "Children" },
  { id: "changes", title: "Changes and contact" },
];

export default function PrivacyPolicy() {
  return (
    <LegalPage
      title="Privacy Policy"
      description="How Askio collects, uses and protects personal data for its customers and their website visitors."
      sections={SECTIONS}
      intro={
        <>
          <p>
            Askio is a platform for building chatbots that businesses put on their own websites and online stores.
            This policy explains what personal data we handle, why, and what control you have over it.
          </p>
          <p>
            It covers two groups of people: <Term>our customers</Term>, the businesses and people who create an
            Askio account, and <Term>visitors</Term>, the people who chat with a chatbot on a customer's website.
          </p>
        </>
      }
    >
      <Section id="who-we-are" title="1. Who we are">
        <p>
          Askio is an independent software service, run from <Detail field="country" />. It isn't a registered company.
          In this policy, &quot;Askio&quot;, &quot;we&quot; and &quot;us&quot; mean the people who run it.
        </p>
        <List>
          <li>
            For <Term>customer data</Term> (section 2), we are the <Term>controller</Term>: we decide how and why it is
            processed.
          </li>
          <li>
            For <Term>visitor data</Term> (section 3), the business running the chatbot is the controller and we are
            its <Term>processor</Term>: we handle that data on the business's behalf and following its instructions, as
            described in our <Link to="/terms#data-processing" className="underline underline-offset-2">data processing terms</Link>.
            Visitors with questions about that data should contact the business whose website they were on first.
          </li>
        </List>
        <p>
          Privacy questions and requests can be sent to <ContactEmail />.
        </p>
      </Section>

      <Section id="account-data" title="2. Data about you as a customer">
        <List>
          <li>
            <Term>Account details:</Term> your email address and, if you sign in with Google, your name and profile
            photo. Passwords are handled by Firebase Authentication; we never see them.
          </li>
          <li>
            <Term>Chatbot content:</Term> everything you configure, such as chatbot names, FAQs, greetings, AI
            instructions, appearance and integration settings.
          </li>
          <li>
            <Term>Website content you ask us to read:</Term> when you use AI FAQ generation, we fetch the public web page
            you enter and send its text to our AI provider to draft FAQs.
          </li>
          <li>
            <Term>Billing details:</Term> your plan, subscription status and the customer and subscription identifiers
            from our payment provider, Lemon Squeezy. Card details are handled entirely by Lemon Squeezy; we never receive
            them.
          </li>
          <li>
            <Term>Shopify connection:</Term> if you connect a store, its <code>myshopify.com</code> address and which
            chatbot it uses. Shopify gives us an access token that we use once to add the chatbot script to your store; we
            don't store it, and we don't access your store's products, orders or customer records.
          </li>
          <li>
            <Term>Usage information:</Term> how many AI replies your chatbots use each month, to apply plan limits.
          </li>
          <li>
            <Term>Our website:</Term> we use Vercel Web Analytics, a cookieless service that reports aggregated page
            views, referrers, device types and approximate country. It doesn't identify individual visitors.
          </li>
          <li>
            <Term>Messages to us:</Term> what you send when you contact support.
          </li>
        </List>
      </Section>

      <Section id="visitor-data" title="3. Data about visitors to your chatbot">
        <p>When someone chats with an Askio chatbot on a customer's website, we process:</p>
        <List>
          <li>
            <Term>Messages:</Term> what the visitor types, so the chatbot can answer from the business's FAQs or with AI.
            Questions are logged for the business's analytics, and questions the chatbot couldn't answer are saved so the
            business can add answers.
          </li>
          <li>
            <Term>Email address:</Term> if the business turns on lead capture and the visitor chooses to enter it.
          </li>
          <li>
            <Term>Feedback:</Term> whether the visitor rated an answer as helpful or not.
          </li>
          <li>
            <Term>An anonymous browser ID:</Term> a random identifier stored in the visitor's browser (see section 6) that
            links a visitor's feedback and questions together. It doesn't contain any personal details.
          </li>
          <li>
            <Term>A hashed IP address:</Term> converted with a one-way hash, never stored in readable form, and used only to
            limit abuse of AI replies.
          </li>
        </List>
        <p>
          Businesses using Askio are responsible for telling their visitors about this in their own privacy notice and for
          having a legal basis for it, such as consent for lead capture. Visitors shouldn't share sensitive information
          (for example health or financial details) in a chatbot.
        </p>
      </Section>

      <Section id="use-and-legal-basis" title="4. How we use data and why">
        <List>
          <li>
            <Term>To provide the service</Term> you signed up for: running your account, chatbots, integrations and billing.
            Legal basis: performance of our contract with you.
          </li>
          <li>
            <Term>To keep Askio secure and reliable:</Term> preventing abuse, rate limiting and fixing problems. Legal basis:
            our legitimate interest in protecting the service and its users.
          </li>
          <li>
            <Term>To understand and improve Askio</Term> using aggregated website analytics and product usage. Legal basis:
            our legitimate interest in improving our product.
          </li>
          <li>
            <Term>To communicate with you</Term> about your account, service changes and support requests. Legal basis:
            performance of our contract, or our legitimate interest for important service notices.
          </li>
          <li>
            <Term>To meet legal obligations</Term>, such as tax and accounting rules. Legal basis: legal obligation.
          </li>
        </List>
        <p>
          We process visitor data only to run the chatbot for the business that added it, never for our own marketing. We
          don't sell personal data and don't use it for advertising.
        </p>
      </Section>

      <Section id="ai" title="5. AI processing">
        <p>
          AI replies and AI-drafted FAQs are generated by Google's Gemini models. To answer a visitor, we send the
          chatbot's instructions and FAQs, the visitor's message and a few of the previous messages in that conversation.
        </p>
        <p>
          We currently use Google's free Gemini API tier. Under Google's terms for that tier, Google may use the content
          we send it, including visitors' messages, to provide and improve its products, and people at Google may review
          it. For this reason, visitors shouldn't share personal or sensitive information in a chatbot, and businesses
          shouldn't put personal data in their chatbot's instructions or FAQs. If we move to a paid tier, where Google
          doesn't use the content this way, we'll update this section.
        </p>
        <p>
          AI answers can be inaccurate. Chatbots built with Askio are AI systems, and visitors should be able to see that
          they're talking to an AI assistant, not a person.
        </p>
      </Section>

      <Section id="storage" title="6. Cookies and browser storage">
        <p>
          Askio doesn't use advertising or cross-site tracking cookies, and our website analytics are cookieless. We use
          browser storage only for things the service needs or that you choose:
        </p>
        <List>
          <li>
            <Term>In the Askio app:</Term> keeping you signed in (Firebase Authentication), and remembering preferences like
            dark mode, sidebar layout and when you last checked notifications.
          </li>
          <li>
            <Term>In chatbots on customers' websites:</Term> the anonymous browser ID described in section 3, whether the
            visitor has already given feedback, and whether the greeting bubble has been shown, so it isn't repeated.
          </li>
        </List>
        <p>
          You can clear this storage at any time in your browser settings. Doing so signs you out of the app and resets
          chatbot preferences.
        </p>
      </Section>

      <Section id="sharing" title="7. Service providers and transfers">
        <p>We share data only with providers that help us run Askio:</p>
        <List>
          <li>
            <Term>Google (Firebase and Gemini):</Term> sign-in, database storage and AI responses.
          </li>
          <li>
            <Term>Vercel:</Term> hosting, server functions and cookieless website analytics.
          </li>
          <li>
            <Term>Lemon Squeezy:</Term> our merchant of record, which sells subscriptions on our behalf and handles payments,
            invoices and sales tax. It processes your billing information under its own privacy policy.
          </li>
          <li>
            <Term>Shopify:</Term> only if you connect a store.
          </li>
        </List>
        <p>
          Data is stored and processed by these providers, mainly in the United States, and Askio is run from{" "}
          <Detail field="country" />, so personal data may be accessed from outside the country you're in. Where data
          from the European Economic Area is transferred, our providers rely on the EU-U.S. Data Privacy Framework or the
          European Commission's Standard Contractual Clauses.
        </p>
        <p>We may also disclose data where the law requires it, or to protect the rights and safety of Askio and its users.</p>
      </Section>

      <Section id="retention" title="8. How long we keep data">
        <List>
          <li>
            <Term>Account and chatbot data</Term> is kept while your account is open.
          </li>
          <li>
            <Term>Visitor data</Term> (questions, leads, feedback and analytics) is kept while the business's account is
            open, unless the business asks us to delete it sooner.
          </li>
          <li>
            <Term>Rate-limiting records</Term> (hashed IP addresses) are only needed for a few minutes.{" "}
            <ToConfirm confirmed={CONFIRMED.rateLimitCleanup}>
              They're deleted automatically, usually within a day.
            </ToConfirm>
          </li>
          <li>
            <Term>When you delete your account</Term> in Settings, we cancel any active subscription and immediately delete
            your account, your chatbots and all visitor data they collected from our systems. Copies may remain in our
            providers' backups for a limited time before being overwritten.
          </li>
          <li>
            <Term>Billing records</Term> are kept by Lemon Squeezy for as long as tax law requires.
          </li>
        </List>
      </Section>

      <Section id="rights" title="9. Your rights">
        <p>
          Depending on where you live, including under the EU's GDPR and Morocco's Law 09-08, you can ask us to:
        </p>
        <List>
          <li>give you a copy of your personal data, or send it to another service in a portable format;</li>
          <li>correct data that is wrong or incomplete;</li>
          <li>delete your data (you can also delete your account yourself in Settings);</li>
          <li>restrict how we use your data, or object to processing based on our legitimate interests.</li>
        </List>
        <p>
          Email <ContactEmail /> to make a request. We'll reply within one month. Visitors to a
          customer's chatbot should contact that business, and we'll help it respond.
        </p>
        <p>
          If you think we've mishandled your data, you can complain to the data protection authority where you live. In
          the EU, that's your national authority; in Morocco, it's the CNDP (Commission Nationale de contrôle de la
          protection des Données à caractère Personnel).
        </p>
      </Section>

      <Section id="security" title="10. Security">
        <p>
          Data is encrypted in transit and stored with Google Cloud. Access to accounts and data is restricted by
          authentication and database security rules. No system is perfectly secure, but if a breach affecting your data
          occurs, we'll notify you and the relevant authorities as the law requires.
        </p>
      </Section>

      <Section id="children" title="11. Children">
        <p>
          Askio is a service for businesses and isn't intended for anyone under 16. We don't knowingly collect data from
          children. If you think a child has given us personal data, contact us and we'll delete it.
        </p>
      </Section>

      <Section id="changes" title="12. Changes and contact">
        <p>
          If we change this policy in a meaningful way, we'll update the effective date above and let customers know by
          email or in the app before the change takes effect.
        </p>
        <p>
          Contact: <ContactEmail />.
        </p>
      </Section>
    </LegalPage>
  );
}
