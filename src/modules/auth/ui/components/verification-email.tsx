import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from "@react-email/components";

export function VerificationEmail({ verifyUrl }: { verifyUrl: string }) {
  return (
    <Html>
      <Head />
      <Preview>Verify your email to get started with NEVO.dev</Preview>
      <Body style={{ backgroundColor: "#f6f9fc", fontFamily: "sans-serif" }}>
        <Container
          style={{
            backgroundColor: "#ffffff",
            margin: "40px auto",
            padding: "32px",
            borderRadius: "8px",
            maxWidth: "480px",
          }}
        >
          <Heading style={{ fontSize: "22px", margin: "0 0 16px" }}>Verify your email</Heading>
          <Text style={{ fontSize: "15px", lineHeight: "24px", color: "#444" }}>
            Thanks for signing up for NEVO.dev. Click the button below to confirm your email
            address.
          </Text>
          <Button
            href={verifyUrl}
            style={{
              backgroundColor: "#000",
              color: "#fff",
              padding: "12px 24px",
              borderRadius: "6px",
              fontSize: "15px",
              textDecoration: "none",
              display: "inline-block",
              margin: "16px 0",
            }}
          >
            Verify email
          </Button>
          <Text style={{ fontSize: "13px", color: "#888" }}>
            If you didn&apos;t create an account, you can safely ignore this email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
