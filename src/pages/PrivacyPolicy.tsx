export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#F5F3F0] dark:bg-[#1C1917] py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-[#37322F] dark:text-[#F5F5F4] mb-2">
          Privacy Policy
        </h1>
        <p className="text-sm text-[#A8A29E] dark:text-[#78716C] mb-10">
          Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
        </p>

        <div className="space-y-8 text-[#605A57] dark:text-[#D6D3D1] text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-[#37322F] dark:text-[#F5F5F4] mb-3">
              1. Introduction
            </h2>
            <p>
              Askio ("we", "our", "us") provides an AI-powered chatbot platform that allows
              businesses to create and deploy chatbots on their websites and online stores.
              This Privacy Policy explains how we collect, use, and protect your information
              when you use our services, including our Shopify app integration.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#37322F] dark:text-[#F5F5F4] mb-3">
              2. Information We Collect
            </h2>
            <p className="mb-3">We collect the following types of information:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Account Information:</strong> When you sign up, we collect your email
                address and authentication details through Firebase Authentication.
              </li>
              <li>
                <strong>Chatbot Configuration:</strong> We store the chatbot settings you
                create, including titles, instructions, FAQs, appearance preferences, and
                AI persona settings.
              </li>
              <li>
                <strong>Shopify Store Data:</strong> When you install our Shopify app, we
                receive your Shopify store URL and an access token to install the chatbot
                script on your store. We do not access or store your customers' personal
                data, order information, or payment details.
              </li>
              <li>
                <strong>Usage Analytics:</strong> We may collect anonymized usage data to
                improve our services, such as chatbot interaction counts.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#37322F] dark:text-[#F5F5F4] mb-3">
              3. How We Use Your Information
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>To provide and maintain the Askio chatbot service</li>
              <li>To install and manage the chatbot on your connected platforms</li>
              <li>To authenticate your account and secure your data</li>
              <li>To improve our services and user experience</li>
              <li>To communicate with you about service updates</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#37322F] dark:text-[#F5F5F4] mb-3">
              4. Data Storage & Security
            </h2>
            <p>
              Your data is stored securely using Google Firebase infrastructure. We implement
              appropriate technical and organizational measures to protect your personal
              information against unauthorized access, alteration, or destruction.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#37322F] dark:text-[#F5F5F4] mb-3">
              5. Third-Party Services
            </h2>
            <p>We use the following third-party services:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li><strong>Firebase (Google):</strong> Authentication and database storage</li>
              <li><strong>Vercel:</strong> Application hosting</li>
              <li><strong>Google Gemini:</strong> AI-powered chatbot responses</li>
              <li><strong>Shopify:</strong> Store integration (when using the Shopify app)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#37322F] dark:text-[#F5F5F4] mb-3">
              6. Shopify App Data
            </h2>
            <p>
              Our Shopify app only accesses the permissions necessary to install and manage
              the chatbot script on your store (<code className="px-1.5 py-0.5 bg-[#E7E5E4] dark:bg-[#292524] rounded text-xs">write_script_tags</code> and <code className="px-1.5 py-0.5 bg-[#E7E5E4] dark:bg-[#292524] rounded text-xs">read_script_tags</code>).
              We do not access, collect, or store any data about your Shopify store customers.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#37322F] dark:text-[#F5F5F4] mb-3">
              7. Your Rights
            </h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>Access and review the data we hold about you</li>
              <li>Request deletion of your account and associated data</li>
              <li>Disconnect any integrated platforms at any time</li>
              <li>Uninstall the Shopify app, which removes the chatbot from your store</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#37322F] dark:text-[#F5F5F4] mb-3">
              8. Data Retention
            </h2>
            <p>
              We retain your data for as long as your account is active. When you delete your
              account or uninstall the Shopify app, we will delete your associated data within
              30 days.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#37322F] dark:text-[#F5F5F4] mb-3">
              9. Contact Us
            </h2>
            <p>
              If you have any questions about this Privacy Policy or your data, please
              contact us at{" "}
              <a
                href="mailto:support@askio.vercel.app"
                className="text-[#37322F] dark:text-[#F5F5F4] underline hover:opacity-70"
              >
                support@askio.vercel.app
              </a>
              .
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-[#E0DEDB] dark:border-[#44403C]">
          <a
            href="/"
            className="text-sm text-[#605A57] dark:text-[#A8A29E] hover:text-[#37322F] dark:hover:text-[#F5F5F4] transition-colors"
          >
            ← Back to Askio
          </a>
        </div>
      </div>
    </div>
  );
}
