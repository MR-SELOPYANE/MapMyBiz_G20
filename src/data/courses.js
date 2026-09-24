export const COURSES = [
  { id: 1, title: "Advanced Accounting & Taxation", level: "advanced", summary: "Read financial statements, handle VAT, and stay SARS-ready." },
  { id: 2, title: "Introduction to Business", level: "beginner", summary: "Core building blocks of starting and running a small enterprise." },
  { id: 3, title: "Leadership & Organizational Behavior", level: "advanced", summary: "Lead teams, communicate clearly, and build a healthy culture." },
  { id: 4, title: "Small Business Finance", level: "intermediate", summary: "Cash flow, pricing, and funding choices for rural enterprises." },
  { id: 5, title: "Fundamentals of Customer Service", level: "beginner", summary: "Win repeat customers with service that people remember." },
  { id: 6, title: "Accounting Fundamentals", level: "intermediate", summary: "Bookkeeping basics, invoices, and simple monthly reports." },
  { id: 7, title: "Digital Marketing for Business", level: "intermediate", summary: "Use WhatsApp, social media, and a listing to find customers." },
  { id: 8, title: "Entrepreneurial Mindset", level: "beginner", summary: "Build resilience, set goals, and turn ideas into action." },
  { id: 9, title: "Investment Strategies", level: "advanced", summary: "Grow surplus cash without gambling the business." },
  { id: 10, title: "Advanced Accounting Fundamentals", level: "intermediate", summary: "Deeper ledgers, payroll basics, and management accounts." },
  { id: 11, title: "Business Analytics & Decision Making", level: "advanced", summary: "Use simple data to choose what to sell and where to grow." },
  { id: 12, title: "Personal Finance & Money Management", level: "beginner", summary: "Separate household money from business money." },
  { id: 13, title: "Business Communication & Negotiation", level: "intermediate", summary: "Write quotes, negotiate suppliers, and pitch with confidence." },
  { id: 14, title: "Strategic Management", level: "advanced", summary: "Set a 12-month plan and measure whether it is working." },
  { id: 15, title: "Basics of Marketing", level: "beginner", summary: "Know your customer, your offer, and how you stand out." },
];

export function getCourseById(id) {
  return COURSES.find((c) => String(c.id) === String(id)) || null;
}
