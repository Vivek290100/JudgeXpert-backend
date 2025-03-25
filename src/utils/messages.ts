export const SuccessMessages = {
  // Generic
  OPERATION_SUCCESS: "Operation completed successfully",
  
  // User
  SIGNUP_INITIATED: "Sign-up initiated successfully",
  OTP_VERIFIED_USER_CREATED: "OTP verified and user created successfully",
  OTP_RESENT: "OTP resent successfully",
  LOGIN_SUCCESS: "Login successful",
  GOOGLE_LOGIN_SUCCESS: "Google login successful",
  LOGOUT_SUCCESS: "Logged out successfully",
  PASSWORD_RESET_INITIATED: "Password reset initiated successfully",
  OTP_VERIFIED: "OTP verified successfully",
  PASSWORD_RESET_SUCCESS: "Password reset successfully",
  PROFILE_UPDATED: "Profile updated successfully",
  TOKEN_REFRESHED: "Token refreshed successfully",
  
  // Admin
  USERS_FETCHED: "Users fetched successfully",
  USER_FETCHED: "User fetched successfully",
  USER_BLOCKED: "User blocked successfully",
  USER_UNBLOCKED: "User unblocked successfully",
  
  // Problem
  PROBLEM_CREATED: "Problem created successfully",
  PROBLEM_FETCHED: "Problem fetched successfully",
  PROBLEM_STATUS_UPDATED: "Problem status updated successfully",
  PROBLEM_PROCESSED: "Problem processed successfully",
  PROBLEMS_FETCHED: "Problems fetched successfully",
  BOILERPLATE_ALL_GENERATED: "All boilerplates generated successfully",
  BOILERPLATE_SPECIFIC_GENERATED: "Boilerplate generated successfully for the problem",
  PROBLEM_UPDATED: "Problem updated successfully",
  PROBLEM_UNLINKED: (problemDir: string) => `Problem directory ${problemDir} unlinked successfully`,
  PROBLEM_BLOCKED: "Problem blocked successfully",
  PROBLEM_UNBLOCKED: "Problem unblocked successfully",
  CODE_EXECUTION_PASSED: "All test cases passed",
  CODE_EXECUTION_FAILED: "Some test cases failed",
  SUBMISSIONS_FETCHED: "Submissions fetched successfully",
};