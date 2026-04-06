import { useState } from 'react';
import { Facebook, Twitter, Linkedin, Instagram, ArrowUp, Mail } from 'lucide-react';
import { toast } from 'sonner';

interface FooterProps {
  onNavigate?: (page: string) => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleNewsletterSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate newsletter signup
    setTimeout(() => {
      toast.success('Successfully subscribed to updates!');
      setEmail('');
      setLoading(false);
    }, 1000);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigation = (page: string) => {
    if (onNavigate) {
      onNavigate(page);
      scrollToTop();
    }
  };

  return (
    <footer className="bg-brand-blue text-white mt-16 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About Section */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img src="/logo.svg" alt="Sahel Resilience Stack" className="w-8 h-8 object-contain" />
              <h3 className="text-lg font-semibold">Sahel Resilience Stack</h3>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              A secure administrative and user-management engine designed for low-resource, edge-first deployments.
            </p>

            {/* Social Media */}
            <div className="flex gap-3 mt-4">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center hover:bg-brand-teal transition-all duration-300 hover:scale-110"
                aria-label="Facebook"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center hover:bg-brand-teal transition-all duration-300 hover:scale-110"
                aria-label="Twitter"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center hover:bg-brand-teal transition-all duration-300 hover:scale-110"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-4 h-4" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center hover:bg-brand-teal transition-all duration-300 hover:scale-110"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  onClick={() => handleNavigation('home')}
                  className="text-gray-300 hover:text-brand-teal transition-colors text-left"
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNavigation('jobs')}
                  className="text-gray-300 hover:text-brand-teal transition-colors text-left"
                >
                  Roles & Access
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNavigation('dashboard')}
                  className="text-gray-300 hover:text-brand-teal transition-colors text-left"
                >
                  Console
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNavigation('contact')}
                  className="text-gray-300 hover:text-brand-teal transition-colors text-left"
                >
                  Contact Us
                </button>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>Deployment-specific contact</li>
              <li>Set your support channel</li>
              <li>
                <a href="mailto:support@example.invalid" className="hover:text-brand-teal transition-colors">
                  support@example.invalid
                </a>
              </li>
              <li>
                <a href="tel:+0000000000" className="hover:text-brand-teal transition-colors">
                  +000 000 0000
                </a>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-semibold mb-4">Updates</h4>
            <p className="text-gray-300 text-sm mb-4">
              Subscribe to receive deployment updates and release notes
            </p>
            <form onSubmit={handleNewsletterSignup} className="space-y-2">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email"
                  required
                  className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-teal focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-teal text-white py-2 rounded-lg font-medium hover:bg-[#3d8568] transition-colors disabled:opacity-50"
              >
                {loading ? 'Subscribing...' : 'Subscribe'}
              </button>
            </form>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-300">
          <p>&copy; {new Date().getFullYear()} Sahel Resilience Stack. Open-source module.</p>
          <div className="flex gap-6">
            <button
              onClick={() => handleNavigation('home')}
              className="hover:text-brand-teal transition-colors"
            >
              Privacy Policy
            </button>
            <button
              onClick={() => handleNavigation('home')}
              className="hover:text-brand-teal transition-colors"
            >
              Terms of Service
            </button>
          </div>
        </div>
      </div>

      {/* Back to Top Button */}
      <button
        onClick={scrollToTop}
        className="fixed bottom-8 right-8 w-12 h-12 bg-brand-teal text-white rounded-full shadow-lg hover:bg-[#3d8568] transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-brand-teal focus:ring-offset-2 z-50"
        aria-label="Scroll to top"
      >
        <ArrowUp className="w-5 h-5 mx-auto" />
      </button>
    </footer>
  );
}
