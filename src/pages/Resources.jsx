import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Header from '../components/shared/Header';
import { BookOpen, ShieldCheck, Camera, Wrench, Eye, ArrowLeft, Home, ChevronRight } from 'lucide-react';
import { updateSEO } from '../services/seo';

const Resources = () => {
  const { pathname } = useLocation();

  // Determine view based on pathname
  const isInstallationGuides = pathname.endsWith('installation-guides');
  const isMaintenanceTips = pathname.endsWith('maintenance-tips');
  const isCustomerShowcase = pathname.endsWith('customer-showcase');
  const isHub = !isInstallationGuides && !isMaintenanceTips && !isCustomerShowcase;

  // Dynamic SEO Setup
  useEffect(() => {
    let title = 'Resources & Guides Hub';
    let description = 'Motorbike maintenance documentation, professional installation tutorials, and custom customer build highlights by LightSource Motors.';
    
    if (isInstallationGuides) {
      title = 'Motorbike Parts Installation Guides';
      description = 'Step-by-step technical guides for installing headlights, horn modules, masks, and accessories on motorbikes safely.';
    } else if (isMaintenanceTips) {
      title = 'Basic Motorbike Maintenance Tips';
      description = 'Increase the operational lifespan of your bike components with routine checklist reviews and structural component care guidelines.';
    } else if (isCustomerShowcase) {
      title = 'Customer Build Showcase';
      description = 'Expose premium motorbike customization profiles, featuring LightSource specialized light, horn, and styling accessories.';
    }

    updateSEO({
      title,
      description,
      canonicalUrl: `${window.location.origin}${pathname}`,
      schemaData: {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": title,
        "description": description,
        "author": {
          "@type": "Organization",
          "name": "LightSource Motors Technical Desk"
        }
      }
    });
  }, [pathname, isInstallationGuides, isMaintenanceTips, isCustomerShowcase, isHub]);

  // Main navigation breadcrumbs
  const Breadcrumbs = ({ subTitle }) => (
    <nav className="container mx-auto px-4 py-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500 font-technical border-b border-machineGray/30 mb-8">
      <Link to="/" className="hover:text-accentOrange flex items-center gap-1"><Home className="w-3 h-3" /> Home</Link>
      <ChevronRight className="w-3 h-3 text-gray-700" />
      <Link to="/resources" className="hover:text-accentOrange">Resources</Link>
      {subTitle && (
        <>
          <ChevronRight className="w-3 h-3 text-gray-700" />
          <span className="text-accentOrange">{subTitle}</span>
        </>
      )}
    </nav>
  );

  return (
    <div className="min-h-screen bg-darkBg text-white flex flex-col font-utilitarian selection:bg-accentOrange/30">
      <Header />

      {isHub && (
        <>
          <Breadcrumbs />
          <main className="flex-1 container mx-auto px-4 py-16 max-w-6xl">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h1 className="text-4xl sm:text-5xl font-black font-technical uppercase tracking-tighter text-white mb-4">
                Resources &amp; Technical Desk
              </h1>
              <p className="text-gray-500 text-sm uppercase tracking-wider">
                Access certified installation manuals, operational guidelines, and mechanical blueprints.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              {/* Card 1: Installation Guides */}
              <Link 
                to="/resources/installation-guides" 
                className="bg-machineGray/20 border-2 border-machineGray/50 hover:border-accentOrange hover:shadow-[0_0_25px_rgba(200,122,62,0.15)] p-8 rounded-sm transition flex flex-col group"
              >
                <div className="w-12 h-12 bg-machineGray/40 rounded-sm flex items-center justify-center border border-machineGray group-hover:border-accentOrange group-hover:bg-accentOrange/10 transition mb-6">
                  <Wrench className="w-5 h-5 text-accentOrange" />
                </div>
                <h3 className="text-lg font-black font-technical uppercase text-white tracking-wider group-hover:text-accentOrange transition-colors mb-2">
                  Installation Guides
                </h3>
                <p className="text-gray-500 text-xs uppercase tracking-wider leading-relaxed mb-8 flex-1">
                  Technical manuals detailing certified installation procedures for horn modules, headlight assemblies, and body guards.
                </p>
                <span className="text-[10px] font-black text-accentOrange uppercase tracking-[0.2em] font-technical flex items-center gap-1">
                  View Guides <ChevronRight className="w-4 h-4" />
                </span>
              </Link>

              {/* Card 2: Maintenance Tips */}
              <Link 
                to="/resources/maintenance-tips" 
                className="bg-machineGray/20 border-2 border-machineGray/50 hover:border-accentOrange hover:shadow-[0_0_25px_rgba(200,122,62,0.15)] p-8 rounded-sm transition flex flex-col group"
              >
                <div className="w-12 h-12 bg-machineGray/40 rounded-sm flex items-center justify-center border border-machineGray group-hover:border-accentOrange group-hover:bg-accentOrange/10 transition mb-6">
                  <ShieldCheck className="w-5 h-5 text-accentOrange" />
                </div>
                <h3 className="text-lg font-black font-technical uppercase text-white tracking-wider group-hover:text-accentOrange transition-colors mb-2">
                  Maintenance Tips
                </h3>
                <p className="text-gray-500 text-xs uppercase tracking-wider leading-relaxed mb-8 flex-1">
                  Routine checks, wear diagnosis indicators, and lubrication steps to maintain hardware integrity and operation metrics.
                </p>
                <span className="text-[10px] font-black text-accentOrange uppercase tracking-[0.2em] font-technical flex items-center gap-1">
                  View Tips <ChevronRight className="w-4 h-4" />
                </span>
              </Link>

              {/* Card 3: Customer Showcase */}
              <Link 
                to="/resources/customer-showcase" 
                className="bg-machineGray/20 border-2 border-machineGray/50 hover:border-accentOrange hover:shadow-[0_0_25px_rgba(200,122,62,0.15)] p-8 rounded-sm transition flex flex-col group"
              >
                <div className="w-12 h-12 bg-machineGray/40 rounded-sm flex items-center justify-center border border-machineGray group-hover:border-accentOrange group-hover:bg-accentOrange/10 transition mb-6">
                  <Camera className="w-5 h-5 text-accentOrange" />
                </div>
                <h3 className="text-lg font-black font-technical uppercase text-white tracking-wider group-hover:text-accentOrange transition-colors mb-2">
                  Customer Showcase
                </h3>
                <p className="text-gray-500 text-xs uppercase tracking-wider leading-relaxed mb-8 flex-1">
                  Profiles of modified motorbikes featuring LightSource customized headlights, styling masks, and dual horns setups.
                </p>
                <span className="text-[10px] font-black text-accentOrange uppercase tracking-[0.2em] font-technical flex items-center gap-1">
                  View Builds <ChevronRight className="w-4 h-4" />
                </span>
              </Link>
            </div>
          </main>
        </>
      )}

      {isInstallationGuides && (
        <>
          <Breadcrumbs subTitle="Installation Guides" />
          <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
            <Link to="/resources" className="inline-flex items-center gap-2 text-[10px] font-black uppercase text-gray-500 hover:text-accentOrange mb-8 font-technical">
              <ArrowLeft className="w-4 h-4" /> Back to Resources
            </Link>

            <h1 className="text-3xl sm:text-4xl font-black font-technical uppercase text-white tracking-tight mb-8">
              Certified Installation Manuals
            </h1>

            <div className="flex flex-col gap-8">
              <article className="border-2 border-machineGray p-6 rounded-sm bg-machineGray/10">
                <span className="text-[9px] font-black text-accentOrange uppercase tracking-widest font-technical">Installation Unit 01</span>
                <h3 className="text-lg font-black font-technical uppercase text-white mt-2 mb-4">Dual Horn Relay Wiring Sequence</h3>
                <p className="text-gray-400 text-xs uppercase tracking-wider leading-relaxed mb-4">
                  Installing performance dual-horns requires a standard 12V automotive relay integration to prevent high electrical load onto stock handle switches. Ensure wire gauges conform to AWG 16 standard specifications.
                </p>
                <div className="p-4 bg-pitchBlack border border-machineGray text-xs font-bold font-technical text-accentOrange rounded-sm">
                  {"Pin 30 -> 12V Fuse Battery (+) // Pin 85 -> Ground (-) // Pin 86 -> OEM Switch Hot Lead // Pin 87 -> Horn Connectors (+)"}
                </div>
              </article>

              <article className="border-2 border-machineGray p-6 rounded-sm bg-machineGray/10">
                <span className="text-[9px] font-black text-accentOrange uppercase tracking-widest font-technical">Installation Unit 02</span>
                <h3 className="text-lg font-black font-technical uppercase text-white mt-2 mb-4">LED Projector Headlight Mounting & Aiming</h3>
                <p className="text-gray-400 text-xs uppercase tracking-wider leading-relaxed">
                  Projector lens housings must be securely aligned relative to the horizon line. Avoid aiming high beams directly into oncoming lanes. Mount brackets with thread-locking compounds to absorb road vibration stress.
                </p>
              </article>
            </div>
          </main>
        </>
      )}

      {isMaintenanceTips && (
        <>
          <Breadcrumbs subTitle="Maintenance Tips" />
          <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
            <Link to="/resources" className="inline-flex items-center gap-2 text-[10px] font-black uppercase text-gray-500 hover:text-accentOrange mb-8 font-technical">
              <ArrowLeft className="w-4 h-4" /> Back to Resources
            </Link>

            <h1 className="text-3xl sm:text-4xl font-black font-technical uppercase text-white tracking-tight mb-8">
              Lifespan & Maintenance Checklists
            </h1>

            <div className="flex flex-col gap-6">
              <div className="border border-machineGray p-5 rounded-sm">
                <h3 className="text-sm font-black uppercase text-accentOrange font-technical mb-2">1. Electrical Diagnostic Check</h3>
                <p className="text-gray-400 text-xs uppercase tracking-wider leading-relaxed">
                  Check terminals for green copper oxide scaling. Clean battery posts with water-soda paste and seal with technical grease to maintain stable power outputs for auxiliary lighting components.
                </p>
              </div>

              <div className="border border-machineGray p-5 rounded-sm">
                <h3 className="text-sm font-black uppercase text-accentOrange font-technical mb-2">2. Optical Housing Seals</h3>
                <p className="text-gray-400 text-xs uppercase tracking-wider leading-relaxed">
                  Inspect sealing gaskets weekly. Ingress of moisture inside headlights degrades reflector plating. Replace rubber caps immediately if micro-fractures are detected.
                </p>
              </div>
            </div>
          </main>
        </>
      )}

      {isCustomerShowcase && (
        <>
          <Breadcrumbs subTitle="Customer Showcase" />
          <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
            <Link to="/resources" className="inline-flex items-center gap-2 text-[10px] font-black uppercase text-gray-500 hover:text-accentOrange mb-8 font-technical">
              <ArrowLeft className="w-4 h-4" /> Back to Resources
            </Link>

            <h1 className="text-3xl sm:text-4xl font-black font-technical uppercase text-white tracking-tight mb-8">
              Active Build Portfolio
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-machineGray/10 border-2 border-machineGray rounded-sm p-4">
                <div className="aspect-video bg-pitchBlack flex items-center justify-center mb-4 border border-machineGray/40">
                  <Camera className="w-8 h-8 text-machineGray/50" />
                </div>
                <h3 className="text-xs font-black uppercase font-technical text-white mb-2">Build 101: Nairobi Highway Cruiser</h3>
                <p className="text-gray-500 text-[10px] uppercase tracking-wider">
                  Equipped with dual projector LED headlights and a customized metal protective mask framework.
                </p>
              </div>

              <div className="bg-machineGray/10 border-2 border-machineGray rounded-sm p-4">
                <div className="aspect-video bg-pitchBlack flex items-center justify-center mb-4 border border-machineGray/40">
                  <Camera className="w-8 h-8 text-machineGray/50" />
                </div>
                <h3 className="text-xs font-black uppercase font-technical text-white mb-2">Build 205: Urban Deliverer Cargo</h3>
                <p className="text-gray-500 text-[10px] uppercase tracking-wider">
                  Configured with auxiliary warning lighting packs and high-sound dual horn blocks.
                </p>
              </div>
            </div>
          </main>
        </>
      )}
    </div>
  );
};

export default Resources;
