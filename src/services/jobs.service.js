/**
 * @file Jobs service.
 * @description Collaboration-board operations for job postings stored in
 * the Supabase `jobs` table. Supports listing, creating, applying to,
 * retrieving, and deleting jobs.
 */

import supabase from "./supabase.js";

/**
 * Retrieves job postings, optionally filtered by category or type.
 *
 * @param {Object} [filters] - Optional filter criteria.
 * @param {string} [filters.category] - Narrow results by category.
 * @param {string} [filters.type] - Narrow results by job type.
 * @param {number} [filters.limit] - Maximum number of results (default 50).
 * @returns {Promise<{ data: Object[]|null, error: Object|null }>}
 */
export async function getJobs(filters = {}) {
  const { category, type, limit = 50 } = filters;

  let query = supabase
    .from("jobs")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (category) query = query.eq("category", category);
  if (type) query = query.eq("job_type", type);

  const { data, error } = await query;
  if (error) return { data: null, error };
  return { data: data || [], error: null };
}

/**
 * Retrieves a single job by its ID.
 *
 * @param {string|number} id - The job posting ID.
 * @returns {Promise<{ data: Object|null, error: Object|null }>}
 */
export async function getJobById(id) {
  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return { data: null, error };
  return { data, error: null };
}

/**
 * Creates a new job posting.
 *
 * @param {Object} job - Job posting data.
 * @param {string} job.title - Job title.
 * @param {string} job.company - Company / organisation name.
 * @param {string} [job.location] - Job location.
 * @param {string} [job.type] - Job type (e.g. "Full-time").
 * @param {string} [job.category] - Job category.
 * @param {string} [job.salary] - Salary / compensation description.
 * @param {string} [job.applicationEmail] - Email for applications.
 * @param {string} [job.description] - Detailed job description.
 * @param {boolean} [job.isYouthOwned] - Whether the opportunity is youth-owned.
 * @param {string} [job.userId] - ID of the posting user.
 * @returns {Promise<{ data: Object|null, error: Object|null }>}
 */
export async function createJob({
  title,
  company,
  location,
  type,
  category,
  salary,
  applicationEmail,
  description,
  isYouthOwned,
  userId,
}) {
  if (!title || !company || !applicationEmail) {
    return { data: null, error: new Error("Title, company, and application email are required.") };
  }

  const payload = {
    title,
    company,
    location: location || null,
    job_type: type || null,
    category: category || null,
    salary: salary || null,
    application_email: applicationEmail,
    description: description || null,
    is_youth_owned: isYouthOwned || false,
    user_id: userId || null,
    posted_date: new Date().toISOString(),
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabase.from("jobs").insert([payload]).select();
  if (error) return { data: null, error };
  return { data: data?.[0] || null, error: null };
}

/**
 * Registers a user's application to a job. Applications are stored in the
 * `job_applications` table.
 *
 * @param {string|number} jobId - The job posting ID.
 * @param {string|Object} applicant - The applicant user ID or object.
 * @param {string} [coverLetter] - Optional cover letter / message.
 * @returns {Promise<{ data: Object|null, error: Object|null }>}
 */
export async function applyToJob(jobId, applicant, coverLetter) {
  const userId = typeof applicant === "string" ? applicant : applicant?.id;

  if (!jobId || !userId) {
    return { data: null, error: new Error("Job ID and applicant user ID are required.") };
  }

  const payload = {
    job_id: jobId,
    applicant_id: userId,
    cover_letter: coverLetter || null,
    applied_at: new Date().toISOString(),
    status: "pending",
  };

  const { data, error } = await supabase
    .from("job_applications")
    .insert([payload])
    .select();

  if (error) return { data: null, error };
  return { data: data?.[0] || null, error: null };
}

/**
 * Deletes a job posting by ID.
 *
 * @param {string|number} id - The job posting ID.
 * @param {string} [userId] - Optional owner ID to scope the deletion.
 * @returns {Promise<{ data: Object|null, error: Object|null }>}
 */
export async function deleteJob(id, userId) {
  let query = supabase.from("jobs").delete().eq("id", id);
  if (userId) query = query.eq("user_id", userId);

  const { data, error } = await query;
  return { data, error };
}
