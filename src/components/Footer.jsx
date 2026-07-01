import './Footer.css';

function Footer() {
  const currentYear = new Date().getFullYear();
  const brandName = 'Lightsource Spare Parts and Accessories, Inc.';
  const supportEmail = 'stanleymaina2003@gmail.com';
  const phoneNumber = '+254 716 778794';
  const chatStatus = '24/7 Support'; // adjust as needed
  const chatLink = 'https://lightsource.pages.dev/contact';
  const chatLabel = `Live Chat – ${chatStatus}`;
  const liveUrl = 'https://lightsource.pages.dev';

  return (
    <footer className="site-footer">
      <div className="footer-main">
        {/* About & Corporate */}
        <section className="footer-section">
          <h4>About &amp; Corporate</h4>
          <ul>
            <li><a href="/business">About Us</a></li>
            <li><a href={liveUrl} target="_blank" rel="noopener noreferrer">Visit Our Store</a></li>
          </ul>
        </section>

        {/* Contact details */}
        <section className="footer-section">
          <h4>Contact</h4>
          <ul className="contact-list">
            <li><a href={`mailto:${supportEmail}`}>{supportEmail}</a></li>
            <li><a href={`tel:${phoneNumber.replace(/\s/g, '')}`}>{phoneNumber}</a></li>
            <li><a href="/contact">Contact Us</a></li>
            <li><a href={chatLink} className="chat-link">{chatLabel}</a></li>
            <li className="hours">Mon–Fri, 9 AM – 6 PM EAT</li>
          </ul>
        </section>

        {/* Social proof */}
        <section className="footer-section social">
          <h4>Connect With Us</h4>
          <ul className="social-list">
            <li>
              <a href="https://instagram.com/lightsourcespares" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <img src="https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/instagram.svg" alt="Instagram" />
              </a>
            </li>
            <li>
              <a href="https://facebook.com/lightsourcespares" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <img src="https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/facebook.svg" alt="Facebook" />
              </a>
            </li>
            <li>
              <a href="https://tiktok.com/@lightsourcespares" target="_blank" rel="noopener noreferrer" aria-label="TikTok">
                <img src="https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/tiktok.svg" alt="TikTok" />
              </a>
            </li>
            <li>
              <a href="https://wa.me/254716778794" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
                <img src="https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/whatsapp.svg" alt="WhatsApp" />
              </a>
            </li>
          </ul>
        </section>
      </div>

      <div className="footer-bottom">
        <p>© {currentYear} {brandName} All rights reserved.</p>
        <p className="footer-compliance">
          We respect your privacy.{' '}
          <a href="/privacy-compliance">Learn how</a>{' '}
          we handle your data under GDPR/CCPA.
        </p>
      </div>
    </footer>
  );
}

export default Footer;
