import { Button, Text } from "@react-email/components";

import { AuthEmailLayout } from "./auth-email-layout";

export function VerificationEmail({ verifyUrl }: { verifyUrl: string }) {
  return (
    <AuthEmailLayout
      preview="Verify your email to get started with Drawly"
      heading="Verify your email"
      footnote="If you didn't create a Drawly account, you can safely ignore this email."
    >
      <Text style={text}>
        Thanks for signing up for Drawly. Confirm your email address to start creating boards, docs,
        and sessions.
      </Text>
      <Button href={verifyUrl} style={button}>
        Verify email
      </Button>
      <Text style={expiry}>This link expires in 1 hour.</Text>
    </AuthEmailLayout>
  );
}

const text: React.CSSProperties = {
  color: "#52525b",
  fontSize: "15px",
  lineHeight: "24px",
  margin: "0 0 24px",
};

const button: React.CSSProperties = {
  backgroundColor: "#171717",
  color: "#fafafa",
  padding: "12px 24px",
  borderRadius: "8px",
  fontSize: "15px",
  fontWeight: "600",
  textDecoration: "none",
  display: "inline-block",
};

const expiry: React.CSSProperties = {
  color: "#71717a",
  fontSize: "13px",
  lineHeight: "20px",
  margin: "16px 0 0",
};
