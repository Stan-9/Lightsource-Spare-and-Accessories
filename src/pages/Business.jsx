import { Link } from 'react-router-dom';
import { Phone, MapPin, Clock, Shield, Wrench, Zap, Award, ChevronRight } from 'lucide-react';
import Header from '../components/shared/Header';

const Business = () => {
  const services = [
    { icon: Wrench, title: 'Spare Parts Supply', desc: 'Genuine and aftermarket parts for all major motorbike brands. Fast sourcing on request.' },
    { icon: Zap, title: 'Performance Upgrades', desc: 'Exhaust systems, carburetors, sprockets and performance components for serious riders.' },
    { icon: Shield, title: 'Quality Guarantee', desc: 'All products are quality-checked before sale. We stand behind every part we sell.' },
    { icon: Award, title: 'Expert Advice', desc: 'Our team knows bikes. Get free technical advice on fitment, compatibility and maintenance.' },
  ];

  return (
    <div className="min-h-screen bg-darkBg text-white font-poppins">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden py-24 px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-accentOrange/10 via-transparent to-transparent" />
        <div className="absolute top-20 right-20 w-96 h-96 bg-accentOrange/5 rounded-full blur-[100px]" />
        <div className="container mx-auto max-w-5xl relative z-10 text-center">
          <span className="inline-block text-[10px] font-black uppercase tracking-[0.3em] text-accentOrange bg-accentOrange/10 border border-accentOrange/20 px-4 py-2 rounded-full mb-8">
            Business Enquiries
          </span>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6 leading-none">
            Trade &<br />
            <span className="text-accentOrange italic">Wholesale</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed mb-10">
            LightSource Motors supplies motorbike spare parts and accessories to mechanics, boda boda
            operators, and retail businesses across Kenya. Contact us for bulk pricing and fast delivery.
          </p>
          <a
            href="https://wa.me/254116575039?text=Hi%20LightSource%2C%20I%20have%20a%20business%20enquiry"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-accentOrange hover:bg-orange-600 text-white font-black px-10 py-5 rounded-2xl shadow-[0_15px_40px_rgba(255,107,0,0.35)] transition transform hover:-translate-y-1 text-lg"
          >
            <Phone className="w-5 h-5" />
            Chat on WhatsApp
            <ChevronRight className="w-5 h-5" />
          </a>
        </div>
      </section>

      {/* Services */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl font-black tracking-tight text-center mb-4">What We Offer</h2>
          <p className="text-gray-500 text-center mb-14 text-sm">Everything your workshop or fleet needs, in one place.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {services.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-gray-900/50 border border-gray-800 hover:border-accentOrange/30 p-8 rounded-3xl transition group">
                <div className="w-14 h-14 bg-accentOrange/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-accentOrange/20 transition">
                  <Icon className="w-7 h-7 text-accentOrange" />
                </div>
                <h3 className="text-xl font-black mb-3">{title}</h3>
                <p className="text-gray-400 leading-relaxed text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-20 px-4 border-t border-gray-800">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-3xl font-black tracking-tight text-center mb-14">Find Us</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            {[
              { icon: MapPin, label: 'Location', value: 'Nairobi, Kenya' },
              { icon: Phone, label: 'WhatsApp', value: '+254 116 575039' },
              { icon: Clock, label: 'Hours', value: 'Mon–Sat · 8am – 6pm' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-gray-900 border border-gray-800 p-8 rounded-2xl">
                <div className="w-12 h-12 bg-accentOrange/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-6 h-6 text-accentOrange" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">{label}</p>
                <p className="font-bold text-white">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 border-t border-gray-800 bg-gradient-to-t from-gray-900/50">
        <div className="container mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-black mb-4 tracking-tight">Ready to place a bulk order?</h2>
          <p className="text-gray-400 mb-8">We offer competitive wholesale pricing for businesses ordering 10+ units.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/"
              className="bg-gray-800 hover:bg-gray-700 text-white font-bold px-8 py-4 rounded-2xl border border-gray-700 transition"
            >
              Browse Catalogue
            </Link>
            <a
              href="https://wa.me/254116575039?text=Hi%20LightSource%2C%20I%20would%20like%20to%20place%20a%20bulk%20order"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-accentOrange hover:bg-orange-600 text-white font-black px-8 py-4 rounded-2xl shadow-lg shadow-accentOrange/20 transition"
            >
              Request Bulk Quote
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Business;
