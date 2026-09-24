import supabase from "../supabaseClient.js";

const signupForm = document.querySelector("#signupForm");

if (signupForm) {
  signupForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const fullName = document.getElementById("fullName").value.trim();
    const emailOrPhone = document.getElementById("email").value.trim();
    const password = document.getElementById("signupPassword").value.trim();
    const confirmPassword = document.getElementById("confirmPassword").value.trim();
    const saId = document.getElementById("saId").value.trim();

    // Validate inputs
    if (!fullName || !emailOrPhone || !password || !confirmPassword || !saId) {
      alert("Please fill in all fields.");
      return;
    }

    if (password.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }
    
    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    // ✅ Validate SA ID (must be exactly 13 digits)
    if (!/^\d{13}$/.test(saId)) {
      alert("South African ID must be exactly 13 digits.");
      return;
    }

    let signUpPayload = {
      password,
      options: {
        data: {
          full_name: fullName,
          sa_id: saId,
        },
      },
    };

    // Detect email or phone
    let email = null;
    let phone = null;

    if (emailOrPhone.includes("@gmail.com")) {
      email = emailOrPhone;
      signUpPayload.email = email;
    } else if (emailOrPhone.startsWith("+27") && /^\+27\d{9}$/.test(emailOrPhone)) {
      phone = emailOrPhone;
      signUpPayload.phone = phone;
    } else {
      alert("Please enter a valid Gmail address or +27 phone number.");
      return;
    }

    try {
      // ✅ Step 1: Sign up auth user
      const { data: authData, error: authError } = await supabase.auth.signUp(signUpPayload);

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error("User creation failed.");
      }

      console.log("✅ Auth user created:", authData.user);

      // ✅ Step 2: Insert into user_profile table
      const userProfileData = {
        id: authData.user.id, // UUID from auth
        full_name: fullName,
        sa_id: saId,
        email: email,
        phone: phone,
        // Add other fields if needed, e.g.:
        // created_at: new Date().toISOString(),
      };

      const { error: insertError } = await supabase
        .from("user_profiles")
        .insert([userProfileData]);

      if (insertError) throw insertError;

      console.log("✅ User profile inserted into DB");

      alert("Signup successful! Please check your email or phone for verification.");

      // Redirect after success
      window.location.href = "../PAGES/dashboard.html"; // or wherever you want

    } catch (err) {
      console.error("🚫 Signup error:", err);
      alert("Error: " + (err.message || "Something went wrong."));
    }
  });
}