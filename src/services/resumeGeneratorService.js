/**
 * Generates an ATS-friendly, standardized clean HTML/Printable resume
 * from the student's complete digital career profile.
 */
function generateStandardizedResume(profile) {
  const p = profile || {};
  const academic = p.academicProfile || {};
  const skills = p.skills || [];
  const certs = p.certifications || academic.certifications || [];
  const projects = p.projects || academic.academicProjects || [];
  const internships = p.internships || [];
  const achievements = p.achievements || [];

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${p.name || 'Student'} - Standardized Resume</title>
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.5; color: #1e293b; margin: 40px; }
    h1 { margin: 0; font-size: 24px; color: #0f172a; text-transform: uppercase; }
    .contact-info { font-size: 13px; color: #475569; margin-bottom: 20px; }
    .contact-info a { color: #2563eb; text-decoration: none; margin-right: 15px; }
    h2 { font-size: 14px; text-transform: uppercase; border-bottom: 2px solid #cbd5e1; padding-bottom: 4px; margin-top: 20px; color: #1e3a8a; letter-spacing: 0.5px; }
    .section-item { margin-bottom: 12px; }
    .item-header { display: flex; justify-content: space-between; font-weight: bold; font-size: 13.5px; }
    .item-sub { font-style: italic; color: #475569; font-size: 12.5px; }
    ul { margin: 4px 0 0 20px; padding: 0; font-size: 13px; }
    .skill-badges { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
    .badge { background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 4px; padding: 2px 8px; font-size: 12px; }
  </style>
</head>
<body>
  <h1>${p.name || 'Rahul Sharma'}</h1>
  <div class="contact-info">
    <span>${p.email || ''}</span> | 
    <span>${p.mobile || ''}</span> | 
    <span>${p.location || ''}</span><br>
    ${p.links?.github ? `<a href="${p.links.github}">GitHub: ${p.links.github}</a>` : ''}
    ${p.links?.linkedin ? `<a href="${p.links.linkedin}">LinkedIn: ${p.links.linkedin}</a>` : ''}
    ${p.links?.portfolio ? `<a href="${p.links.portfolio}">Portfolio: ${p.links.portfolio}</a>` : ''}
  </div>

  <h2>Academic Education</h2>
  <div class="section-item">
    <div class="item-header">
      <span>${p.college || 'Ramaiah Institute of Technology'}</span>
      <span>Graduation: ${p.graduationYear || 2027}</span>
    </div>
    <div class="item-sub">${academic.degree || 'B.E.'} in ${p.department?.name || 'Computer Science & Engineering'} — CGPA: ${p.cgpa || '8.2'} / 10.0</div>
    <div style="font-size: 12px; color: #64748b;">Class 12 / Diploma: ${academic.twelfthOrDiplomaPercentage || '89.6'}% | Class 10: ${academic.tenthPercentage || '92.4'}%</div>
  </div>

  <h2>Technical Skills</h2>
  <div class="skill-badges">
    ${skills.map((s) => `<span class="badge"><strong>${s.name}</strong> (${s.level})</span>`).join('')}
  </div>

  <h2>Internships & Work Experience</h2>
  ${internships.length ? internships.map((exp) => `
    <div class="section-item">
      <div class="item-header">
        <span>${exp.role} — ${exp.company}</span>
        <span>${exp.duration || ''}</span>
      </div>
      <div class="item-sub">${exp.location || 'Remote'}</div>
      <p style="margin: 4px 0; font-size: 13px;">${exp.description || ''}</p>
    </div>
  `).join('') : '<p style="font-size: 13px; color: #64748b;">Available for full-time internships & co-op opportunities.</p>'}

  <h2>Academic & Capstone Projects</h2>
  ${projects.map((proj) => `
    <div class="section-item">
      <div class="item-header">
        <span>${proj.title}</span>
        <span>${proj.techStack || ''}</span>
      </div>
      <p style="margin: 4px 0; font-size: 13px;">${proj.description || ''}</p>
    </div>
  `).join('')}

  <h2>Certifications</h2>
  <ul>
    ${certs.map((c) => `<li><strong>${c.name}</strong> - ${c.issuer || 'Industry Partner'} (${c.issueDate || 'Verified'})</li>`).join('')}
  </ul>

  <h2>Achievements & Honors</h2>
  <ul>
    ${achievements.map((ach) => `<li>${ach}</li>`).join('')}
  </ul>
</body>
</html>
  `.trim();
}

module.exports = { generateStandardizedResume };
