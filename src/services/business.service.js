/**
 * @file Business service.
 * @description CRUD and search operations for businesses stored in the
 * Supabase `businesses` table. Lat/lng fields are normalised to
 * `latitude` and `longitude` on every record.
 */

import supabase from "./supabase.js";

/**
 * Normalises the latitude/longitude fields on a business record so the
 * service always exposes `lat` and `lng` properties regardless of which
 * column naming convention (`lat`/`lng`, `latitude`/`longitude`, or
 * `latlng` array) the row originated from.
 *
 * @param {Object} row - A raw database row.
 * @returns {Object} The normalised business object.
 */
function normaliseLatLng(row) {
  const rawLat = row.latitude || row.lat || (Array.isArray(row.latlng) ? row.latlng[0] : null);
  const rawLng = row.longitude || row.lng || (Array.isArray(row.latlng) ? row.latlng[1] : null);
  return {
    ...row,
    lat: rawLat != null ? Number(rawLat) : null,
    lng: rawLng != null ? Number(rawLng) : null,
  };
}

/**
 * Retrieves all businesses visible to the requester.
 *
 * @returns {Promise<{ data: Object[]|null, error: Object|null }>}
 */
export async function getAllBusinesses() {
  const { data, error } = await supabase.from("businesses").select("*");
  if (error) return { data: null, error };
  return { data: data?.map(normaliseLatLng) || [], error: null };
}

/**
 * Retrieves every business belonging to the given user.
 *
 * @param {string} userId - The authenticated user's ID.
 * @returns {Promise<{ data: Object[]|null, error: Object|null }>}
 */
export async function getUserBusinesses(userId) {
  const { data, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("user_id", userId);
  if (error) return { data: null, error };
  return { data: data?.map(normaliseLatLng) || [], error: null };
}

/**
 * Creates a new business record.
 *
 * The `lat` and `lng` values are written to the `latitude` and
 * `longitude` columns for consistency.
 *
 * @param {Object} business - Business data.
 * @param {string} business.name - Business name.
 * @param {string} [business.category] - Business category.
 * @param {string} [business.location] - Physical address.
 * @param {string} [business.description] - Short description.
 * @param {string} [business.phone] - Phone number.
 * @param {string} [business.email] - Email address.
 * @param {string} [business.cipcNumber] - CIPC registration number.
 * @param {number|string} [business.lat] - Latitude.
 * @param {number|string} [business.lng] - Longitude.
 * @param {string} [business.userId] - Owner user ID.
 * @param {boolean} [business.isYouthOwned] - Youth-owned flag.
 * @returns {Promise<{ data: Object|null, error: Object|null }>}
 */
export async function addBusiness({
  name,
  category,
  location,
  description,
  phone,
  email,
  cipcNumber,
  lat,
  lng,
  userId,
  isYouthOwned,
}) {
  const { error: validationError } = validateRequiredFieldsLocal({ name });
  if (validationError) return { data: null, error: validationError };

  const payload = {
    name,
    category: category || null,
    location: location || null,
    description: description || null,
    phone: phone || null,
    email: email || null,
    cipc_number: cipcNumber || null,
    latitude: lat != null ? Number(lat) : null,
    longitude: lng != null ? Number(lng) : null,
    user_id: userId || null,
    is_youth_owned: isYouthOwned || false,
    status: "pending",
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabase.from("businesses").insert([payload]).select();
  if (error) return { data: null, error };
  return { data: data?.[0] ? normaliseLatLng(data[0]) : null, error: null };
}

/**
 * Updates an existing business record by ID.
 *
 * @param {string|number} id - The business ID.
 * @param {Object} fields - Fields to update (lat/lng accepted).
 * @param {string} [fields.name]
 * @param {string} [fields.category]
 * @param {string} [fields.location]
 * @param {string} [fields.description]
 * @param {string} [fields.phone]
 * @param {string} [fields.email]
 * @param {number|string} [fields.lat]
 * @param {number|string} [fields.lng]
 * @returns {Promise<{ data: Object|null, error: Object|null }>}
 */
export async function updateBusiness(id, fields = {}) {
  const updates = { ...fields };
  if (fields.lat != null) {
    updates.latitude = Number(fields.lat);
    delete updates.lat;
  }
  if (fields.lng != null) {
    updates.longitude = Number(fields.lng);
    delete updates.lng;
  }
  if (updates.latitude !== undefined) updates.latitude = Number(updates.latitude);
  if (updates.longitude !== undefined) updates.longitude = Number(updates.longitude);

  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("businesses")
    .update(updates)
    .eq("id", id)
    .select();

  if (error) return { data: null, error };
  return { data: data?.[0] ? normaliseLatLng(data[0]) : null, error: null };
}

/**
 * Deletes a business by ID.
 *
 * @param {string|number} id - The business ID.
 * @param {string} [userId] - Optional owner ID to scope the deletion.
 * @returns {Promise<{ data: Object|null, error: Object|null }>}
 */
export async function deleteBusiness(id, userId) {
  let query = supabase.from("businesses").delete().eq("id", id);
  if (userId) query = query.eq("user_id", userId);

  const { data, error } = await query;
  return { data, error };
}

/**
 * Searches businesses by keyword across name, category, location, and
 * description columns using a case-insensitive match.
 *
 * @param {string} keyword - Search term.
 * @param {Object} [options] - Optional search options.
 * @param {number} [options.limit] - Maximum number of results.
 * @param {string} [options.category] - Narrow the search to a category.
 * @param {string} [options.userId] - Scope to a specific owner.
 * @returns {Promise<{ data: Object[]|null, error: Object|null }>}
 */
export async function searchBusinesses(keyword, options = {}) {
  const { limit, category, userId } = options;
  const term = (keyword || "").trim();
  if (!term) return { data: [], error: null };

  let query = supabase
    .from("businesses")
    .select("*")
    .or(
      `name.ilike.%${term}%,category.ilike.%${term}%,location.ilike.%${term}%,description.ilike.%${term}%`
    );

  if (category) query = query.eq("category", category);
  if (userId) query = query.eq("user_id", userId);
  if (limit) query = query.limit(limit);

  const { data, error } = await query;
  if (error) return { data: null, error };
  return { data: data?.map(normaliseLatLng) || [], error: null };
}

/**
 * Validates that required business fields are present.
 *
 * @param {Object} fields - Fields to check.
 * @returns {{ error: Error|null }}
 */
function validateRequiredFieldsLocal({ name }) {
  return { error: !name ? new Error("Business name is required.") : null };
}
