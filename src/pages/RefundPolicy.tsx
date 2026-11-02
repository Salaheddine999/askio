import { Link } from "react-router-dom";
import LegalPage, { ContactEmail, List, Section, Term } from "./legal/LegalPage";

const SECTIONS = [
  { id: "guarantee", title: "14-day money-back guarantee" },
  { id: "renewals", title: "Renewals and cancelling" },
  { id: "billing-errors", title: "Billing mistakes" },
  { id: "not-covered", title: "When we don't refund" },
  { id: "request", title: "How to ask for a refund" },
  { id: "your-rights", title: "Your legal rights" },
  { id: "changes", title: "Changes and contact" },
];

export default function RefundPolicy() {
  return (
    <LegalPage
      title="Refund Policy"
      description="When Askio refunds a paid plan, and how to ask for a refund."
      sections={SECTIONS}
      intro={
        <>
          <p>
            We want you to pay for Askio only if it works for you. This policy explains when we refund a paid plan. It's
            part of our <Link to="/terms#plans" className="underline underline-offset-2">Terms of Service</Link>.
          </p>
          <p>
            Paid plans are sold by our merchant of record, <Term>Lemon Squeezy</Term>, which processes every refund.
            The free plan costs nothing, so there's nothing to refund.
          </p>
        </>
      }
    >
      <Section id="guarantee" title="1. 14-day money-back guarantee">
        <p>
          If Askio isn't right for you, ask within <Term>14 days</Term> of your first payment for a paid plan and we'll
          refund it in full, monthly or yearly. No questions asked.
        </p>
        <List>
          <li>The guarantee applies once per customer, to the first payment for a paid plan.</li>
          <li>After the refund, your account moves back to the free plan. Your chatbots and FAQs stay.</li>
        </List>
      </Section>

      <Section id="renewals" title="2. Renewals and cancelling">
        <List>
          <li>
            Subscriptions renew automatically. You can cancel any time from Settings; you keep paid features until the
            end of the period you've paid for, and you won't be charged again.
          </li>
          <li>We don't refund monthly renewals or the unused part of a period after you cancel.</li>
          <li>
            If a yearly plan renewed and you meant to cancel, ask within 14 days of the renewal and we'll refund it,
            as long as you haven't used the paid features since.
          </li>
        </List>
      </Section>

      <Section id="billing-errors" title="3. Billing mistakes">
        <p>
          If you were charged twice, charged after cancelling, or charged the wrong amount, we'll refund the extra
          charge, whenever you notice it.
        </p>
      </Section>

      <Section id="not-covered" title="4. When we don't refund">
        <List>
          <li>When the 14 days above have passed, except for billing mistakes.</li>
          <li>
            When we suspend or close an account for breaking our{" "}
            <Link to="/terms#acceptable-use" className="underline underline-offset-2">acceptable use rules</Link>.
          </li>
          <li>When a refund request is part of repeated sign-ups to get the guarantee more than once.</li>
        </List>
        <p>
          If something went wrong that isn't covered here, such as a long outage, write to us anyway. We look at every
          request and may refund at our discretion.
        </p>
      </Section>

      <Section id="request" title="5. How to ask for a refund">
        <List>
          <li>
            Email <ContactEmail /> from the address on your Askio account, with the date of the payment. You can also
            reply to your Lemon Squeezy receipt.
          </li>
          <li>We'll reply within 2 business days.</li>
          <li>
            Refunds go back to the original payment method. Your bank usually shows them within 5 to 10 business days.
          </li>
        </List>
        <p>
          Please contact us before disputing a charge with your bank. We can usually sort it out faster, and a dispute
          can delay the refund.
        </p>
      </Section>

      <Section id="your-rights" title="6. Your legal rights">
        <p>
          This policy adds to your rights; it doesn't take any away. If the law where you live gives you a right to
          cancel or a refund, such as the 14-day right of withdrawal for consumers in the EU and UK, you keep that right.
        </p>
      </Section>

      <Section id="changes" title="7. Changes and contact">
        <p>
          We may update this policy. Changes apply to payments made after the new effective date, never to ones you've
          already made.
        </p>
        <p>
          Contact: <ContactEmail />.
        </p>
      </Section>
    </LegalPage>
  );
}
