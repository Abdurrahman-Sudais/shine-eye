/**
 * "Try an example" chips. Clearly-labelled sample inputs for demo reliability.
 * Domains and account numbers are fictional.
 */
export const SAMPLES = [
  {
    id: "bvn-pidgin",
    label: "Bank BVN alert (Pidgin)",
    text: "Dear customer, your GTB account don block because your BVN never update. Click https://gtbank-verify-ng.com/update sharp sharp to update am or we go close the account today. Send the OTP wey we go send you to confirm.",
  },
  {
    id: "job-fee",
    label: "Job offer with fee",
    text: "CONGRATULATIONS!! You have been shortlisted for the 2026 NNPC Graduate Trainee Programme. Monthly salary N450,000. To secure your slot, pay a refundable registration fee of N7,500 to Opay 8012345678 (Recruitment Desk) within 24 hours.",
  },
  {
    id: "relative-airtime",
    label: "\"It's me, send airtime\"",
    text: "Mummy na me, I dey use my friend phone, my phone fall inside water. Abeg send N20,000 to this account 2034567891 Moniepoint, I go explain later. No call this number o, network bad.",
  },
  {
    id: "legit-otp",
    label: "Real OTP notice",
    text: "Your one-time password for your transfer of N15,000 is 482913. It expires in 5 minutes. Do not share this code with anyone. Our staff will never ask for your OTP.",
  },
] as const;
