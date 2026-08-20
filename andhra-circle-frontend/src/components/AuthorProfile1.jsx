import "./AuthorProfile1.css";
import profile from "../assets/jaswanth.png.png";

function AuthorProfile1() {
return ( <div className="author-profile1-card">


  {/* Profile Image */}
  <div className="author-profile1-image-wrapper">
    <img
      src={profile}
      alt="Bandi Jaswanth Reddy"
      className="author-profile1-image"
    />
  </div>

  {/* Profile Information */}
  <div className="author-profile1-content">

    <h2>Bandi Jaswanth Reddy</h2>

    <p className="author-profile1-role">
      Backend Developer • AIML Student
    </p>

    <p className="author-profile1-description">
      I am a Backend Developer and AIML student working on
      student-focused academic platforms. This platform provides
      organized notes, question papers, syllabus, lab programs,
      and other useful academic resources.
    </p>

    {/* Button */}
    <a
      href="/author-profile"
      className="author-profile1-button"
    >
      AUTHOR PROFILE
      <span>➜</span>
    </a>

  </div>
</div>


);
}

export default AuthorProfile1;
