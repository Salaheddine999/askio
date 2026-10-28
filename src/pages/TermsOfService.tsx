import { Link } from "react-router-dom";
import LegalPage, { ContactEmail, Detail, List, Section, Term } from "./legal/LegalPage";

const SECTIONS = [
  { id: "agreement", title: "The agreement" },
  { id: "accounts", title: "Who can use Askio" },
  { id: "acceptable-use", title: "Acceptable use" },
  { id: "your-responsibilities", title: "Your chatbots and your visitors" },
  { id: "ai", title: "AI-generated answers" },
  { id: "content", title: "Your content and our rights" },
  { id: "data-processing", title: "Data processing terms" },
  { id: "plans", title: "Plans, billing and refunds" },
  { id: "integrations", title: "Integrations" },
  { id: "availability", title: "Availability and changes" },
  { id: "termination", title: "Suspension and termination" },
  { id: "warranties", title: "Disclaimers" },
  { id: "liability", title: "Limitation of liability" },
  { id: "indemnity", title: "Indemnity" },
  { id: "law", title: "Governing law" },
  { id: "changes", title: "Changes and contact" },
];

export default function TermsOfService() {
  return (
    <LegalPage
      title="Terms of Service"
      description="The terms for using Askio, the AI chatbot platform for business websites."
      sections={SECTIONS}
      intro={
        <p>
          These terms are an agreement between you and Askio (&quot;we&quot;, &quot;us&quot;), an independent software
          service run from <Detail field="country" />, for using Askio, a platform for creating chatbots and adding them to your website or online
          store. Please read them along with our <Link to="/privacy" className="underline underline-offset-2">Privacy Policy</Link>.
        </p>
      }
    >
      <Section id="agreement" title="1. The agreement">
        <p>
          By creating an account or using Askio, you accept these terms. If you use Askio for a company or organisation,
          you confirm you're allowed to accept them on its behalf, and &quot;you&quot; means that organisation.
        </p>
      </Section>

      <Section id="accounts" title="2. Who can use Askio">
        <List>
          <li>
            Askio is for businesses and professionals using it for their trade or work. You must be at least 18 years old.
          </li>
          <li>Keep your account details accurate and your login secure. You're responsible for activity on your account.</li>
          <li>Tell us promptly if you suspect someone has accessed your account without permission.</li>
        </List>
      </Section>

      <Section id="acceptable-use" title="3. Acceptable use">
        <p>You agree not to use Askio to:</p>
        <List>
          <li>break any law, or infringe anyone's intellectual property, privacy or other rights;</li>
          <li>mislead people, including by presenting your chatbot as a human;</li>
          <li>collect sensitive information such as health, financial or government ID details, or data about children;</li>
          <li>send spam, malware or abusive, hateful or sexually explicit content;</li>
          <li>
            give regulated advice (for example medical, legal or financial) through AI answers without proper human
            oversight;
          </li>
          <li>
            interfere with the service, get around plan limits or rate limits, or try to access systems or data you're not
            allowed to;
          </li>
          <li>copy, resell or reverse engineer the service, except where the law permits it.</li>
        </List>
      </Section>

      <Section id="your-responsibilities" title="4. Your chatbots and your visitors">
        <p>You decide what your chatbot says and where it appears, so you're responsible for:</p>
        <List>
          <li>the FAQs, instructions and other content you add, and checking that your chatbot's answers are suitable;</li>
          <li>
            telling your visitors about the chatbot in your own privacy notice, including that their messages are
            processed by Askio and its AI provider;
          </li>
          <li>
            having a legal basis for the visitor data you collect, such as consent before capturing email addresses, and
            following the laws that apply to you, including on direct marketing;
          </li>
          <li>
            making it clear to visitors that they're talking to an AI assistant, as the EU AI Act and similar laws require.
          </li>
        </List>
      </Section>

      <Section id="ai" title="5. AI-generated answers">
        <p>
          Askio uses third-party AI models (currently Anthropic's Claude, with Google's free Gemini API tier as a backup)
          to generate replies and draft FAQs.
          Content sent for AI processing may be used by the AI provider as described in our{" "}
          <Link to="/privacy#ai" className="underline underline-offset-2">Privacy Policy</Link>, so don't put personal data in
          your chatbot's instructions or FAQs. AI output can be wrong, incomplete or
          out of date, and may not reflect your business's policies. Askio doesn't guarantee the accuracy of AI answers,
          and you shouldn't rely on them for important decisions without checking. You can turn AI replies off so your
          chatbot answers only from your FAQs.
        </p>
      </Section>

      <Section id="content" title="6. Your content and our rights">
        <List>
          <li>
            You keep ownership of everything you add to Askio. You give us permission to host, process and display it
            only as needed to run the service for you.
          </li>
          <li>
            Askio, including its software, design and brand, remains ours. Where parts of Askio are published under an
            open-source licence, that licence governs that code.
          </li>
          <li>
            If you send us feedback or ideas, we may use them to improve Askio without owing you anything.
          </li>
        </List>
      </Section>

      <Section id="data-processing" title="7. Data processing terms">
        <p>
          When your chatbot handles personal data about your visitors, you're the controller and we're your processor.
          These terms form our data processing agreement under Article 28 of the GDPR. We will:
        </p>
        <List>
          <li>process visitor data only to provide Askio to you and on your documented instructions, which are these terms and your chatbot settings;</li>
          <li>make sure the people who process it are bound by confidentiality;</li>
          <li>protect it with appropriate technical and organisational security measures;</li>
          <li>
            use only the sub-processors listed in our <Link to="/privacy#sharing" className="underline underline-offset-2">Privacy Policy</Link>,
            tell you before we add or replace one so you can object, and bind each to equivalent data protection terms;
          </li>
          <li>transfer data outside the EEA only with appropriate safeguards, such as Standard Contractual Clauses;</li>
          <li>help you respond to requests from visitors exercising their rights, and with security and impact assessments;</li>
          <li>tell you without undue delay if we become aware of a breach affecting visitor data;</li>
          <li>delete visitor data when you delete your account, unless the law requires us to keep it;</li>
          <li>give you the information needed to show we meet these obligations, and allow reasonable audits.</li>
        </List>
        <p>
          Visitor data may include chat messages, email addresses submitted through lead capture, feedback ratings, an
          anonymous browser identifier and hashed IP addresses, as described in our Privacy Policy.
        </p>
      </Section>

      <Section id="plans" title="8. Plans, billing and refunds">
        <List>
          <li>
            Askio has a free plan and paid plans. Each plan's features and limits, such as the number of monthly AI
            replies, are shown on our pricing page. When a limit is reached, your chatbot keeps answering from your FAQs.
          </li>
          <li>
            Paid plans are sold by our reseller and merchant of record, <Term>Lemon Squeezy</Term>, which handles payment,
            invoices and sales tax. Its terms also apply to your purchase.
          </li>
          <li>
            Subscriptions renew automatically each month or year until you cancel. You can cancel any time from Settings;
            you keep paid features until the end of the period you've paid for.
          </li>
          <li>
            Fees are non-refundable except where the law requires a refund or we decide to give one. If something has gone
            wrong, contact <ContactEmail />.
          </li>
          <li>We'll tell you in advance before changing the price of your plan, and you can cancel before it applies.</li>
        </List>
      </Section>

      <Section id="integrations" title="9. Integrations">
        <p>
          Askio works with services such as WordPress, Shopify and Wix. Using them is subject to their own terms, and we're
          not responsible for how they operate. Disconnecting an integration or uninstalling our Shopify app removes the
          chatbot from that platform.
        </p>
      </Section>

      <Section id="availability" title="10. Availability and changes">
        <p>
          We work to keep Askio available and reliable, but we don't promise it will always be uninterrupted or error-free.
          We may update, add or remove features. If we remove something significant from a paid plan, we'll tell you
          beforehand.
        </p>
      </Section>

      <Section id="termination" title="11. Suspension and termination">
        <List>
          <li>You can stop using Askio at any time and delete your account in Settings.</li>
          <li>
            We may suspend or close an account that breaks these terms, creates legal or security risk, or hasn't paid,
            and we'll tell you why unless the law or a security risk prevents it.
          </li>
          <li>
            When an account is deleted, its chatbots stop working and its data is deleted as described in our Privacy
            Policy.
          </li>
        </List>
      </Section>

      <Section id="warranties" title="12. Disclaimers">
        <p>
          Askio is provided &quot;as is&quot; and &quot;as available&quot;. To the extent the law allows, we make no
          warranties, express or implied, including about merchantability, fitness for a particular purpose,
          non-infringement or the accuracy of AI-generated content.
        </p>
      </Section>

      <Section id="liability" title="13. Limitation of liability">
        <p>
          To the extent the law allows, we aren't liable for indirect or consequential losses, or for loss of profit,
          revenue, data or goodwill. Our total liability for any claims related to Askio is limited to the amount you paid
          us in the 12 months before the claim arose, or €100 if that is higher. Nothing in these terms limits liability
          that can't be limited by law, such as for fraud, intent or gross negligence.
        </p>
      </Section>

      <Section id="indemnity" title="14. Indemnity">
        <p>
          You agree to compensate us for claims brought by third parties, including your visitors, that arise from your
          content, your chatbot's use on your website, or your breach of these terms or of the law.
        </p>
      </Section>

      <Section id="law" title="15. Governing law">
        <p>
          These terms are governed by the laws of <Detail field="country" />. Disputes go to <Detail field="courts" />,
          unless the law where you are gives you the right to bring them elsewhere.
        </p>
      </Section>

      <Section id="changes" title="16. Changes and contact">
        <p>
          We may update these terms. For significant changes we'll update the effective date and notify you by email or in
          the app at least 30 days before they apply. Continuing to use Askio after that means you accept the new terms;
          if you don't, you can close your account.
        </p>
        <p>
          Contact: <ContactEmail />.
        </p>
      </Section>
    </LegalPage>
  );
}
