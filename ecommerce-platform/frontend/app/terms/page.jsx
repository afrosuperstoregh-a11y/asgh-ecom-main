import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms and Conditions</h1>
          <p className="text-xl text-gray-600">Please read these terms carefully</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-8">
          <div className="prose max-w-none">
            <p className="text-gray-600 mb-6">
              Last updated: {new Date().toLocaleDateString()}
            </p>
            
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-600 mb-4">
              By accessing and using Afro Suprstore, you accept and agree to be bound by the terms and provision of this agreement.
            </p>
            
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">2. Use License</h2>
            <p className="text-gray-600 mb-4">
              Permission is granted to temporarily download one copy of the materials on Afro Suprstore for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title.
            </p>
            
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">3. Disclaimer</h2>
            <p className="text-gray-600 mb-4">
              The materials on Afro Suprstore are provided on an 'as is' basis. Afro Suprstore makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties.
            </p>
            
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">4. Limitations</h2>
            <p className="text-gray-600 mb-4">
              In no event shall Afro Suprstore or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Afro Suprstore.
            </p>
            
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">5. Privacy Policy</h2>
            <p className="text-gray-600 mb-4">
              Your privacy is important to us. Our Privacy Policy outlines how we collect, use, and protect your information when you use our services.
            </p>
            
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">6. Product Information</h2>
            <p className="text-gray-600 mb-4">
              We strive to be as accurate as possible in the descriptions of our products. However, we do not warrant that product descriptions, colors, information, or other content of the products are accurate, complete, reliable, current, or error-free.
            </p>
            
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">7. Pricing and Availability</h2>
            <p className="text-gray-600 mb-4">
              All prices are shown in USD and are subject to change without notice. We reserve the right to modify or discontinue a product at any time.
            </p>
            
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">8. User Accounts</h2>
            <p className="text-gray-600 mb-4">
              If you create an account on our website, you are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.
            </p>
            
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">9. Prohibited Activities</h2>
            <p className="text-gray-600 mb-4">
              You may not use our services for any illegal or unauthorized purpose. You may not use our site to: transmit spam, send unsolicited communications, or interfere with or circumvent the security features of the service.
            </p>
            
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">10. Intellectual Property</h2>
            <p className="text-gray-600 mb-4">
              All content included on this site, such as text, graphics, logos, images, and data compilations, is the property of Afro Suprstore or its content suppliers and is protected by international copyright laws.
            </p>
            
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">11. Termination</h2>
            <p className="text-gray-600 mb-4">
              We may terminate or suspend your account and bar access to the service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever.
            </p>
            
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">12. Changes to Terms</h2>
            <p className="text-gray-600 mb-4">
              We reserve the right to modify these terms at any time. If we make material changes, we will notify you by email or by posting a notice on our site prior to the change becoming effective.
            </p>
            
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">13. Contact Information</h2>
            <p className="text-gray-600 mb-6">
              Questions about the Terms and Conditions should be sent to us at legal@afrosuprstore.com
            </p>
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <Link 
            href="/auth/register"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            Back to Registration
          </Link>
        </div>
      </main>
    </div>
  );
}
