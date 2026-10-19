import { Button, Text } from "@react-email/components";

import { AuthEmailLayout } from "./auth-email-layout";

type Props = {
  resetUrl: string;
};

export function PasswordResetEmail({ resetUrl }: Props) {
  return (
    <AuthEmailLayout
      preview="Reset your password for Drawly"
      heading="Reset your password"
      footnote="If you didn't request this, you can safely ignore this email."
    >
      <Text style={text}>
        We received a request to reset the password for your Drawly account. Click the button below
        to choose a new one.
      </Text>
      <Button href={resetUrl} style={button}>
        Reset password
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
