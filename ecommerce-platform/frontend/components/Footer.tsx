'use client';

import Link from 'next/link';
import { Facebook, Twitter, Instagram, Youtube } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-red-600 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <img src="/asca-logo.png" alt="AfroSuperstore" className="h-40 w-auto" />
            <p className="text-white-400 mb-4">
              Your trusted online marketplace for quality products and exceptional service.
            </p>
            <div className="flex space-x-4">
              <Link href="https://www.facebook.com/Afro-Superstore-109974091648528" target="_blank" aria-label="Facebook">
                <Facebook className="h-5 w-5 text-white/70 hover:text-white cursor-pointer transition-colors" />
              </Link>

              <Link href="https://twitter.com/SuperstoreAfro" target="_blank" aria-label="Twitter">
                <Twitter className="h-5 w-5 text-white/70 hover:text-white cursor-pointer transition-colors" />
              </Link>

              <Link href="https://www.instagram.com/invites/contact/?i=1i6ajisga7mju&utm_content=nzvrp0f" target="_blank" aria-label="Instagram">
                <Instagram className="h-5 w-5 text-white/70 hover:text-white cursor-pointer transition-colors" />
              </Link>

              <Link href="https://www.youtube.com/channel/UC_m6-JktOm2Js1gCgu9xRBg" target="_blank" aria-label="YouTube">
                <Youtube className="h-5 w-5 text-white/70 hover:text-white cursor-pointer transition-colors" />
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><Link href="/about" className="text-white-400 hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="/contact" className="text-white-400 hover:text-white transition-colors">Contact</Link></li>
              <li><Link href="/faq" className="text-white-400 hover:text-white transition-colors">FAQ</Link></li>
              <li><Link href="/shipping" className="text-white-400 hover:text-white transition-colors">Shipping Info</Link></li>
              <li><Link href="/returns" className="text-white-400 hover:text-white transition-colors">Returns</Link></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Customer Service</h4>
            <ul className="space-y-2">
              <li><Link href="/track" className="text-white-400 hover:text-white transition-colors">Track Order</Link></li>
              <li><Link href="/account" className="text-white-400 hover:text-white transition-colors">My Account</Link></li>
              <li><Link href="/wishlist" className="text-white-400 hover:text-white transition-colors">Wishlist</Link></li>
              <li><Link href="/support" className="text-white-400 hover:text-white transition-colors">Support</Link></li>
              <li><Link href="/privacy" className="text-white-400 hover:text-white transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Contact Info</h4>
            <div className="space-y-2 text-white-400">
              <p>620 Seventh Ave,</p>
              <p>New Westminster, BC V3M5T6 Canada</p>
              <p>Phone: +1 (604) 866-3550</p>
              <p>Email: info@afrosuperstore.ca</p>
              <div className="mt-4">
                <p className="text-sm mb-2">We Accept:</p>
                <div className="flex space-x-2">
                  <div className="bg-white text-black px-2 py-1 rounded text-xs font-semibold">VISA</div>
                  <div className="bg-white text-black px-2 py-1 rounded text-xs font-semibold">MC</div>
                  <div className="bg-white text-black px-2 py-1 rounded text-xs font-semibold">AMEX</div>
                  <div className="bg-white text-black px-2 py-1 rounded text-xs font-semibold">PP</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white-800 mt-8 pt-8 text-center text-white-400">
          <p>&copy; {currentYear} Afro Superstore. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
