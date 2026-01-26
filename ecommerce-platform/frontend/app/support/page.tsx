'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { MessageCircle, Phone, Mail, Clock, CheckCircle } from 'lucide-react';

export default function SupportPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Support request submitted:', formData);
    // Handle form submission
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Customer Support</h1>
          <p className="text-gray-600">We're here to help you with any questions or concerns</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center mb-4">
              <MessageCircle className="h-8 w-8 text-primary-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">Live Chat</h2>
            </div>
            <p className="text-gray-600 mb-4">Get instant help from our support team</p>
            <p className="text-sm text-gray-500 mb-4">Available 24/7</p>
            <button className="w-full bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition-colors">
              Start Chat
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center mb-4">
              <Phone className="h-8 w-8 text-primary-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">Phone Support</h2>
            </div>
            <p className="text-gray-600 mb-4">Speak directly with our team</p>
            <p className="text-sm text-gray-500 mb-4">Mon-Fri, 9AM-6PM EST</p>
            <a href="tel:1-800-123-4567" className="block w-full bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition-colors text-center">
              1-800-123-4567
            </a>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center mb-4">
              <Mail className="h-8 w-8 text-primary-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">Email Support</h2>
            </div>
            <p className="text-gray-600 mb-4">Send us a detailed message</p>
            <p className="text-sm text-gray-500 mb-4">Response within 24 hours</p>
            <a href="mailto:support@afrosuperstore.com" className="block w-full bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition-colors text-center">
              Send Email
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Send us a Message</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                  Subject
                </label>
                <select
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select a topic</option>
                  <option value="order">Order Issue</option>
                  <option value="shipping">Shipping Question</option>
                  <option value="return">Return Request</option>
                  <option value="product">Product Information</option>
                  <option value="account">Account Help</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium"
              >
                Send Message
              </button>
            </form>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">How do I track my order?</h3>
                  <p className="text-gray-600">
                    You'll receive a tracking number via email once your order ships. 
                    Use this number on our tracking page or the carrier's website.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">What is your return policy?</h3>
                  <p className="text-gray-600">
                    We offer 30-day returns for unused items in original packaging. 
                    Visit our returns page for more details.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">How long does shipping take?</h3>
                  <p className="text-gray-600">
                    Standard shipping takes 5-7 business days. Express and overnight 
                    options are available at checkout.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Do you offer international shipping?</h3>
                  <p className="text-gray-600">
                    Currently we ship within the United States only. International 
                    shipping is coming soon.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-primary-50 rounded-lg p-6">
              <div className="flex items-center mb-3">
                <Clock className="h-6 w-6 text-primary-600 mr-2" />
                <h3 className="font-semibold text-gray-900">Response Times</h3>
              </div>
              <ul className="text-sm text-gray-600 space-y-2">
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Live Chat: Immediate
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Phone: Business hours only
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Email: Within 24 hours
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
