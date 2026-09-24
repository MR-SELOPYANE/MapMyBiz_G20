export const JOBS = [
  {
    id: 1,
    title: "Crafts Sales Assistant",
    company: "Siyanda Handcrafts",
    location: "Bloemfontein",
    job_type: "Part-time",
    category: "crafts",
    description:
      "Help display and sell handmade jewellery and accessories at our weekend market stall. Training provided.",
    salary: "R250/day",
    application_email: "siyanda@handcrafts.co.za",
    posted_date: "2024-09-20",
    created_at: "2024-09-20",
  },
  {
    id: 2,
    title: "Catering Assistant",
    company: "Mama's Kitchen",
    location: "Soweto, Johannesburg",
    job_type: "Full-time",
    category: "food",
    description:
      "Support our family-run catering business with food prep, delivery, and client service for events.",
    salary: "R8,500/month",
    application_email: "mama@kitchen.co.za",
    posted_date: "2024-09-18",
    created_at: "2024-09-18",
  },
  {
    id: 3,
    title: "Digital Marketing Intern",
    company: "RuralBiz Solutions",
    location: "Port Elizabeth",
    job_type: "Internship",
    category: "services",
    description:
      "Learn WhatsApp and social-media marketing for small businesses while gaining real experience.",
    salary: "R3,000/stipend",
    application_email: "join@ruralbiz.co.za",
    posted_date: "2024-09-15",
    created_at: "2024-09-15",
  },
  {
    id: 4,
    title: "Tourism Guide",
    company: "Valley Adventures",
    location: "Drakensberg",
    job_type: "Seasonal",
    category: "tourism",
    description:
      "Lead guided hiking and cultural tours for visitors exploring the Northern Drakensberg region.",
    salary: "R120/hour + tips",
    application_email: "guide@valleyadventures.co.za",
    posted_date: "2024-09-10",
    created_at: "2024-09-10",
  },
  {
    id: 5,
    title: "Bookkeeping Clerk",
    company: "Mountain View General Dealer",
    location: "Harrismith",
    job_type: "Part-time",
    category: "services",
    description:
      "Part-time bookkeeping and stock-taking for a general dealer in the northern Free State.",
    salary: "R6,000/month",
    application_email: "admin@mtview.co.za",
    posted_date: "2024-09-05",
    created_at: "2024-09-05",
  },
];

export function getJobById(id) {
  return JOBS.find((j) => String(j.id) === String(id)) || null;
}
