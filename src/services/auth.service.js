/**
 * @file Authentication service.
 * @description Provides sign-up, sign-in, sign-out, password reset, and
 * profile management functions backed by the Supabase auth and database
 * layers.
 */

import supabase from "./supabase.js";
import { validateEmail, validateRequiredFields } from "../utils/validators.js";

/**
 * Registers a new user.
 *
 * Creates the auth user and then inserts a matching row into the
 * `user_profiles` table.
 *
 * @param {Object} payload - Registration payload.
 * @param {string} payload.email - User email address.
 * @param {string} payload.password - User password (min 6 characters).
 * @param {string} [payload.fullName] - User's full display name.
 * @param {string} [payload.phone] - User phone number (+27 format).
 * @param {string} [payload.saId] - 13-digit South African ID number.
 * @param {Object} [payload.metadata] - Additional user metadata.
 * @returns {Promise<{data: Object|null, error: Object|null}>} The created user and profile.
 */
export async function signUp({ email, password, fullName, phone, saId, metadata = {} }) {
  const { error: validationError } = validateRequiredFields({ email, password });
  if (validationError) {
    return { data: null, error: validationError };
  }

  const emailValid = validateEmail(email);
  if (!emailValid.valid) {
    return { data: null, error: new Error(emailValid.message) };
  }

  if (password.length < 6) {
    return { data: null, error: new Error("Password must be at least 6 characters.") };
  }

  const signUpPayload = {
    password,
    options: {
      data: {
        full_name: fullName,
        sa_id: saId,
        ...metadata,
      },
    },
  };

  signUpPayload.email = email;

  try {
    const { data: authData, error: authError } = await supabase.auth.signUp(signUpPayload);
    if (authError) {
      return { data: null, error: authError };
    }

    const profileData = {
      id: authData.user?.id,
      full_name: fullName || null,
      email: email,
      phone: phone || null,
      sa_id: saId || null,
    };

    const { error: insertError } = await supabase
      .from("user_profiles")
      .insert([profileData]);

    if (insertError) {
      return { data: authData, error: insertError };
    }

    return { data: authData, error: null };
  } catch (err) {
    return { data: null, error: err };
  }
}

/**
 * Signs a user in with email and password.
 *
 * @param {string} email - User email address.
 * @param {string} password - User password.
 * @returns {Promise<{ data: Object|null, error: Object|null }>} The session data.
 */
export async function signIn(email, password) {
  const { error: validationError } = validateRequiredFields({ email, password });
  if (validationError) {
    return { data: null, error: validationError };
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { data, error };
}

/**
 * Signs out the currently authenticated user.
 *
 * @returns {Promise<{ error: Object|null }>}
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

/**
 * Retrieves the currently authenticated user.
 *
 * @returns {Promise<{ user: Object|null, error: Object|null }>}
 */
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
}

/**
 * Sends a password reset email to the given address.
 *
 * @param {string} email - User email address.
 * @param {string} [redirectTo] - URL the user is redirected to after resetting.
 * @returns {Promise<{ data: Object|null, error: Object|null }>}
 */
export async function resetPassword(email, redirectTo) {
  const emailValid = validateEmail(email);
  if (!emailValid.valid) {
    return { data: null, error: new Error(emailValid.message) };
  }

  const options = redirectTo ? { redirectTo } : undefined;
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, options);
  return { data, error };
}

/**
 * Updates the current user's password.
 *
 * @param {string} newPassword - The new password (min 6 characters).
 * @returns {Promise<{ data: Object|null, error: Object|null }>}
 */
export async function updatePassword(newPassword) {
  if (!newPassword || newPassword.length < 6) {
    return { data: null, error: new Error("Password must be at least 6 characters.") };
  }

  const { data, error } = await supabase.auth.updateUser({ password: newPassword });
  return { data, error };
}

/**
 * Updates the current user's profile in both the auth `user_metadata` and
 * the `user_profiles` table.
 *
 * @param {Object} profile - Profile fields to update.
 * @param {string} [profile.fullName] - Full name.
 * @param {string} [profile.email] - Email address.
 * @param {string} [profile.phone] - Phone number.
 * @param {string} [profile.location] - Physical location / address.
 * @param {string} [profile.saId] - South African ID number.
 * @param {string} [profile.avatarUrl] - Avatar image URL.
 * @returns {Promise<{ data: Object|null, error: Object|null }>}
 */
export async function updateUserProfile({ fullName, email, phone, location, saId, avatarUrl }) {
  const { user, error: userError } = await getCurrentUser();
  if (userError || !user) {
    return { data: null, error: userError || new Error("No authenticated user.") };
  }

  const updates = {};
  if (fullName) updates.full_name = fullName;
  if (email) updates.email = email;
  if (phone) updates.phone = phone;
  if (location) updates.location = location;
  if (saId) updates.sa_id = saId;
  if (avatarUrl) updates.data = { avatar_url: avatarUrl };

  if (Object.keys(updates).length === 0) {
    return { data: null, error: new Error("No fields provided to update.") };
  }

  try {
    const { error: authError } = await supabase.auth.updateUser({
      ...(email && { email }),
      ...(phone && { phone }),
      ...(fullName && { data: { full_name: fullName, ...(avatarUrl ? { avatar_url: avatarUrl } : {}) } }),
    });

    if (authError) {
      return { data: null, error: authError };
    }

    const { data, error: dbError } = await supabase
      .from("user_profiles")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)
      .select();

    if (dbError) {
      return { data, error: dbError };
    }

    return { data, error: null };
  } catch (err) {
    return { data: null, error: err };
  }
}

/**
 * Deletes the current user's profile (signs them out afterwards as a
 * safe client-side operation).
 *
 * @returns {Promise<{ error: Object|null }>}
 */
export async function deleteProfile() {
  const { user, error: userError } = await getCurrentUser();
  if (userError || !user) {
    return { error: userError || new Error("No authenticated user.") };
  }

  const { error: deleteError } = await supabase
    .from("user_profiles")
    .delete()
    .eq("id", user.id);

  if (deleteError) {
    return { error: deleteError };
  }

  const { error: signOutError } = await supabase.auth.signOut();
  return { error: signOutError };
}
