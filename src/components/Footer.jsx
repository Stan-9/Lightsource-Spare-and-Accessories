import './Footer.css';

function Footer() {
  const currentYear = new Date().getFullYear();
  const brandName = 'Your Brand Name, Inc.';
  const supportEmail = 'support@yourstore.com';
  const phoneNumber = '+1 (800) 123-4567';
  const chatStatus = '24/7 Support'; // adjust as needed
  const chatLink = '#'; // replace with real chat URL
  const chatLabel = chatStatus.includes('Offline') ? 'Leave a message' : 'Start chat';

  return (
    <footer className="site-footer">
      <div className="footer-main">
        {/* About & Corporate */}
        <section className="footer-section">
          <h4>About &amp; Corporate</h4>
          <ul>
            <li><a href="/about">About Us</a></li>
            <li><a href="/careers">Careers</a></li>
            <li><a href="/press">Press</a></li>
          </ul>
        </section>

        {/* Contact details */}
        <section className="footer-section">
          <h4>Contact</h4>
          <ul className="contact-list">
            <li><a href={`mailto:${supportEmail}`}>{supportEmail}</a></li>
            <li><a href="tel:+18001234567">{phoneNumber}</a></li>
            <li><a href="/contact">Contact Us</a></li>
            <li><a href={chatLink} className="chat-link">{chatLabel}</a></li>
            <li className="hours">Mon–Fri, 9 AM – 6 PM EST</li>
          </ul>
        </section>

        {/* GDPR / CCPA */}
        <section className="footer-section compliance">
          <p>
            We respect your privacy.{' '}
            <a href="/privacy-compliance">Learn how</a> we handle your data under GDPR/CCPA.
          </p>
        </section>

        {/* Social proof */}
        <section className="footer-section social">
          <h4>Connect With Us</h4>
          <ul className="social-list">
            <li>
              <a href="https://instagram.com/yourbrand" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <img src="https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/instagram.svg" alt="Instagram" />
              </a>
            </li>
            <li>
              <a href="https://facebook.com/yourbrand" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <img src="https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/facebook.svg" alt="Facebook" />
              </a>
            </li>
            <li>
              <a href="https://tiktok.com/@yourbrand" target="_blank" rel="noopener noreferrer" aria-label="TikTok">
                <img src="https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/tiktok.svg" alt="TikTok" />
              </a>
            </li>
            <li>
              <a href="https://x.com/yourbrand" target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)">
                <img src="https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/x.svg" alt="X" />
              </a>
            </li>
            <li>
              <a href="https://pinterest.com/yourbrand" target="_blank" rel="noopener noreferrer" aria-label="Pinterest">
                <img src="https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/pinterest.svg" alt="Pinterest" />
              </a>
            </li>
            <li>
              <a href="https://youtube.com/yourbrand" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
                <img src="https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/youtube.svg" alt="YouTube" />
              </a>
            </li>
          </ul>
        </section>
      </div>

      <div className="footer-bottom">
        <p>© {currentYear} {brandName} All rights reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;
