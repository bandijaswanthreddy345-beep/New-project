import { Link, useNavigate } from "react-router-dom";
import brandLogo from "../assets/jntu-brand-logo-v2.png";

function Footer() {
  const navigate = useNavigate();

  const handleAdminDashboardClick = (e) => {
    e.preventDefault();
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login", {
      state: {
        adminPrompt: true,
        message: "Admin authentication required. Please sign in to access the Admin Dashboard.",
      },
    });
  };

  return (
    <footer className="w-full bg-[#08090D] border-t border-[#292733] pt-16 pb-10">
      <div className="max-w-[1440px] mx-auto px-margin-mobile md:px-margin">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10 pb-12">
          
          {/* Column 1: Brand Info (4 Cols) */}
          <div className="lg:col-span-4 flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <img
                alt="JNTU Circle Crest"
                className="h-12 w-12 rounded-full object-cover shadow-md select-none"
                src={brandLogo}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/jntu-brand-logo-v2.png";
                }}
              />
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-label-mono-sm uppercase text-[#A3A3B5] tracking-wider">
                    JNTU
                  </span>
                  <span className="font-headline-sm text-[20px] font-bold text-[#F5F5FA] tracking-tight">
                    Circle
                  </span>
                </div>
                <span className="text-[12px] font-medium text-[#A3A3B5]">
                  Academic Resource Hub
                </span>
              </div>
            </div>

            <p className="font-body-sm text-body-sm text-[#A3A3B5] leading-relaxed max-w-sm mb-6">
              JNTU Circle is a centralized academic platform designed to help students easily access
              notes, question papers, syllabus, notifications, lab programs, and other essential
              learning resources.
            </p>

            <div className="flex items-center gap-2 text-body-sm text-[#A3A3B5]">
              <svg
                className="w-4 h-4 text-[#8B5CF6] shrink-0 fill-none stroke-current stroke-[2]"
                viewBox="0 0 24 24"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span>Andhra Pradesh, India</span>
            </div>
          </div>

          {/* Column 2: Quick Links (2 Cols) */}
          <div className="lg:col-span-2 flex flex-col gap-3">
            <div className="mb-1">
              <h3 className="font-headline-sm text-[15px] font-bold tracking-wider uppercase text-[#F5F5FA]">
                QUICK LINKS
              </h3>
              <div className="w-8 h-[2px] bg-[#eab308] mt-1.5 rounded-full" />
            </div>
            <div className="flex flex-col gap-2.5 mt-2">
              <Link to="/" className="font-body-sm text-body-sm text-[#A3A3B5] hover:text-[#C4B5FD] transition-colors">
                Home
              </Link>
              <Link to="/calculator" className="font-body-sm text-body-sm text-[#A3A3B5] hover:text-[#C4B5FD] transition-colors">
                CGPA &amp; SGPA Calculator
              </Link>
              <Link to="/upload-materials" className="font-body-sm text-body-sm text-[#A3A3B5] hover:text-[#C4B5FD] transition-colors">
                Upload Materials
              </Link>
              <Link to="/notifications" className="font-body-sm text-body-sm text-[#A3A3B5] hover:text-[#C4B5FD] transition-colors">
                Notifications
              </Link>
            </div>
          </div>

          {/* Column 3: Resources (3 Cols) */}
          <div className="lg:col-span-3 flex flex-col gap-3">
            <div className="mb-1">
              <h3 className="font-headline-sm text-[15px] font-bold tracking-wider uppercase text-[#F5F5FA]">
                RESOURCES
              </h3>
              <div className="w-8 h-[2px] bg-[#eab308] mt-1.5 rounded-full" />
            </div>
            <div className="flex flex-col gap-2.5 mt-2">
              <Link to="/notes" className="font-body-sm text-body-sm text-[#A3A3B5] hover:text-[#C4B5FD] transition-colors">
                Notes &amp; Materials
              </Link>
              <a href="#previous-question-papers" className="font-body-sm text-body-sm text-[#A3A3B5] hover:text-[#C4B5FD] transition-colors">
                Question Papers
              </a>
              <Link to="/syllabus" className="font-body-sm text-body-sm text-[#A3A3B5] hover:text-[#C4B5FD] transition-colors">
                Syllabus Copies
              </Link>
              <Link to="/lab-programs" className="font-body-sm text-body-sm text-[#A3A3B5] hover:text-[#C4B5FD] transition-colors">
                Lab Programs
              </Link>
              <Link to="/search" className="font-body-sm text-body-sm text-[#A3A3B5] hover:text-[#C4B5FD] transition-colors">
                Search Resources
              </Link>
              <a
                href="/login"
                onClick={handleAdminDashboardClick}
                className="font-body-sm text-body-sm text-[#A3A3B5] hover:text-[#C4B5FD] transition-colors"
              >
                Admin Dashboard
              </a>
            </div>
          </div>

          {/* Column 4: Contact Us (3 Cols) */}
          <div className="lg:col-span-3 flex flex-col gap-3">
            <div className="mb-1">
              <h3 className="font-headline-sm text-[15px] font-bold tracking-wider uppercase text-[#F5F5FA]">
                CONTACT US
              </h3>
              <div className="w-8 h-[2px] bg-[#eab308] mt-1.5 rounded-full" />
            </div>
            <p className="font-body-sm text-body-sm text-[#A3A3B5] leading-relaxed mt-1 mb-2">
              Have questions, suggestions, or feedback? We'd love to hear from you.
            </p>
            <div className="flex flex-col gap-3 text-body-sm">
              <a
                href="mailto:jntucircle@gmail.com"
                className="group flex items-center gap-2.5 text-[#A3A3B5] hover:text-[#F5F5FA] transition-colors"
              >
                <svg
                  className="w-4 h-4 text-[#8B5CF6] group-hover:text-[#C4B5FD] shrink-0 fill-none stroke-current stroke-[1.8]"
                  viewBox="0 0 24 24"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
                <span>jntucircle@gmail.com</span>
              </a>

              <a
                href="https://whatsapp.com"
                target="_blank"
                rel="noreferrer"
                className="group flex items-center gap-2.5 text-[#A3A3B5] hover:text-[#F5F5FA] transition-colors"
              >
                <svg
                  className="w-4 h-4 text-[#8B5CF6] group-hover:text-[#C4B5FD] shrink-0 fill-none stroke-current stroke-[1.8]"
                  viewBox="0 0 24 24"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                </svg>
                <span>WhatsApp Community</span>
              </a>

              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="group flex items-center gap-2.5 text-[#A3A3B5] hover:text-[#F5F5FA] transition-colors"
              >
                <svg
                  className="w-4 h-4 text-[#8B5CF6] group-hover:text-[#C4B5FD] shrink-0 fill-none stroke-current stroke-[1.8]"
                  viewBox="0 0 24 24"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                </svg>
                <span>@JNTUCIRCLE</span>
              </a>

              <div className="flex items-center gap-2.5 text-[#A3A3B5] mt-0.5">
                <svg
                  className="w-4 h-4 text-[#8B5CF6] shrink-0 fill-none stroke-current stroke-[2]"
                  viewBox="0 0 24 24"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span>Andhra Pradesh, India</span>
              </div>
            </div>
          </div>

        </div>

        {/* Sub-footer Copyright */}
        <div className="pt-6 border-t border-[#292733] flex flex-col sm:flex-row items-center justify-between gap-4 font-body-sm text-[13px] text-[#A3A3B5]">
          <div>
            © 2026 <span className="font-semibold text-[#F5F5FA]">JNTU Circle</span>. All rights reserved.
          </div>
          <div className="flex items-center gap-2 text-[#A3A3B5]">
            <span>Built for Students</span>
            <span className="text-[#292733]">•</span>
            <span>Made for Learning</span>
          </div>
        </div>

      </div>
    </footer>
  );
}

export default Footer;