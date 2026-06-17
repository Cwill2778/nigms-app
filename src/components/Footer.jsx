import './Footer.css';

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">
        <p>&copy; {currentYear} Nailed It Property Solutions. All rights reserved.</p>
        <p>Developed by <a href="https://www.cronantech.com" target="_blank" rel="noopener noreferrer">Cronan Technology</a></p>
      </div>
    </footer>
  );
}

export default Footer;
