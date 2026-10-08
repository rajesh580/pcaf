const prisma = require('../prisma');
const { evaluateSkillMatch } = require('./skillMatchingEngine');
const { generateStandardizedResume } = require('./resumeGeneratorService');

const LEVELS = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'];
const normalizeSkills = (skills = []) => skills.map((item) => {
  const name = typeof item === 'string' ? item.trim() : String(item?.name || '').trim();
  const raw = typeof item === 'object' ? String(item.minLevel || item.level || 'BEGINNER').toUpperCase() : 'BEGINNER';
  const minLevel = raw === 'BASIC' ? 'BEGINNER' : raw;
  if (!name || !LEVELS.includes(minLevel)) throw new Error('Each required skill must have a name and a valid skill level.');
  return { name, minLevel };
}).filter((item) => item.name);

async function createOpportunity({ user, type, data }) {
  if (!user.recruiterAtId) throw new Error('Your account is not linked to a company. Ask an administrator to link it.');
  if (typeof data.title !== 'string' || !data.title.trim()) throw new Error('Opportunity title is required.');
  const requiredSkills = normalizeSkills(data.requiredSkills);
  if (!requiredSkills.length) throw new Error('At least one required skill is needed.');
  const deadline = new Date(data.applicationDeadline || data.deadline);
  if (!Number.isFinite(deadline.getTime())) throw new Error('A valid application deadline is required.');
  if (deadline <= new Date()) throw new Error('The application deadline must be in the future.');
  const graduationYear = Number(data.graduationYear);
  const minCgpa = Number(data.minimumCgpa ?? data.minCgpa ?? 0);
  const maxBacklogs = Number(data.maximumBacklogs ?? data.maxBacklogs ?? data.backlogCriteria?.maxActiveBacklogs ?? 0);
  if (!Number.isInteger(graduationYear) || graduationYear < 2000 || graduationYear > 2100 || !Number.isFinite(minCgpa) || minCgpa < 0 || minCgpa > 10 || !Number.isInteger(maxBacklogs) || maxBacklogs < 0) {
    throw new Error('Check the graduation year, CGPA, and backlog requirements.');
  }
  const departments = (type === 'INTERNSHIP' ? data.requiredDepartments : data.departments) || data.eligibleDeptCodes || [];
  if (!Array.isArray(departments) || !departments.every((code) => typeof code === 'string')) throw new Error('Eligible departments must be a list of department codes.');
  const mode = type === 'INTERNSHIP' ? data.mode : data.workMode;
  if (mode && !['ONLINE', 'OFFLINE', 'HYBRID'].includes(mode)) throw new Error('Work mode must be ONLINE, OFFLINE, or HYBRID.');
  const company = await prisma.company.findUnique({ where: { id: user.recruiterAtId } });
  if (!company) throw new Error('Linked company was not found.');

  const record = await prisma.opportunity.create({
    data: {
      companyId: company.id, title: String(data.title).trim(), description: data.description || '', type,
      workMode: mode || 'HYBRID', minCgpa, maxBacklogs, graduationYear,
      eligibleDeptCodes: [...new Set(departments.map((code) => code.trim().toUpperCase()).filter(Boolean))],
      deadline, location: data.location || (mode === 'ONLINE' ? 'Remote' : null),
      duration: data.duration || null, stipend: type === 'INTERNSHIP' ? data.stipend || null : null,
      salary: type === 'JOB' ? data.salaryPackage || data.salary || null : null,
      requiredDegree: type === 'INTERNSHIP' ? data.requiredDegree || 'B.E. / B.Tech' : null,
      internshipType: type === 'INTERNSHIP' ? data.internshipType || 'INTERNSHIP_ONLY' : null,
      employmentType: type === 'JOB' ? data.employmentType || 'FULL_TIME' : null,
      experience: data.experience || null,
      numberOfPositions: Number.isInteger(Number(data.numberOfPositions)) && Number(data.numberOfPositions) > 0 ? Number(data.numberOfPositions) : 1,
      selectionProcess: Array.isArray(data.selectionProcess) ? data.selectionProcess.filter((step) => typeof step === 'string') : [],
      preferredSkills: Array.isArray(data.preferredSkills) ? data.preferredSkills.map((skill) => typeof skill === 'string' ? skill : skill.name).filter(Boolean) : [],
      requiredSkills: { create: requiredSkills.map(({ name, minLevel }) => ({ minLevel, isMandatory: true, skill: { connectOrCreate: { where: { name }, create: { name, category: type === 'JOB' ? 'Employment' : 'Internship' } } } })) }
    }, include: { company: true, requiredSkills: { include: { skill: true } } }
  });
  return mapOpportunity(record);
}

function mapOpportunity(record) {
  const common = {
    id: record.id, companyId: record.companyId, companyName: record.company.name, title: record.title,
    description: record.description || '', location: record.location || '', mode: record.workMode,
    workMode: record.workMode, minimumCgpa: record.minCgpa, minCgpa: record.minCgpa,
    maximumBacklogs: record.maxBacklogs, maxBacklogs: record.maxBacklogs,
    graduationYear: record.graduationYear, requiredSkills: record.requiredSkills.map((item) => ({ name: item.skill.name, minLevel: item.minLevel })),
    preferredSkills: record.preferredSkills, numberOfPositions: record.numberOfPositions,
    selectionProcess: record.selectionProcess, applicationDeadline: record.deadline.toISOString(), deadline: record.deadline.toISOString(),
    status: record.status, createdAt: record.createdAt.toISOString(), eligibleDeptCodes: record.eligibleDeptCodes
  };
  return record.type === 'INTERNSHIP'
    ? { ...common, type: 'INTERNSHIP', internshipType: record.internshipType || 'INTERNSHIP_ONLY', duration: record.duration || '', stipend: record.stipend || '', requiredDegree: record.requiredDegree || 'B.E. / B.Tech', requiredDepartments: record.eligibleDeptCodes }
    : { ...common, type: 'JOB', salaryPackage: record.salary || '', employmentType: record.employmentType || 'FULL_TIME', experience: record.experience || 'Fresher', departments: record.eligibleDeptCodes, backlogCriteria: { maxActiveBacklogs: record.maxBacklogs } };
}

async function findOpportunity(id, type) {
  const record = await prisma.opportunity.findFirst({ where: { id, ...(type ? { type } : {}) }, include: { company: true, requiredSkills: { include: { skill: true } } } });
  return record ? mapOpportunity(record) : null;
}

async function listOpportunities(type, query = {}) {
  const records = await prisma.opportunity.findMany({
    where: { type, status: 'ACTIVE', deadline: { gte: new Date() } },
    include: { company: true, requiredSkills: { include: { skill: true } } },
    orderBy: { createdAt: 'desc' }
  });
  let list = records.map(mapOpportunity);
  const mode = query.mode || query.workMode;
  if (mode) list = list.filter((item) => item.workMode === String(mode).toUpperCase());
  if (query.graduationYear) list = list.filter((item) => item.graduationYear === Number(query.graduationYear));
  const department = query.department && String(query.department).toUpperCase();
  if (department) list = list.filter((item) => !item.eligibleDeptCodes.length || item.eligibleDeptCodes.includes(department));
  if (query.search) {
    const term = String(query.search).toLowerCase();
    list = list.filter((item) => item.title.toLowerCase().includes(term) || item.companyName.toLowerCase().includes(term) || item.requiredSkills.some((skill) => skill.name.toLowerCase().includes(term)));
  }
  return list;
}

async function applyStudentToOpportunity(userId, opportunityId, type, resumeType) {
  if (!['UPLOADED', 'GENERATED'].includes(resumeType)) throw new Error('Choose either your uploaded resume or your generated profile resume before applying.');
  const [student, record] = await Promise.all([
    prisma.student.findUnique({ where: { userId }, include: { user: true, college: true, department: true, skills: { include: { skill: true } }, certifications: true, projects: true } }),
    prisma.opportunity.findFirst({ where: { id: opportunityId, type }, include: { company: true, requiredSkills: { include: { skill: true } } } })
  ]);
  if (!student) throw new Error('Student profile not found.');
  if (resumeType === 'UPLOADED' && !student.resumeUrl) throw new Error('Upload a resume or choose your generated profile resume.');
  if (!record) throw new Error('Opportunity not found or is not accepting applications.');
  if (record.deadline < new Date() || record.status !== 'ACTIVE') throw new Error('The application deadline has passed.');
  const candidate = { ...student, skills: student.skills.map(({ skill, level }) => ({ name: skill.name, level })) };
  const evaluation = evaluateSkillMatch(candidate, record);
  if (!evaluation.isEligible) throw new Error('Your academic profile does not meet the opportunity eligibility requirements.');
  const now = new Date();
  const submittedResume = resumeType === 'UPLOADED'
    ? { type: 'UPLOADED', url: student.resumeUrl }
    : { type: 'GENERATED' };
  if (resumeType === 'GENERATED') {
    submittedResume.html = generateStandardizedResume({
      name: student.name,
      email: student.user?.email || '',
      college: student.college?.name || '',
      department: { name: student.department?.name || '' },
      graduationYear: student.graduationYear,
      cgpa: student.cgpa,
      links: { github: student.githubUrl, linkedin: student.linkedinUrl },
      skills: student.skills.map(({ skill, level }) => ({ name: skill.name, level })),
      academicProfile: {
        degree: 'B.E. / B.Tech', branch: student.department?.code || '', cgpa: student.cgpa,
        semester: student.semester, backlogs: student.backlogs,
        certifications: student.certifications, academicProjects: student.projects,
      },
    });
  }
  try {
    const application = await prisma.application.create({
      data: { studentId: student.id, opportunityId: record.id, matchScore: evaluation.matchScore, selectionRoundDetails: { submittedResume }, statusTimeline: [{ status: 'APPLIED', timestamp: now.toISOString(), notes: 'Application received.' }] },
      include: { student: { include: { user: true } }, opportunity: { include: { company: true } } }
    });
    return { application, evaluation };
  } catch (error) {
    if (error.code === 'P2002') throw new Error('You have already applied for this opportunity.');
    throw error;
  }
}

module.exports = { createOpportunity, findOpportunity, listOpportunities, mapOpportunity, applyStudentToOpportunity };
