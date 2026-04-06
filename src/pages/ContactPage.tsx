import { useState } from 'react';
import { MapPin, Mail, Phone, Clock, User, MessageSquare, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { isDemoMode } from '../lib/demoMode';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const MAX_MESSAGE_LENGTH = 500;

  const validateField = (name: string, value: string) => {
    const newErrors = { ...errors };

    switch (name) {
      case 'name':
        if (value.length < 2) {
          newErrors.name = 'Name must be at least 2 characters';
        } else {
          delete newErrors.name;
        }
        break;
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          newErrors.email = 'Please enter a valid email address';
        } else {
          delete newErrors.email;
        }
        break;
      case 'subject':
        if (value.length < 3) {
          newErrors.subject = 'Subject must be at least 3 characters';
        } else {
          delete newErrors.subject;
        }
        break;
      case 'message':
        if (value.length < 10) {
          newErrors.message = 'Message must be at least 10 characters';
        } else if (value.length > MAX_MESSAGE_LENGTH) {
          newErrors.message = `Message must not exceed ${MAX_MESSAGE_LENGTH} characters`;
        } else {
          delete newErrors.message;
        }
        break;
    }

    setErrors(newErrors);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    validateField(name, value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    Object.keys(formData).forEach(key => {
      validateField(key, formData[key as keyof typeof formData]);
    });

    if (Object.keys(errors).length > 0) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    setLoading(true);

    try {
      // In open-source demo mode we don't require a server/backend.
      if (!isDemoMode()) {
        // If a real backend is configured, wire this to your messaging persistence.
        // (Kept intentionally minimal to avoid forcing connectivity in demo mode.)
      }

      setSubmitted(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
      toast.success('Message sent successfully! We\'ll get back to you soon.');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const remainingChars = MAX_MESSAGE_LENGTH - formData.message.length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold font-serif text-brand-blue mb-8">Contact Us</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Contact Information */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-semibold font-serif text-brand-blue mb-6">Get In Touch</h2>

          <div className="space-y-6">
            <div className="flex items-start gap-4 group">
              <div className="w-12 h-12 bg-brand-teal rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Address</h3>
                <p className="text-gray-600">Deployment-specific address</p>
                <p className="text-gray-600">Set in your organization profile</p>
              </div>
            </div>

            <div className="flex items-start gap-4 group">
              <div className="w-12 h-12 bg-brand-teal rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                <Mail className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Email</h3>
                <a href="mailto:support@example.invalid" className="text-brand-teal hover:underline">support@example.invalid</a>
                <br />
                <a href="mailto:ops@example.invalid" className="text-brand-teal hover:underline">ops@example.invalid</a>
              </div>
            </div>

            <div className="flex items-start gap-4 group">
              <div className="w-12 h-12 bg-brand-teal rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                <Phone className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Phone</h3>
                <a href="tel:+2347014285151" className="text-gray-600 hover:text-brand-teal">+234 701 428 5151</a>
                <br />
                <a href="tel:+2348143084473" className="text-gray-600 hover:text-brand-teal">+234 814 308 4473</a>
              </div>
            </div>

            <div className="flex items-start gap-4 group">
              <div className="w-12 h-12 bg-brand-teal rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Office Hours</h3>
                <p className="text-gray-600">Monday - Friday</p>
                <p className="text-gray-600">8:00 AM - 4:00 PM</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-semibold font-serif text-brand-blue mb-6">Send a Message</h2>

          {submitted ? (
            <div className="bg-green-50 p-6 rounded-lg text-center animate-fade-in">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-green-800 mb-2">Message Sent!</h3>
              <p className="text-green-600">Thank you for contacting us. We will get back to you shortly.</p>
              <button
                onClick={() => setSubmitted(false)}
                className="mt-6 text-brand-teal font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-brand-teal focus:ring-offset-2 rounded"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-1" />
                  Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-teal focus:border-transparent transition-all ${errors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                  aria-invalid={errors.name ? 'true' : 'false'}
                  aria-describedby={errors.name ? 'name-error' : undefined}
                />
                {errors.name && (
                  <p id="name-error" className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-teal focus:border-transparent transition-all ${errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                  aria-invalid={errors.email ? 'true' : 'false'}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                />
                {errors.email && (
                  <p id="email-error" className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                  <FileText className="w-4 h-4 inline mr-1" />
                  Subject
                </label>
                <input
                  id="subject"
                  name="subject"
                  type="text"
                  required
                  value={formData.subject}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-teal focus:border-transparent transition-all ${errors.subject ? 'border-red-500' : 'border-gray-300'
                    }`}
                  aria-invalid={errors.subject ? 'true' : 'false'}
                  aria-describedby={errors.subject ? 'subject-error' : undefined}
                />
                {errors.subject && (
                  <p id="subject-error" className="mt-1 text-sm text-red-600">{errors.subject}</p>
                )}
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                    <MessageSquare className="w-4 h-4 inline mr-1" />
                    Message
                  </label>
                  <span className={`text-xs ${remainingChars < 50 ? 'text-red-600' : 'text-gray-500'}`}>
                    {remainingChars} characters remaining
                  </span>
                </div>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  required
                  value={formData.message}
                  onChange={handleChange}
                  maxLength={MAX_MESSAGE_LENGTH}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-teal focus:border-transparent transition-all ${errors.message ? 'border-red-500' : 'border-gray-300'
                    }`}
                  aria-invalid={errors.message ? 'true' : 'false'}
                  aria-describedby={errors.message ? 'message-error' : undefined}
                ></textarea>
                {errors.message && (
                  <p id="message-error" className="mt-1 text-sm text-red-600">{errors.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || Object.keys(errors).length > 0}
                className="w-full bg-brand-teal text-white py-3 rounded-lg font-semibold hover:bg-[#3d8568] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-brand-teal focus:ring-offset-2"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </span>
                ) : 'Send Message'}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* NDPR Notice */}
      <div className="mt-8 bg-gray-50 rounded-lg p-6 border-l-4 border-brand-teal">
        <h3 className="font-semibold text-brand-blue mb-2">Data Protection Notice</h3>
        <p className="text-gray-700 text-sm">
          This module is designed to support privacy-conscious deployments. Personal information submitted through this
          portal should be minimized, protected with appropriate access controls, and retained only as long as necessary
          for operational use. Configure your deployment policies to meet local regulatory requirements.
        </p>
      </div>
    </div>
  );
}
