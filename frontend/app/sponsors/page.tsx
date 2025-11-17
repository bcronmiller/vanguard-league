'use client';

export default function SponsorsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-mbjj-dark">
      {/* VanGuard Gym Header */}
      <header className="bg-mbjj-dark text-white py-6">
        <div className="container mx-auto px-4">
          <div className="flex justify-center mb-3">
            <img
              src="/vgg-logo.png"
              alt="VanGuard Gym"
              className="h-16 md:h-20 w-auto"
            />
          </div>
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-white mb-1">
              VANGUARD LEAGUE
            </h1>
            <div className="h-0.5 w-24 bg-mbjj-red mx-auto mb-2"></div>
            <p className="text-sm md:text-base font-heading text-gray-300">
              VGI TRENCH — SUBMISSION-ONLY LADDER
            </p>
            <p className="text-xs text-gray-400 mt-1">
              at VanGuard Gym
            </p>
          </div>
        </div>
      </header>

      {/* Page Title */}
      <div className="bg-gradient-to-r from-mbjj-dark to-gray-800 text-white py-8">
        <div className="container mx-auto px-4">
          <a href="/" className="text-white hover:text-gray-200 inline-block mb-4">
            ← Home
          </a>
          <div className="text-center">
            <h2 className="text-5xl md:text-6xl font-heading font-bold text-white mb-2">
              OUR SPONSORS
            </h2>
            <div className="h-1 w-32 bg-mbjj-red mx-auto mb-4"></div>
            <p className="text-xl md:text-2xl font-heading text-gray-100">
              THANK YOU FOR YOUR SUPPORT
            </p>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-12">
        {/* All Sponsors - Equal Billing */}
        <div className="max-w-4xl mx-auto mb-16">
          <h3 className="text-3xl font-heading font-bold text-center mb-8 text-gray-900 dark:text-white">
            OUR SPONSORS
          </h3>

          {/* Neff Bros. Stone - More Details Available */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl overflow-hidden border-t-4 border-mbjj-blue mb-8">
            <div className="bg-gradient-to-r from-gray-700 to-gray-900 text-white p-8 text-center">
              <div className="flex items-center justify-center mb-4">
                <img
                  src="https://neffbrothersstone.com/wp-content/uploads/2022/12/cropped-NeffBROSlogo.png"
                  alt="Neff Bros. Stone"
                  className="h-24 object-contain"
                />
              </div>
              <h3 className="text-4xl md:text-5xl font-heading font-bold mb-4">
                NEFF BROS. STONE
              </h3>
              <div className="h-1 w-24 bg-mbjj-red mx-auto mb-4"></div>
              <p className="text-xl text-gray-200 font-heading">
                NEFF BROS. PRODUCTS
              </p>
            </div>

            <div className="p-8">
              <div className="prose prose-lg max-w-none dark:prose-invert mb-8">
                <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                  All products are conveniently available for pickup and delivery. Most deliveries are available either same-day or next-day.
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  We service all Northern Virginia including <strong>Fairfax, Prince William, Loudoun, Fauquier, and Stafford County</strong>. We also service parts of Maryland and Washington DC on a case-by-case basis.
                </p>
              </div>

              {/* Product Categories */}
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 rounded-lg p-6 border-l-4 border-mbjj-blue">
                  <h4 className="font-heading font-bold text-2xl text-gray-900 dark:text-white mb-3">
                    🏗️ PAVERS & WALLS
                  </h4>
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    High-quality pavers and wall materials for landscaping and construction projects.
                  </p>
                  <a
                    href="https://neffbrothersstone.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-mbjj-blue hover:text-mbjj-red font-heading font-bold transition"
                  >
                    Find out more →
                  </a>
                </div>

                <div className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 rounded-lg p-6 border-l-4 border-mbjj-blue">
                  <h4 className="font-heading font-bold text-2xl text-gray-900 dark:text-white mb-3">
                    🪨 STONE & AGGREGATES
                  </h4>
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    Premium stone and aggregate materials for all your construction and landscaping needs.
                  </p>
                  <a
                    href="https://neffbrothersstone.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-mbjj-blue hover:text-mbjj-red font-heading font-bold transition"
                  >
                    Find out more →
                  </a>
                </div>
              </div>

              {/* Contact/Website Section */}
              <div className="bg-gradient-to-r from-mbjj-blue to-mbjj-accent-light text-white rounded-lg p-6 text-center">
                <p className="text-lg font-heading mb-4">
                  Visit our website to learn more about our products and services
                </p>
                <a
                  href="https://neffbrothersstone.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-white text-mbjj-blue hover:bg-gray-100 font-heading font-bold px-8 py-3 rounded-lg transition shadow-md"
                >
                  Visit Neff Bros. Stone →
                </a>
              </div>
            </div>
          </div>

          {/* Other Sponsors */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Leadmark Contracting */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border-t-4 border-mbjj-blue">
              <div className="bg-gradient-to-r from-mbjj-blue to-mbjj-accent-light text-white p-6 text-center">
                <div className="flex items-center justify-center mb-3">
                  <img
                    src="https://leadmk.com/wp-content/uploads/2025/04/image-5-removebg-preview.png"
                    alt="Leadmark Contracting"
                    className="h-20 object-contain"
                  />
                </div>
                <h4 className="text-3xl font-heading font-bold">
                  LEADMARK CONTRACTING
                </h4>
                <p className="text-gray-200 mt-2">Premier Home Improvement Contractors</p>
              </div>
              <div className="p-6">
                <div className="text-gray-700 dark:text-gray-300">
                  <p className="text-base mb-4 leading-relaxed">
                    At Leadmark Contracting, we specialize in transforming houses into dream homes. As premier home improvement contractors in Northern Virginia, we deliver high-end, custom-built solutions that increase your home's value, utility, and charm.
                  </p>
                  <p className="text-base mb-4 leading-relaxed">
                    From concept to completion, we work closely with you to ensure your vision becomes reality—with no shortcuts, just expert craftsmanship.
                  </p>
                  <div className="text-center mt-6">
                    <a
                      href="https://leadmk.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block bg-mbjj-blue hover:bg-mbjj-accent-light text-white font-heading font-bold px-6 py-3 rounded-lg transition shadow-md"
                    >
                      Visit Website →
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Precision Lawn & Landscape */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border-t-4 border-mbjj-blue">
              <div className="bg-gradient-to-r from-mbjj-blue to-mbjj-accent-light text-white p-6 text-center">
                <div className="flex items-center justify-center mb-3">
                  <img
                    src="https://precisionlawnandlandscape.com/wp-content/uploads/2023/12/logo.webp"
                    alt="Precision Lawn & Landscape"
                    className="h-20 object-contain"
                  />
                </div>
                <h4 className="text-3xl font-heading font-bold">
                  PRECISION LAWN & LANDSCAPE
                </h4>
                <p className="text-gray-200 mt-2">Lawn & Landscaping Excellence Since 2006</p>
              </div>
              <div className="p-6">
                <div className="text-gray-700 dark:text-gray-300">
                  <p className="text-base mb-4 leading-relaxed">
                    Welcome to Precision Lawn & Landscape! We are a lawn and landscaping company that provides a wide range of top-notch services to residential, commercial, and HOA property owners in Woodbridge, VA, and nearby cities, such as Manassas and Dumfries.
                  </p>
                  <p className="text-base mb-4 leading-relaxed">
                    Our company has been around since 2006 and is built on a steadfast commitment to excellence and client satisfaction. That's why we place an emphasis on always doing things the right way, whether we're installing a patio, aerating your lawn, trimming your plants, or repairing your irrigation system.
                  </p>
                  <p className="text-base mb-4 font-semibold">
                    If you're looking for a reliable team you can trust, we are the company for you.
                  </p>
                  <div className="text-center mt-6">
                    <a
                      href="https://precisionlawnandlandscape.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block bg-mbjj-blue hover:bg-mbjj-accent-light text-white font-heading font-bold px-6 py-3 rounded-lg transition shadow-md"
                    >
                      Visit Website →
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Halse Construction */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border-t-4 border-mbjj-blue">
              <div className="bg-gradient-to-r from-mbjj-blue to-mbjj-accent-light text-white p-6 text-center">
                <h4 className="text-3xl font-heading font-bold">
                  HALSE CONSTRUCTION
                </h4>
              </div>
              <div className="p-6">
                <div className="text-center text-gray-700 dark:text-gray-300">
                  <p className="text-lg mb-4">
                    Quality construction services
                  </p>
                  <div className="text-sm text-gray-500 dark:text-gray-400 italic">
                    Website and details coming soon
                  </div>
                </div>
              </div>
            </div>

            {/* Game Day Men's Health */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border-t-4 border-mbjj-blue md:col-span-2">
              <div className="bg-gradient-to-r from-mbjj-blue to-mbjj-accent-light text-white p-6 text-center">
                <div className="flex items-center justify-center mb-3">
                  <img
                    src="https://images.leadconnectorhq.com/image/f_webp/q_80/r_1200/u_https://assets.cdn.filesafe.space/ovE9FwuwI54GZrZi1VEF/media/65e7605b3be386aa75f6d014.webp"
                    alt="Game Day Men's Health"
                    className="h-20 object-contain"
                  />
                </div>
                <h4 className="text-3xl font-heading font-bold">
                  GAME DAY MEN'S HEALTH
                </h4>
                <p className="text-gray-200 mt-2">Manassas Men's Health & Wellness</p>
              </div>
              <div className="p-6">
                <div className="prose prose-lg max-w-none dark:prose-invert mb-8">
                  <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed text-center mb-6">
                    Gameday Men's Health specializes in testosterone replacement therapy and men's wellness services designed for busy men who value their time and health.
                  </p>
                </div>

                {/* Service Features */}
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 rounded-lg p-6 border-l-4 border-mbjj-blue">
                    <h5 className="font-heading font-bold text-xl text-gray-900 dark:text-white mb-3">
                      🔬 IN-OFFICE LABORATORY
                    </h5>
                    <p className="text-gray-700 dark:text-gray-300 text-sm">
                      CLIA/COLA-accredited and State licensed in-office laboratory. Find out your testosterone levels within 20 minutes. No sitting in cold waiting rooms for hours or waiting weeks for results.
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 rounded-lg p-6 border-l-4 border-mbjj-blue">
                    <h5 className="font-heading font-bold text-xl text-gray-900 dark:text-white mb-3">
                      📊 ONGOING LABWORK
                    </h5>
                    <p className="text-gray-700 dark:text-gray-300 text-sm">
                      We monitor your labs on a continual basis for the duration of your treatment. This ensures safety and proper oversight while partnering with you to feel your best.
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 rounded-lg p-6 border-l-4 border-mbjj-blue">
                    <h5 className="font-heading font-bold text-xl text-gray-900 dark:text-white mb-3">
                      🎁 FREE CONSULTATION
                    </h5>
                    <p className="text-gray-700 dark:text-gray-300 text-sm">
                      Your initial consultation and testosterone levels test is FREE. Unlike other clinics, we believe it's your basic human right to know where your health stands, regardless of income levels.
                    </p>
                  </div>
                </div>

                {/* CTA Button */}
                <div className="bg-gradient-to-r from-mbjj-blue to-mbjj-accent-light text-white rounded-lg p-6 text-center">
                  <p className="text-lg font-heading mb-4">
                    Book Your Free New Patient Special
                  </p>
                  <a
                    href="https://pdg.gamedaymenshealth.com/survey-northeast-raleigh"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-white text-mbjj-blue hover:bg-gray-100 font-heading font-bold px-8 py-3 rounded-lg transition shadow-md"
                  >
                    Schedule Free Consultation →
                  </a>
                </div>
              </div>
            </div>

            {/* Attn2DetailMercantile */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border-t-4 border-mbjj-blue md:col-span-2 mt-8">
              <div className="bg-gradient-to-r from-mbjj-blue to-mbjj-accent-light text-white p-6 text-center">
                <div className="flex items-center justify-center mb-3">
                  <img
                    src="https://attn2detailmercantile.com/cdn/shop/files/Red_Knife_Girl_213x150.png?v=1702409843"
                    alt="Attn2DetailMercantile"
                    className="h-20 object-contain"
                  />
                </div>
                <h4 className="text-3xl font-heading font-bold">
                  ATTN2DETAILMERCANTILE
                </h4>
                <p className="text-gray-200 mt-2">Veteran-Owned Custom Knives & Handcrafted Goods</p>
              </div>
              <div className="p-6">
                <div className="prose prose-lg max-w-none dark:prose-invert mb-8">
                  <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                    A small veteran-owned and operated shop producing only a few hundred custom pieces a year. Douglas is on his fifth career (one of which was as a Marine) and works full-time in the shop. Noah is a Marine Corps reservist who is often on active duty orders or at drill.
                  </p>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    All products are hand-finished for men, women, and savages with discerning taste who appreciate attention to detail. We use quality material and expert craftsmanship to ensure delivery of rugged sophistication. From form to function, we select every aspect of our products personally. All parts are made, assembled, and hand finished here in the USA.
                  </p>
                </div>

                {/* Features */}
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 rounded-lg p-6 border-l-4 border-mbjj-blue text-center">
                    <div className="text-4xl mb-3">🎖️</div>
                    <h5 className="font-heading font-bold text-xl text-gray-900 dark:text-white mb-2">
                      VETERAN OWNED
                    </h5>
                    <p className="text-gray-700 dark:text-gray-300 text-sm">
                      Owned and operated by Marines dedicated to quality craftsmanship
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 rounded-lg p-6 border-l-4 border-mbjj-blue text-center">
                    <div className="text-4xl mb-3">🔪</div>
                    <h5 className="font-heading font-bold text-xl text-gray-900 dark:text-white mb-2">
                      HAND-FINISHED
                    </h5>
                    <p className="text-gray-700 dark:text-gray-300 text-sm">
                      Every piece is meticulously hand-finished with attention to detail
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 rounded-lg p-6 border-l-4 border-mbjj-blue text-center">
                    <div className="text-4xl mb-3">🇺🇸</div>
                    <h5 className="font-heading font-bold text-xl text-gray-900 dark:text-white mb-2">
                      MADE IN USA
                    </h5>
                    <p className="text-gray-700 dark:text-gray-300 text-sm">
                      All parts made, assembled, and finished in the USA
                    </p>
                  </div>
                </div>

                {/* CTA Button */}
                <div className="bg-gradient-to-r from-mbjj-blue to-mbjj-accent-light text-white rounded-lg p-6 text-center">
                  <p className="text-lg font-heading mb-4">
                    Hard-Use Gentlemen's Knives - Functional Art for Generations
                  </p>
                  <a
                    href="https://attn2detailmercantile.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-white text-mbjj-blue hover:bg-gray-100 font-heading font-bold px-8 py-3 rounded-lg transition shadow-md"
                  >
                    Visit Attn2DetailMercantile →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Become a Sponsor CTA */}
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900/50 dark:to-gray-800/50 rounded-lg p-8 border-2 border-dashed border-gray-300 dark:border-gray-700">
            <h3 className="font-heading font-bold text-2xl text-gray-900 dark:text-white mb-4">
              Interested in Sponsoring?
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Support local athletes and grow your business by becoming a Vanguard League sponsor. Contact Christian Banghart to learn more about sponsorship opportunities.
            </p>
            <a
              href="mailto:christianbanghart@gmail.com"
              className="inline-block bg-mbjj-blue hover:bg-mbjj-accent-light text-white font-heading font-bold px-8 py-3 rounded-lg transition shadow-md"
            >
              Contact Christian Banghart
            </a>
          </div>
        </div>
      </main>

      <footer className="bg-mbjj-dark text-white py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <p className="font-heading text-lg mb-2">VANGUARD LEAGUE</p>
          <p className="text-gray-400">
            Hosted at{' '}
            <a
              href="https://vanguardgym.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-mbjj-red transition font-bold"
            >
              VanGuard Gym
            </a>
          </p>
          <p className="text-gray-400 mt-1">
            <a
              href="https://maps.google.com/?q=9414+Center+Point+Ln,+Manassas,+VA+20110"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-mbjj-red transition inline-flex items-center gap-1 justify-center"
            >
              <span>📍</span> 9414 Center Point Ln, Manassas, VA
            </a>
          </p>
          <p className="text-gray-500 text-sm mt-4">&copy; 2025 Vanguard League. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
